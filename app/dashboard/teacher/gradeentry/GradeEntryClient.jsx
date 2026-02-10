"use client";

import { useState, useEffect } from "react";
import { 
  fetchGradeEntryData, 
  saveGradesToDb, 
  getTeacherDashboardStatsByEmail, 
  fetchSystemConfig 
} from "@/app/lib/data";
import styles from "@/app/ui/steacher/gradeentry/gradeentry.module.css";

const GradeEntryClient = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]); 
  const [filters, setFilters] = useState({ classid: "", quarter: 1 });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState("");

  // Use the email from the user object passed by the Server Page
  const userEmail = user?.email;

  // 1. Initial Load: Get classes for this specific teacher
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

  // 2. Lock Logic: Check deadlines whenever Quarter changes
  useEffect(() => {
    const checkLockStatus = async () => {
      const config = await fetchSystemConfig();
      if (!config) return;

      const today = new Date();
      const deadlineField = `q${filters.quarter}_deadline`;
      const deadlineDate = config[deadlineField] ? new Date(config[deadlineField]) : null;

      if (!config.is_editing_enabled) {
        setIsLocked(true);
        setLockReason("Grade editing has been manually disabled by the Registrar.");
      } else if (deadlineDate) {
        const endOfDeadline = new Date(deadlineDate);
        endOfDeadline.setHours(23, 59, 59, 999);

        if (today > endOfDeadline) {
          setIsLocked(true);
          setLockReason(`The deadline for Quarter ${filters.quarter} (${deadlineDate.toLocaleDateString()}) has passed.`);
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

  // 3. Data Sync: Fetch students when filters change
  useEffect(() => {
    if (!filters.classid) return;

    const getData = async () => {
      setLoading(true);
      try {
        const data = await fetchGradeEntryData(filters.classid, filters.quarter);
        setStudents(data || []);
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
    if (value !== "" && (parseFloat(value) < 0 || parseFloat(value) > 100)) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.gradeid === gradeid) {
          const updated = { ...s, [field]: value };
          const ww = parseFloat(updated.writtenwork) || 0;
          const pt = parseFloat(updated.performancetask) || 0;
          const final = (ww * 0.4) + (pt * 0.6);
          
          return {
            ...updated,
            finalgrade: Math.round(final),
            remarks: final >= 75 ? "PASSED" : "FAILED",
          };
        }
        return s;
      })
    );
  };

  const handleSave = async () => {
    if (students.length === 0 || isLocked) return;
    setIsSaving(true);
    const result = await saveGradesToDb(students);
    setIsSaving(false);

    if (result.success) {
      alert("✅ Grades saved successfully!");
    } else {
      alert(`❌ Failed to save: ${result.error}`);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.pageTitle}>Grade Entry Sheet</h2>
        </div>
        
        {isLocked && (
          <div className={styles.lockBanner}>
            <span>🔒 <strong>Locked:</strong> {lockReason}</span>
          </div>
        )}

        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <label>Subject & Section: </label>
            <select 
              className={styles.filterSelect}
              value={filters.classid}
              onChange={(e) => setFilters({...filters, classid: e.target.value})}
            >
              {subjects.map((sub) => (
                <option key={`sub-opt-${sub.classid}`} value={sub.classid}>
                  {sub.subject} ({sub.section})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Quarter: </label>
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
          <div className={styles.loadingWrapper}>Synchronizing data...</div>
        ) : (
          <table className={styles.gradeTable}>
            <thead>
              <tr>
                <th>LRN</th>
                <th>Student Name</th>
                <th style={{ width: '130px' }}>Written (40%)</th>
                <th style={{ width: '130px' }}>Performance (60%)</th>
                <th style={{ width: '90px' }}>Final</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((s, index) => (
                  <tr key={`grade-row-${s.enrollmentid || index}`}>
                    <td>{s.lrn}</td>
                    <td className={styles.studentName}>{s.studentName}</td>
                    <td>
                      <input 
                        type="number" 
                        className={`${styles.gradeInput} ${isLocked ? styles.inputLocked : ""}`}
                        value={s.writtenwork} 
                        disabled={isLocked}
                        onChange={(e) => handleGradeChange(s.gradeid, "writtenwork", e.target.value)}
                        onWheel={(e) => e.target.blur()}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className={`${styles.gradeInput} ${isLocked ? styles.inputLocked : ""}`}
                        value={s.performancetask} 
                        disabled={isLocked}
                        onChange={(e) => handleGradeChange(s.gradeid, "performancetask", e.target.value)}
                        onWheel={(e) => e.target.blur()}
                      />
                    </td>
                    <td className={styles.finalGradeCell}>{s.finalgrade}</td>
                    <td>
                      <span className={s.remarks === "PASSED" ? styles.statusPassed : styles.statusFailed}>
                        {s.remarks}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.emptyMessage}>No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.footer}>
        <button 
          onClick={handleSave} 
          className={isLocked ? styles.btnDisabled : styles.btnPrimary}
          disabled={isSaving || loading || students.length === 0 || isLocked}
        >
          {isLocked ? "Editing Locked" : isSaving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
};

export default GradeEntryClient;