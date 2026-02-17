"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  fetchGradeEntryData, 
  saveGradesToDb, 
  getTeacherDashboardStatsByEmail, 
  fetchSystemConfig,
  updateClassSubmissionStatus,
} from "@/app/lib/data";
import styles from "@/app/ui/steacher/gradeentry/gradeentry.module.css";

const GradeEntryClient = ({ user }) => {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]); 
  const [filters, setFilters] = useState({ classid: "", quarter: 1 });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // Track if grades are confirmed
  const [summary, setSummary] = useState({ passed: 0, failed: 0, average: 0 });

  const userEmail = user?.email;

  useEffect(() => {
    if (!userEmail) return;
    const loadInitialData = async () => {
      const classData = await getTeacherDashboardStatsByEmail(userEmail);
      if (classData && classData.length > 0) {
        setSubjects(classData);
        setFilters(prev => ({ ...prev, classid: classData[0].classid }));
      }
      setLoading(false);
    };
    loadInitialData();
  }, [userEmail]);

  useEffect(() => {
    const checkLockStatus = async () => {
      const config = await fetchSystemConfig();
      if (!config) return;
      const today = new Date();
      const deadlineField = `q${filters.quarter}_deadline`;
      const deadlineDate = config[deadlineField] ? new Date(config[deadlineField]) : null;

      if (!config.is_editing_enabled) {
        setIsLocked(true);
        setLockReason("Grade editing disabled by Registrar.");
      } else if (deadlineDate) {
        const endOfDeadline = new Date(deadlineDate);
        endOfDeadline.setHours(23, 59, 59, 999);
        if (today > endOfDeadline) {
          setIsLocked(true);
          setLockReason(`Quarter ${filters.quarter} deadline passed.`);
        } else {
          setIsLocked(false);
          setLockReason("");
        }
      } else {
        setIsLocked(false);
        setLockReason("");
      }
    };
    checkLockStatus();
  }, [filters.quarter]);

  useEffect(() => {
    if (!filters.classid) return;
    const getData = async () => {
      setLoading(true);
      try {
        const data = await fetchGradeEntryData(filters.classid, filters.quarter);
        const sortedData = (data || []).sort((a, b) => 
            a.studentName.toLowerCase().localeCompare(b.studentName.toLowerCase())
        );
        setStudents(sortedData);
        setIsSubmitted(false); // Reset on new class/quarter selection
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [filters]);

  const handleGradeChange = (gradeid, field, value) => {
    if (isLocked) return;
    if (value.length > 6) return; 

    setIsSubmitted(false); // Lock PDF button again if any edit occurs

    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && (numericValue > 100 || numericValue < 0)) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.gradeid === gradeid) {
          const updated = { ...s, [field]: value };
          const ww = parseFloat(updated.writtenwork) || 0;
          const pt = parseFloat(updated.performancetask) || 0;
          const final = (ww * 0.4) + (pt * 0.6);
          
          return {
            ...updated,
            finalgrade: final, 
            remarks: final >= 75 ? "PASSED" : "FAILED",
          };
        }
        return s;
      })
    );
  };

  const formatOnBlur = (gradeid, field, value) => {
    if (!value || isNaN(parseFloat(value))) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.gradeid === gradeid) {
          return { ...s, [field]: parseFloat(value).toFixed(2) };
        }
        return s;
      })
    );
  };

  const openPreview = () => {
    if (students.length === 0) return;
    const passed = students.filter(s => s.remarks === "PASSED").length;
    const failed = students.length - passed;
    const totalGrades = students.reduce((acc, s) => acc + (parseFloat(s.finalgrade) || 0), 0);
    const avg = totalGrades / students.length;
    
    setSummary({ passed, failed, average: avg.toFixed(2) });
    setShowPreview(true);
  };

  const generatePDF = () => {
    if (!isSubmitted) return; // Logic safeguard
    const doc = new jsPDF();
    const currentSubject = subjects.find(s => s.classid === filters.classid);
    
    doc.setFontSize(18);
    doc.setTextColor(45, 95, 79);
    doc.text("Grade Summary Report", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Subject: ${currentSubject?.subject} (${currentSubject?.section})`, 14, 30);
    doc.text(`Quarter: ${filters.quarter} | Class Avg: ${summary.average}%`, 14, 35);

    const tableRows = students.map(s => [
      s.lrn,
      s.studentName.toUpperCase(),
      parseFloat(s.writtenwork || 0).toFixed(2),
      parseFloat(s.performancetask || 0).toFixed(2),
      parseFloat(s.finalgrade || 0).toFixed(2),
      s.remarks
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['LRN', 'Student Name', 'Written', 'Performance', 'Final', 'Remarks']],
      body: tableRows,
      headStyles: { fillColor: [45, 95, 79] },
    });

    doc.save(`${currentSubject?.subject}_Q${filters.quarter}_Grades.pdf`);
  };

  const handleFinalSave = async () => {
    setIsSaving(true);
    const result = await saveGradesToDb(students);

    if (result.success) {
      const statusUpdate = await updateClassSubmissionStatus(
        Number(filters.classid), 
        filters.quarter,
        'forwarded'
      );

      setIsSaving(false);

      if (statusUpdate.success) {
        setIsSubmitted(true); // Unlock PDF Button
        alert("✅ Grades submitted successfully and forwarded to Key Teacher!");
        // Note: modal does NOT close here
      } else {
        alert("⚠️ Grades saved, but failed to update submission status.");
      }
    } else {
      setIsSaving(false);
      alert(`❌ Failed to save: ${result.error}`);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.pageTitle}>Grade Entry Sheet</h2>
          <p className={styles.subTitle}>S.Y. 2025-2026 | {new Date().toLocaleDateString()}</p>
        </div>
        
        {isLocked && (
          <div className={styles.lockBanner}>
            <span>🔒 <strong>Locked:</strong> {lockReason}</span>
          </div>
        )}

        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Subject & Section:  </label>
            <select 
              className={styles.filterSelect}
              value={filters.classid}
              onChange={(e) => setFilters({...filters, classid: e.target.value})}
            >
              {subjects.map((sub) => (
                <option key={sub.classid} value={sub.classid}>
                  {sub.subject} ({sub.section})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Quarter:  </label>
            <select 
              className={styles.filterSelect}
              value={filters.quarter}
              onChange={(e) => setFilters({...filters, quarter: parseInt(e.target.value)})}
            >
              <option value="1">1st Quarter</option>
              <option value="2">2nd Quarter</option>
              <option value="3">3rd Quarter</option>
              <option value="4">4th Quarter</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className={styles.gradeTableContainer}>
        {loading ? (
          <div className={styles.loadingWrapper}>Loading student list...</div>
        ) : (
          <table className={styles.gradeTable}>
            <thead>
              <tr>
                <th>LRN</th>
                <th>Student Name</th>
                <th style={{ width: '140px' }}>Written (40%)</th>
                <th style={{ width: '140px' }}>Performance (60%)</th>
                <th style={{ width: '100px' }}>Final</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.gradeid} className={s.remarks === "FAILED" ? styles.rowFailed : ""}>
                    <td>{s.lrn}</td>
                    <td className={styles.studentName}>{s.studentName}</td>
                    <td>
                      <input 
                        type="number" step="0.01"
                        className={`${styles.gradeInput} ${isLocked ? styles.inputLocked : ""}`}
                        value={s.writtenwork} 
                        disabled={isLocked}
                        placeholder="0.00"
                        onChange={(e) => handleGradeChange(s.gradeid, "writtenwork", e.target.value)}
                        onBlur={(e) => formatOnBlur(s.gradeid, "writtenwork", e.target.value)}
                        onWheel={(e) => e.target.blur()}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" step="0.01"
                        className={`${styles.gradeInput} ${isLocked ? styles.inputLocked : ""}`}
                        value={s.performancetask} 
                        disabled={isLocked}
                        placeholder="0.00"
                        onChange={(e) => handleGradeChange(s.gradeid, "performancetask", e.target.value)}
                        onBlur={(e) => formatOnBlur(s.gradeid, "performancetask", e.target.value)}
                        onWheel={(e) => e.target.blur()}
                      />
                    </td>
                    <td className={styles.finalGradeCell}>
                        {parseFloat(s.finalgrade || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={s.remarks === "PASSED" ? styles.statusPassed : styles.statusFailed}>
                        {s.remarks}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className={styles.emptyMessage}>No students found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.footer}>
        <button 
          onClick={openPreview} 
          className={isLocked ? styles.btnDisabled : styles.btnPrimary}
          disabled={isSaving || loading || students.length === 0 || isLocked}
        >
          {isLocked ? "Editing Period Ended" : "Preview & Save Changes"}
        </button>
      </div>

      {showPreview && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Grade Preview</h3>
              <p className={styles.modalDesc}>
                {isSubmitted ? "Submission Successful. You can now download the PDF." : "All grades formatted to 2-decimal precision."}
              </p>
            </div>
            
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}><span>Avg. Grade</span><strong>{summary.average}%</strong></div>
              <div className={styles.summaryItem}><span>Passed</span><strong className={styles.textSuccess}>{summary.passed}</strong></div>
              <div className={styles.summaryItem}><span>Failed</span><strong className={styles.textDanger}>{summary.failed}</strong></div>
            </div>

            <div className={styles.previewListContainer}>
              <table className={styles.previewTable}>
                <thead>
                  <tr><th>Student Name</th><th style={{ textAlign: 'right' }}>Final Grade</th></tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={`preview-${s.gradeid}`}>
                      <td>{s.studentName}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={s.finalgrade >= 75 ? styles.gradePass : styles.gradeFail}>
                          {parseFloat(s.finalgrade || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.modalActions}>
              <button 
                onClick={() => {
                   setShowPreview(false);
                   if (isSubmitted) router.refresh();
                }} 
                className={styles.btnCancel}
              >
                {isSubmitted ? "Close" : "Back"}
              </button>
              
              <button 
                onClick={generatePDF} 
                className={!isSubmitted ? styles.btnDisabled : styles.btnDownload}
                disabled={!isSubmitted}
              >
                Download PDF
              </button>
              
              <button 
                onClick={handleFinalSave} 
                className={isSubmitted ? styles.btnDisabled : styles.btnConfirm} 
                disabled={isSaving || isSubmitted}
              >
                {isSaving ? "Saving..." : isSubmitted ? "Submitted" : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeEntryClient;