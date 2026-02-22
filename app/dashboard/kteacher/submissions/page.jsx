"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { fetchSubmissionStatuses } from '@/app/lib/data';
import styles from '@/app/ui/kteacher/submissions/submissions.module.css';
// 1. Import the Guard
import RoleGuard from "@/app/components/ProtectedRoutes";

const TeacherRow = ({ teacher, classes }) => {
  const [isOpen, setIsOpen] = useState(false);

  const totalClasses = classes.length;
  const submittedClasses = classes.filter(c => ['forwarded', 'completed'].includes(c.status)).length;
  const isFullyDone = totalClasses === submittedClasses;

  const sortedClasses = [...classes].sort((a, b) => 
    a.subject.localeCompare(b.subject)
  );

  return (
    <>
      <tr 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ cursor: 'pointer', backgroundColor: isOpen ? '#f8fafc' : 'transparent' }}
      >
        <td>
          <span style={{ marginRight: '10px' }}>{isOpen ? '▼' : '▶'}</span>
          <strong>{teacher}</strong>
        </td>
        <td style={{ textAlign: 'center' }}>{totalClasses}</td>
        <td style={{ textAlign: 'center' }}>
          <span style={{ color: isFullyDone ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
            {submittedClasses} / {totalClasses}
          </span>
        </td>
        <td>
          <span className={`${styles.statusBadge} ${isFullyDone ? styles.statusCompleted : styles.statusPending}`}>
            {isFullyDone ? 'Completed' : 'Pending'}
          </span>
        </td>
      </tr>
      
      {isOpen && (
        <tr>
          <td colSpan="4" style={{ padding: '0 0 20px 40px', backgroundColor: '#f8fafc' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px' }}>Subject</th>
                  <th style={{ padding: '8px' }}>Section</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedClasses.map((cls, idx) => {
                  const isSubmitted = ['forwarded', 'completed'].includes(cls.status);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>{cls.subject}</td>
                      <td style={{ padding: '8px' }}>{cls.section}</td>
                      <td style={{ padding: '8px' }}>
                        <span className={`${styles.statusBadge} ${isSubmitted ? styles.statusSubmitted : styles.statusWaiting}`}>
                          {isSubmitted ? 'Submitted' : 'Waiting'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
};

// Internal content component
function SubmissionsContent() {
  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(1);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const rawData = await fetchSubmissionStatuses(quarter);
      
      const grouped = (rawData || []).reduce((acc, item) => {
        if (!acc[item.teacher]) acc[item.teacher] = [];
        acc[item.teacher].push(item);
        return acc;
      }, {});

      setGroupedData(grouped);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [quarter]);

  useEffect(() => { loadData(); }, [loadData]);

  const sortedTeacherEntries = Object.entries(groupedData).sort(([nameA], [nameB]) => 
    nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Teacher Submission Overview</h2>
        <div className={styles.headerActions}>
          <select 
            className={styles.filterDropdown} 
            value={quarter} 
            onChange={(e) => setQuarter(parseInt(e.target.value))}
          >
            <option value={1}>Quarter 1</option>
            <option value={2}>Quarter 2</option>
            <option value={3}>Quarter 3</option>
            <option value={4}>Quarter 4</option>
          </select>
          <button className={styles.viewAllBtn} onClick={loadData}>Refresh</button>
        </div>
      </div>

      <div className={styles.submissionsContainer}>
        {loading ? (
          <div className={styles.loadingWrapper}><p>Loading records...</p></div>
        ) : (
          <table className={styles.submissionsTable}>
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th style={{ textAlign: 'center' }}>Total Subjects</th>
                <th style={{ textAlign: 'center' }}>Progress</th>
                <th>Overall Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeacherEntries.length > 0 ? (
                sortedTeacherEntries.map(([teacherName, classes]) => (
                  <TeacherRow key={teacherName} teacher={teacherName} classes={classes} />
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No data available for Quarter {quarter}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// 2. Export with RoleGuard
export default function SubmissionsPage() {
  return (
    <RoleGuard allowedRole="key teacher">
      <SubmissionsContent />
    </RoleGuard>
  );
}