"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { fetchSubmissionStatuses } from '@/app/lib/data';
import styles from '@/app/ui/kteacher/submissions/submissions.module.css';

/**
 * Sub-component for individual table rows
 * Now dynamically reacts to the verification_status in your database
 */
const SubmissionRow = ({ data }) => {
  const getStatusBadge = () => {
    switch (data.status) {
      case 'forwarded':
        return (
          <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
            <span className={styles.statusIcon}></span>
            Forwarded
          </span>
        );
      case 'review':
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`} style={{ backgroundColor: '#3b82f6' }}>
            <span className={styles.statusIcon}></span>
            In Review
          </span>
        );
      case 'completed':
        return (
          <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
            <span className={styles.statusIcon}></span>
            Completed
          </span>
        );
      case 'pending':
      case 'inprogress':
        return (
          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
            <span className={styles.statusIcon}></span>
            {data.pendingCount > 0 ? `${data.pendingCount} pending` : 'In Progress'}
          </span>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.statusNotStarted}`}>
            <span className={styles.statusIcon}></span>
            Not Started
          </span>
        );
    }
  };

  const handleReminder = (e) => {
    e.preventDefault();
    if (data.email) {
      navigator.clipboard.writeText(data.email);
      alert(`Email copied to clipboard: ${data.email}\nYou can now paste it into your email.`);
    } else {
      alert("No email available for this teacher.");
    }
  };

  return (
    <tr>
      <td>{data.teacher}</td>
      <td>{data.subject}</td>
      <td>{data.section}</td>
      <td>{getStatusBadge()}</td>
      <td>
        {['forwarded', 'completed'].includes(data.status) ? (
          <span className={styles.doneText}>Verified ✓</span>
        ) : (
          <button 
            className={styles.actionLink} 
            onClick={handleReminder}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Send Reminder
          </button>
        )}
      </td>
    </tr>
  );
};

/**
 * Main Submissions Page Component
 * Exported as a default function to avoid Next.js "Server Action" confusion
 */
export default function SubmissionsPage() {
  const [submissionsData, setSubmissionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(1);

  // loadData is wrapped in useCallback to ensure stability
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSubmissionStatuses(quarter);
      setSubmissionsData(data || []);
    } catch (err) {
      console.error("Failed to load submission data:", err);
      setSubmissionsData([]);
    } finally {
      setLoading(false);
    }
  }, [quarter]);

  // Initial load and reload when quarter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Grade Submission Status</h2>
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
          <button className={styles.viewAllBtn} onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.submissionsContainer}>
        {loading ? (
          <div className={styles.loadingWrapper}>
            <p className={styles.loadingText}>Fetching database records...</p>
          </div>
        ) : (
          <table className={styles.submissionsTable}>
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Subject</th>
                <th>Section</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissionsData.length > 0 ? (
                submissionsData.map((item) => (
                  <SubmissionRow key={item.id} data={item} />
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.emptyRow}>
                    No records found for Quarter {quarter}.
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