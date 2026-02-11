"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { fetchVerificationData, fetchGradeEntryData } from '@/app/lib/data';
import { supabase } from '@/app/lib/utils';
import styles from '@/app/ui/kteacher/verification/verification.module.css';

export default function VerificationPage() {
  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(1);
  const [selectedClass, setSelectedClass] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchVerificationData(quarter);
      
      const grouped = (data || []).reduce((acc, row) => {
        if (!acc[row.name]) acc[row.name] = [];
        acc[row.name].push(row);
        return acc;
      }, {});
      
      setGroupedData(grouped);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [quarter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateStatus = async (id, newStatus) => {
    const statusColumn = `q${quarter}_status`; 
    const { error } = await supabase
      .from('classes')
      .update({ [statusColumn]: newStatus })
      .eq('classid', id);

    if (!error) {
      loadData(); 
    } else {
      alert("Error updating status: " + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h2 className={styles.pageTitle}>Verification & Forwarding</h2>
          <p className={styles.pageSubtitle}>Quarterly Grade Review for Key Teachers</p>
        </div>
        
        <div className={styles.headerActions}>
          <select 
            className={styles.filterDropdown} 
            value={quarter}
            onChange={(e) => setQuarter(parseInt(e.target.value))}
          >
            {[1, 2, 3, 4].map(q => <option key={q} value={q}>Quarter {q}</option>)}
          </select>
          <button className={styles.viewAllBtn} onClick={loadData}>Refresh Data</button>
        </div>
      </div>

      <div className={styles.verificationContainer}>
        {loading ? (
          <div className={styles.loadingState}>Loading Quarter {quarter} submissions...</div>
        ) : (
          <table className={styles.verificationTable}>
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th className={styles.textCenter}>Subjects</th>
                <th className={styles.textCenter}>Progress</th>
                <th>Actions & Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedData).map(([teacherName, classes]) => (
                <TeacherGroupRow 
                  key={`${teacherName}-${quarter}`}
                  teacherName={teacherName} 
                  classes={classes} 
                  quarter={quarter}
                  onUpdateStatus={handleUpdateStatus}
                  refresh={loadData}
                  onViewGrades={(cls) => setSelectedClass({ ...cls, currentQuarter: quarter })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedClass && (
        <GradePreviewModal 
          classData={selectedClass} 
          onClose={() => setSelectedClass(null)} 
        />
      )}
    </div>
  );
}

/* --- Teacher Group Row (Per-Teacher Actions) --- */
const TeacherGroupRow = ({ teacherName, classes, quarter, onUpdateStatus, onViewGrades, refresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const total = classes.length;
  const verifiedCount = classes.filter(c => c.status === 'completed').length;
  const isFullyDone = verifiedCount === total;
  const hasResubmission = classes.some(c => c.status === 'resubmitted');

  const handleForwardTeacherAll = async (e) => {
    e.stopPropagation();
    const pendingIds = classes.filter(c => c.status !== 'completed').map(c => c.id);
    
    if (pendingIds.length === 0) return;

    const confirmAction = confirm(`Forward all ${pendingIds.length} subjects of ${teacherName} to the Registrar?`);
    if (confirmAction) {
      const statusColumn = `q${quarter}_status`;
      const { error } = await supabase
        .from('classes')
        .update({ [statusColumn]: 'completed' })
        .in('classid', pendingIds);

      if (!error) {
        refresh();
      } else {
        alert("Batch update failed: " + error.message);
      }
    }
  };

  return (
    <>
      <tr onClick={() => setIsOpen(!isOpen)} className={styles.mainRow}>
        <td>
          <span className={styles.chevron}>{isOpen ? '▼' : '▶'}</span>
          <strong>{teacherName}</strong>
        </td>
        <td className={styles.textCenter}>{total}</td>
        <td className={styles.textCenter}>
          <span className={isFullyDone ? styles.textSuccess : styles.textWarning}>
            {verifiedCount} / {total} Verified
          </span>
        </td>
        <td className={styles.statusCell}>
          <span className={`${styles.statusBadge} ${
            hasResubmission ? styles.statusResubmitted : 
            isFullyDone ? styles.statusCompleted : styles.statusPending
          }`}>
            {hasResubmission ? 'Needs Re-verification' : isFullyDone ? 'Completed' : 'Pending'}
          </span>
          
          {!isFullyDone && (
            <button className={styles.teacherQuickBtn} onClick={handleForwardTeacherAll}>
              Verify & Forward All
            </button>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr className={styles.detailRow}>
          <td colSpan="4">
            <div className={styles.detailWrapper}>
              <table className={styles.detailTable}>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Status</th>
                    <th className={styles.textRight}>Single Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((row) => (
                    <tr key={row.id}>
                      <td>{row.subject} - {row.section}</td>
                      <td><StatusBadge status={row.status} /></td>
                      <td className={styles.textRight}>
                        <div className={styles.actionIcons}>
                          <ActionButton title="View" icon={<ViewIcon />} onClick={() => onViewGrades(row)} />
                          <ActionButton 
                            title="Verify" 
                            icon={<VerifyIcon />} 
                            onClick={() => onUpdateStatus(row.id, 'review')}
                            disabled={row.status === 'review' || row.status === 'completed'}
                          />
                          <ActionButton 
                            title="Forward" 
                            icon={<ForwardIcon />} 
                            onClick={() => onUpdateStatus(row.id, 'completed')}
                            disabled={row.status !== 'review'}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const StatusBadge = ({ status }) => {
  const statusStyles = {
    resubmitted: { class: styles.statusResubmitted, label: "RE-SUBMITTED" }, 
    submitted: { class: styles.statusInProgress, label: "New Submission" }, 
    review: { class: styles.statusReview, label: "Verified" }, 
    completed: { class: styles.statusCompleted, label: "Forwarded" }, 
  };
  const config = statusStyles[status] || { class: styles.statusNotStarted, label: "Not Started" };
  return <span className={`${styles.statusBadge} ${config.class}`}>{config.label}</span>;
};

const GradePreviewModal = ({ classData, onClose }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getGrades() {
      setLoading(true);
      const data = await fetchGradeEntryData(classData.id, classData.currentQuarter);
      setGrades(data || []);
      setLoading(false);
    }
    getGrades();
  }, [classData]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{classData.subject} Preview</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          {loading ? <p>Loading...</p> : (
            <table className={styles.previewTable}>
              <thead>
                <tr><th>LRN</th><th>Name</th><th>Grade</th></tr>
              </thead>
              <tbody>
                {grades.map((g, i) => (
                  <tr key={i}>
                    <td>{g.lrn}</td>
                    <td>{g.studentName}</td>
                    <td><strong>{g.finalgrade ? parseFloat(g.finalgrade).toFixed(0) : '0'}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ title, icon, onClick, disabled }) => (
  <button 
    title={title}
    className={`${styles.actionBtn} ${disabled ? styles.btnDisabled : ""}`} 
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
  >
    {icon}
  </button>
);

const ViewIcon = () => <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const VerifyIcon = () => <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ForwardIcon = () => <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;