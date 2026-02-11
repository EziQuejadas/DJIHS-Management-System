"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { fetchAllAssignments, deleteAssignment } from '@/app/lib/data'; 
import styles from '@/app/ui/kteacher/assignsubjects/assignsubjects.module.css';

const AssignSubjectsPage = () => {
  const [groupedAssignments, setGroupedAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllAssignments();
      
      // Grouping by teacher
      const grouped = (data || []).reduce((acc, item) => {
        if (!acc[item.teacher]) acc[item.teacher] = [];
        acc[item.teacher].push(item);
        return acc;
      }, {});

      setGroupedAssignments(grouped);
    } catch (err) {
      console.error("Failed to load assignments:", err);
      setError("Could not load assignments. Please check your database connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to remove this assignment?")) {
      const { error } = await deleteAssignment(id);
      if (error) {
        alert("Error deleting assignment: " + error.message);
      } else {
        loadData(); // Refresh the grouped data
        alert("Assignment successfully removed.");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Current Subject Assignments</h2>
        <div className={styles.pageDate}>
          {new Date().toLocaleDateString('en-US', { 
            month: 'short', day: '2-digit', year: 'numeric' 
          })} | S.Y. 2025-26
        </div>
      </div>

      <div className={styles.assignmentsContainer}>
        {loading ? (
          <div className={styles.loadingState}><p>Fetching records...</p></div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={loadData} className={styles.retryBtn}>Retry</button>
          </div>
        ) : (
          <table className={styles.assignmentsTable}>
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th className={styles.textCenter}>Load (Subjects)</th>
                <th className={styles.textCenter}>Total Students</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupedAssignments).length > 0 ? (
                Object.entries(groupedAssignments).map(([teacher, subjects]) => (
                  <TeacherAssignmentRow 
                    key={teacher} 
                    teacher={teacher} 
                    subjects={subjects} 
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="4" className={styles.emptyRow}>
                    No subject assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.footer}>
        <Link href="/dashboard/kteacher/assignsubjects/gradesummary">
          <button className={styles.gradeSummaryBtn}>View Grade Summary</button>
        </Link>
      </div>
    </div>
  );
};

const TeacherAssignmentRow = ({ teacher, subjects, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const totalStudents = subjects.reduce((sum, s) => sum + (Number(s.students) || 0), 0);

  return (
    <>
      <tr onClick={() => setIsOpen(!isOpen)} className={styles.mainRow}>
        <td>
          <span className={styles.accordionIcon}>{isOpen ? '▼' : '▶'}</span>
          <strong>{teacher}</strong>
        </td>
        <td className={styles.textCenter}>{subjects.length}</td>
        <td className={styles.textCenter}>{totalStudents}</td>
        <td>
          <span className={`${styles.statusBadge} ${styles.statusAssigned}`}>
            Assigned
          </span>
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
                    <th>Section</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((item) => (
                    <tr key={item.id}>
                      <td>{item.subject}</td>
                      <td>{item.section}</td>
                      <td>{item.students}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          item.status === 'Assigned' ? styles.statusAssigned : styles.statusPending
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionIcons}>
                          <ActionButton icon="view" title="View" />
                          <ActionButton icon="edit" title="Edit" />
                          <ActionButton 
                            icon="remove" 
                            title="Remove" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
                            }} 
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

const ActionButton = ({ icon, title, onClick }) => {
  const icons = {
    view: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    remove: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  };

  return (
    <button className={styles.actionBtn} title={title} onClick={onClick}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
        {icons[icon]}
      </svg>
    </button>
  );
};

export default AssignSubjectsPage;