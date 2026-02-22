"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/utils';
import { fetchAllAssignments, deleteAssignment } from '@/app/lib/data'; 
import styles from '@/app/ui/kteacher/assignsubjects/assignsubjects.module.css';
import RoleGuard from "@/app/components/ProtectedRoutes";

const AssignSubjectsPageContent = () => {
  const [groupedAssignments, setGroupedAssignments] = useState({});
  const [allTeachers, setAllTeachers] = useState([]); // Store teacher list for reassignment
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [modalMode, setModalMode] = useState(null); 
  const [isModalLoading, setIsModalLoading] = useState(false);

  // 1. Load Main Data and Teacher List
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignmentsData, teachersRes] = await Promise.all([
        fetchAllAssignments(),
        supabase.from('teachers').select('teacherid, firstname, lastname').order('lastname')
      ]);
      
      setAllTeachers(teachersRes.data || []);

      const grouped = (assignmentsData || []).reduce((acc, item) => {
        if (!acc[item.teacher]) acc[item.teacher] = [];
        acc[item.teacher].push(item);
        return acc;
      }, {});

      const sortedTeachers = Object.keys(grouped).sort((a, b) => 
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );

      const sortedGrouped = sortedTeachers.reduce((acc, key) => {
        acc[key] = grouped[key];
        return acc;
      }, {});

      setGroupedAssignments(sortedGrouped);
    } catch (err) {
      setError("Could not load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 2. View Student List Logic
  const handleView = async (item) => {
    if (!item.sectionid) {
      alert("Error: Section ID is missing for this assignment.");
      return;
    }

    setIsModalLoading(true);
    setModalMode('view');
    setSelectedAssignment(item);

    try {
      const { data: enrollmentData, error } = await supabase
        .from('enrollments')
        .select(`lrn, students (firstname, lastname)`)
        .eq('sectionid', item.sectionid);

      if (error) throw error;

      const formattedStudents = (enrollmentData || [])
        .filter(e => e.students)
        .map(e => ({
          lrn: e.lrn,
          firstname: e.students?.firstname || 'Unknown',
          lastname: e.students?.lastname || 'Unknown'
        }))
        .sort((a, b) => a.lastname.localeCompare(b.lastname));

      setSelectedAssignment({ ...item, studentList: formattedStudents });
    } catch (err) {
      console.error("View Error:", err);
      alert("Failed to load student list.");
    } finally {
      setIsModalLoading(false);
    }
  };

  // 3. Edit / Reassign Logic
  const handleEdit = (item) => {
    setSelectedAssignment({ ...item }); 
    setModalMode('edit');
  };

  const handleSaveEdit = async () => {
    try {
      // Logic: Update the teacherid in the classes table
      const { error } = await supabase
        .from('classes')
        .update({ teacherid: selectedAssignment.teacherid })
        .eq('classid', selectedAssignment.id);

      if (error) throw error;

      alert(`✅ Assignment moved successfully!`);
      setModalMode(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to update teacher assignment.");
    }
  };

  // 4. Delete Logic (Enforced Business Rule)
  const handleDelete = async (item) => {
    // RULE: Cannot delete a class that has students enrolled
    if (item.students > 0) {
      alert(`⚠️ Action Blocked: This class has ${item.students} students. \n\nYou cannot remove an active assignment. Please use the "Edit" button to reassign this class to another teacher first.`);
      return;
    }

    if (confirm(`Are you sure you want to remove the ${item.subject} assignment?`)) {
      const { error } = await deleteAssignment(item.id);
      if (error) alert("Error: " + error.message);
      else { 
        loadData(); 
        alert("Assignment removed."); 
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Current Subject Assignments</h2>
        <div className={styles.pageDate}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} | S.Y. 2025-26
        </div>
      </div>

      <div className={styles.assignmentsContainer}>
        {loading ? (
          <div className={styles.loadingState}><p>Fetching records...</p></div>
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
              {Object.entries(groupedAssignments).map(([teacher, subjects]) => (
                <TeacherAssignmentRow 
                  key={teacher} 
                  teacher={teacher} 
                  subjects={subjects} 
                  onDelete={handleDelete}
                  onView={handleView}
                  onEdit={handleEdit}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode && selectedAssignment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{modalMode === 'view' ? 'Section Class List' : 'Move Assignment'}</h3>
              <button className={styles.closeX} onClick={() => setModalMode(null)}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              {modalMode === 'view' ? (
                <div className={styles.studentListView}>
                  <div className={styles.viewHeaderInfo}>
                    <div><strong>Subject:</strong> {selectedAssignment.subject}</div>
                    <div><strong>Section:</strong> {selectedAssignment.section}</div>
                    <div><strong>Total:</strong> {selectedAssignment.studentList?.length || 0}</div>
                  </div>
                  
                  {isModalLoading ? (
                    <p style={{textAlign: 'center', padding: '20px'}}>Loading database...</p>
                  ) : (
                    <div className={styles.studentTableWrapper}>
                      <table className={styles.studentListTable}>
                        <thead>
                          <tr>
                            <th>LRN</th>
                            <th>Student Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAssignment.studentList?.length > 0 ? (
                            selectedAssignment.studentList.map((st) => (
                              <tr key={st.lrn}>
                                <td>{st.lrn}</td>
                                <td>{st.lastname}, {st.firstname}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan="2" style={{textAlign: 'center'}}>No students found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.editForm}>
                  <div className={styles.viewHeaderInfo}>
                    <p>Moving <strong>{selectedAssignment.subject}</strong> ({selectedAssignment.section})</p>
                    <p>Current Teacher: <em>{selectedAssignment.teacher}</em></p>
                  </div>
                  
                  <div className={styles.formField} style={{marginTop: '15px'}}>
                    <label>Assign to New Teacher:</label>
                    <select 
                      className={styles.teacherSelect}
                      value={selectedAssignment.teacherid}
                      onChange={(e) => setSelectedAssignment({...selectedAssignment, teacherid: e.target.value})}
                    >
                      {allTeachers.map(t => (
                        <option key={t.teacherid} value={t.teacherid}>
                          {t.lastname}, {t.firstname}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className={styles.warningNote}>
                    Note: All students enrolled in this section will be transferred to the new teacher's load.
                  </p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setModalMode(null)}>Close</button>
              {modalMode === 'edit' && <button className={styles.saveBtn} onClick={handleSaveEdit}>Transfer Assignment</button>}
            </div>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <Link href="/dashboard/kteacher/assignsubjects/gradesummary">
          <button className={styles.gradeSummaryBtn}>View Grade Summary</button>
        </Link>
      </div>
    </div>
  );
};

const TeacherAssignmentRow = ({ teacher, subjects, onDelete, onView, onEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalStudents = subjects.reduce((sum, s) => sum + (Number(s.students) || 0), 0);

  return (
    <>
      <tr onClick={() => setIsOpen(!isOpen)} className={styles.mainRow}>
        <td><span className={styles.accordionIcon}>{isOpen ? '▼' : '▶'}</span><strong>{teacher}</strong></td>
        <td className={styles.textCenter}>{subjects.length}</td>
        <td className={styles.textCenter}>{totalStudents}</td>
        <td><span className={`${styles.statusBadge} ${styles.statusAssigned}`}>Assigned</span></td>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((item) => (
                    <tr key={item.id}>
                      <td>{item.subject}</td>
                      <td>{item.section}</td>
                      <td>
                        <div className={styles.actionIcons}>
                          <ActionButton icon="view" onClick={(e) => { e.stopPropagation(); onView(item); }} />
                          <ActionButton icon="edit" onClick={(e) => { e.stopPropagation(); onEdit(item); }} />
                          <ActionButton icon="remove" onClick={(e) => { e.stopPropagation(); onDelete(item); }} />
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

const ActionButton = ({ icon, onClick }) => {
  const icons = {
    view: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />, // Replaced with a "transfer" style icon
    remove: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  };
  return (
    <button className={styles.actionBtn} onClick={onClick}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">{icons[icon]}</svg>
    </button>
  );
};

export default function AssignSubjectsPage() {
  return (
    <RoleGuard allowedRole="key teacher">
      <AssignSubjectsPageContent />
    </RoleGuard>
  );
}