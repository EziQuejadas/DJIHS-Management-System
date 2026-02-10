"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/ui/kteacher/assignsubjects/gradesummary.module.css';

const GradeSummaryClient = ({ initialData }) => {
  // Use the data passed from the server as the initial state
  const [summaries] = useState(initialData || []);
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <button 
          className={styles.backBtn} 
          onClick={() => router.back()}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Assignments
        </button>
        <h2>School-wide Grade Summary</h2>
      </div>

      {summaries.length === 0 ? (
        <div className={styles.emptyState}>No grade data available yet.</div>
      ) : (
        <div className={styles.grid}>
          {summaries.map((item, index) => (
            <div key={index} className={styles.card}>
              <h3>{item.className}</h3>
              <div className={styles.stat}>
                <span>Avg Grade:</span> <strong>{item.averageGrade}</strong>
              </div>
              <div className={styles.stat}>
                <span>Passing Rate:</span> <strong>{item.passingRate}</strong>
              </div>
              <div className={styles.stat}>
                <span>Students:</span> <strong>{item.studentCount}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradeSummaryClient;