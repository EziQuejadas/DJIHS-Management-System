"use client";

import { useState, useEffect } from "react";
import { fetchMyClasses, fetchAdvisoryStudents, fetchClassStudents } from "@/app/lib/data";
import styles from "@/app/ui/steacher/classes/classes.module.css";

const MyClassesClient = ({ user }) => {
  const [data, setData] = useState({ advisory: null, subjectClasses: [] });
  const [loading, setLoading] = useState(true);

  // --- MODAL & STUDENT STATE ---
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedId, setSelectedId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const teacherEmail = user?.email;

  // Initial Fetch for Cards
  useEffect(() => {
    if (!teacherEmail) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await fetchMyClasses(teacherEmail);
        setData(result);
      } catch (error) {
        console.error("Error fetching teaching data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [teacherEmail]);

  // Fetch student names when modal opens
  useEffect(() => {
    if (!activeModal || !selectedId) return;

    const getNames = async () => {
      setLoadingStudents(true);
      let list = [];
      try {
        if (activeModal === 'advisory') {
          list = await fetchAdvisoryStudents(selectedId);
        } else {
          list = await fetchClassStudents(selectedId);
        }
        setStudents(list);
      } catch (err) {
        console.error("Error loading names:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    getNames();
  }, [activeModal, selectedId]);

  const handleOpenModal = (type, id) => {
    setSelectedId(id);
    setActiveModal(type);
    document.body.style.overflow = "hidden";
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedId(null);
    setStudents([]);
    document.body.style.overflow = "auto";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.pageTitle}>Teaching Load & Advisory</h2>
          <p className={styles.pageSubtitle}>
            School Year 2025-2026 | Manage your section and subject classes
          </p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading your profile...</p>
        </div>
      ) : (
        <div className={styles.contentWrapper}>
          
          {/* --- ADVISORY SECTION --- */}
          {data.advisory && (
            <div className={styles.sectionGroup}>
              <h3 className={styles.groupLabel}>Advisory Assignment</h3>
              <div className={`${styles.classCard} ${styles.advisoryCard}`}>
                <div className={styles.advisoryBadge}>
                  <span className={styles.badgeIcon}>⭐</span> OFFICIAL ADVISER
                </div>
                <div className={styles.classContent}>
                  <h3 className={styles.classSubject}>
                    Grade {data.advisory.gradeLevel} - {data.advisory.sectionName}
                  </h3>
                  <p className={styles.advisoryDescription}>
                    You are the designated class adviser for this section.
                  </p>
                  <div className={styles.classFooter}>
                    <span className={styles.studentCount}>
                      <strong>{data.advisory.studentCount || 0}</strong> Students enrolled
                    </span>
                    <button 
                      className={styles.advisoryBtn}
                      onClick={() => handleOpenModal('advisory', data.advisory.id)}
                    >
                      Manage Section
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- SUBJECT CLASSES GROUP (Designs Preserved) --- */}
          <div className={styles.sectionGroup}>
            <h3 className={styles.groupLabel}>Subject Loads</h3>
            <div className={styles.classesGrid}>
              {data.subjectClasses.length > 0 ? (
                data.subjectClasses.map((cls) => (
                  <div key={cls.id} className={styles.classCard}>
                    <div className={`${styles.classImage} ${styles[cls.type] || styles.defaultBg}`}>
                      <div className={styles.subjectOverlay}>{cls.subject ? cls.subject[0] : "?"}</div>
                    </div>
                    <div className={styles.classContent}>
                      <h3 className={styles.classSubject}>{cls.subject}</h3>
                      <div className={styles.infoRow}>
                        <span className={styles.icon}>📍</span>
                        <p className={styles.classSection}>{cls.section}</p>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.icon}>🕒</span>
                        <p className={styles.classSchedule}>{cls.schedule}</p>
                      </div>
                      <div className={styles.classFooter}>
                        <span className={styles.studentCount}>
                          <strong>{cls.studentCount || 0}</strong> Students
                        </span>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => handleOpenModal('class', cls.id)}
                        >
                          View Class
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyContainer}>
                  <p className={styles.emptyText}>No subject classes assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATED MODAL OVERLAY --- */}
      {activeModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={handleCloseModal}>&times;</button>
            
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {activeModal === 'advisory' ? "Advisory Master List" : "Subject Class List"}
              </h2>
            </div>

            <div className={styles.modalBody}>
              {loadingStudents ? (
                <p className={styles.modalLoading}>Fetching student names...</p>
              ) : (
                <div className={styles.studentList}>
                  {students.length > 0 ? (
                    students.map((name, index) => (
                      <div key={index} className={styles.studentItem}>
                        <span className={styles.studentNumber}>{index + 1}</span>
                        <span className={styles.studentName}>{name}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyText}>No students enrolled in this section.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClassesClient;