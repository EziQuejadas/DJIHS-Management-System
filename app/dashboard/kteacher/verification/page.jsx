"use client";

import React, { useState, useEffect } from 'react';
import { fetchVerificationData } from '@/app/lib/data';
import { supabase } from '@/app/lib/utils';
import styles from '@/app/ui/kteacher/verification/verification.module.css';

const VerificationPage = () => {
  const [verificationData, setVerificationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchVerificationData(quarter);
      setVerificationData(data);
    } catch (err) {
      console.error("Error loading verification data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quarter]);

  // Function to update status in Database
  const handleUpdateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('classes')
      .update({ verification_status: newStatus })
      .eq('classid', id);

    if (error) {
      alert("Failed to update status");
    } else {
      loadData(); // Refresh list
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Grade Verification & Forwarding</h2>
        <div className={styles.headerActions}>
          <select 
            className={styles.filterDropdown} 
            onChange={(e) => setQuarter(e.target.value)}
          >
            <option value="1">Quarter 1</option>
            <option value="2">Quarter 2</option>
            <option value="3">Quarter 3</option>
            <option value="4">Quarter 4</option>
          </select>
          <button className={styles.viewAllBtn} onClick={loadData}>Refresh</button>
        </div>
      </div>

      <div className={styles.verificationContainer}>
        {loading ? (
          <p>Loading records...</p>
        ) : (
          <table className={styles.verificationTable}>
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Subject</th>
                <th>Section</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {verificationData.map((row) => (
                <TableRow 
                  key={row.id} 
                  data={row} 
                  onForward={() => handleUpdateStatus(row.id, 'forwarded')}
                  onVerify={() => handleUpdateStatus(row.id, 'review')}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const TableRow = ({ data, onForward, onVerify }) => {
  const statusStyles = {
    review: { class: styles.toReview, label: "To Review" },
    forwarded: { class: styles.forwarded, label: "Forwarded" },
    notstarted: { class: styles.notStarted, label: "Not Started" },
    completed: { class: styles.completed, label: "Completed" },
    inprogress: { class: styles.inProgress, label: "In Progress" },
  };

  const currentStatus = statusStyles[data.status] || statusStyles.notstarted;

  return (
    <tr>
      <td>{data.name}</td>
      <td>{data.subject}</td>
      <td>{data.section}</td>
      <td>{data.date}</td>
      <td>
        <span className={`${styles.statusBadge} ${currentStatus.class}`}>
          <span className={styles.statusIcon}></span>
          {currentStatus.label}
        </span>
      </td>
      <td>
        <div className={styles.actionIcons}>
          <ActionButton title="View" icon={<ViewIcon />} />
          <ActionButton title="Verify" icon={<VerifyIcon />} onClick={onVerify} />
          <ActionButton title="Forward" icon={<ForwardIcon />} onClick={onForward} />
        </div>
      </td>
    </tr>
  );
};

const ActionButton = ({ title, icon, onClick }) => (
  <button className={styles.actionBtn} title={title} onClick={onClick}>
    {icon}
  </button>
);

// ... (Keep your SVG Icon components exactly as they were)
const ViewIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
  
  const VerifyIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  
  const ForwardIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );

export default VerificationPage;