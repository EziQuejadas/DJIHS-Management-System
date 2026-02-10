"use client";

import { useState, useEffect } from "react";
import { fetchMyClasses } from "@/app/lib/data";
import styles from "@/app/ui/steacher/classes/classes.module.css";
import Link from "next/link";

const MyClassesClient = ({ user }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use the ID from your cookie-based user object
  const teacherId = user?.id;

  useEffect(() => {
    if (!teacherId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMyClasses(teacherId);
        setClasses(data || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [teacherId]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <h2 className={styles.pageTitle}>My Classes</h2>
        </div>
        <div className={styles.pageDate}>Feb. 10, 2026 | S.Y. 2025-26</div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading classes...</div>
      ) : (
        <div className={styles.classesGrid}>
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div key={cls.id} className={styles.classCard}>
                <div className={`${styles.classImage} ${styles[cls.type] || styles.defaultBg}`}>
                  <div className={styles.subjectOverlay}>
                    {cls.subject ? cls.subject[0] : "?"}
                  </div>
                </div>
                <div className={styles.classContent}>
                  <h3 className={styles.classSubject}>{cls.subject}</h3>
                  <p className={styles.classSection}>{cls.section}</p>
                  <p className={styles.classSchedule}>{cls.schedule}</p>
                  
                  <div className={styles.classFooter}>
                    <span className={styles.studentCount}>
                       👥 {cls.studentCount || 0} Students
                    </span>
                    
                    <Link href={`/steacher/classes/${cls.id}`}>
                      <button className={styles.viewBtn}>View Class</button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyMessage}>
              No classes assigned to your account yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyClassesClient;