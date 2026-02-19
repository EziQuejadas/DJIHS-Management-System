"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/utils'; 
import styles from '@/app/ui/steacher/steacherdashboard/steacherdashboard.module.css';
import Link from 'next/link';
import { getTeacherDashboardStatsByEmail } from '@/app/lib/data';

export default function TeacherDashboard() {
    const [loading, setLoading] = useState(true);
    const [teacherName, setTeacherName] = useState("Teacher");
    const [classData, setClassData] = useState([]);
    const [stats, setStats] = useState({ students: 0, subjects: 0, pending: 0 });
    
    // Reminder States
    const [showReminder, setShowReminder] = useState(false);
    const [daysLeft, setDaysLeft] = useState(0);
    const [activeQuarter, setActiveQuarter] = useState("");

    const USER_EMAIL = "cbgalmonte@gmail.com";

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);

                // 1. Fetch Teacher Name
                const { data: userData } = await supabase
                    .from('users')
                    .select('first_name')
                    .eq('email', USER_EMAIL)
                    .maybeSingle();
                if (userData) setTeacherName(userData.first_name);

                // 2. Fetch Stats
                const data = await getTeacherDashboardStatsByEmail(USER_EMAIL);
                if (data && data.length > 0) {
                    setClassData(data);
                    setStats({
                        students: data.reduce((acc, curr) => acc + (Number(curr.students) || 0), 0),
                        subjects: data.length,
                        pending: data.reduce((acc, curr) => acc + (Number(curr.pending) || 0), 0)
                    });
                }

                // 3. FETCH ACTIVE CONFIG & DEADLINES
                const { data: config } = await supabase
                    .from('system_config')
                    .select('*')
                    .eq('id', 1)
                    .single();

                if (config) {
                    // Logic: You can change "q2" to "q3" etc. based on your current needs
                    const currentQ = "q2"; 
                    const deadlineKey = `${currentQ}_deadline`;
                    const deadlineValue = config[deadlineKey];

                    setActiveQuarter(currentQ.toUpperCase());

                    if (deadlineValue) {
                        const deadlineDate = new Date(deadlineValue);
                        const hasSeen = sessionStorage.getItem('gradeReminderSeen');
                        
                        if (!hasSeen) {
                            const today = new Date();
                            const diffInTime = deadlineDate.getTime() - today.getTime();
                            const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

                            // Show if within 10 days and hasn't passed
                            if (diffInDays <= 10 && diffInDays >= 0) {
                                setDaysLeft(diffInDays);
                                setShowReminder(true);
                            }
                        }
                    }
                }

            } catch (error) {
                console.error("Dashboard Error:", error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    const handleCloseReminder = () => {
        sessionStorage.setItem('gradeReminderSeen', 'true');
        setShowReminder(false);
    };

    // --- RENDER LOGIC ---
    if (loading) return <div className={styles.container}>Loading Portal...</div>;

    return (
        <div className={styles.container}>
            {/* DYNAMIC POPUP MODAL */}
            {showReminder && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <button className={styles.closeX} 
                        onClick={handleCloseReminder}
                        aria-label="Close"
                         >
                        &times;
                         </button>
                        <div className={styles.modalHeader}></div>
                        <div className={styles.modalContent}>
                            <div className={styles.modalIcon}>📢</div>
                            <h3 className={styles.modalTitle}>{activeQuarter} Grading Deadline</h3>
                            <p className={styles.modalText}>
                                Hi {teacherName}, the deadline for <strong>{activeQuarter}</strong> grade submission is in 
                                <span className={styles.daysHighlight}> {daysLeft} days</span>. 
                                Please finalize your records soon.
                            </p>
                            <button 
                                onClick={handleCloseReminder} 
                                className={styles.modalButton}
                            >
                                Got it, thanks!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className={styles.welcomeSection}>
                <div className={styles.welcomeText}>
                    <h3>Welcome back, {teacherName}!</h3>
                </div>
                <div className={styles.statsDate}>
                    {new Date().toLocaleDateString()} | S.Y. 2025-26
                </div>
            </div>

            {/* STATS */}
            <div className={styles.statsContainer}>
                <StatCard label="Total Students" value={stats.students} />
                <StatCard label="Subjects Taught" value={stats.subjects} />
                <StatCard label="Grades Pending" value={stats.pending} />
            </div>

            {/* MAIN CONTENT */}
            <div className={styles.contentRow}>
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>My Subjects</h3>
                        <Link href="/dashboard/teacher/subjects" className={styles.viewAll}>View All</Link>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.subjectTable}>
                            <thead>
                                <tr><th>Subject</th><th>Section</th><th>Students</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {classData.map((cls, i) => (
                                    <tr key={i}>
                                        <td><strong>{cls.subject}</strong></td>
                                        <td>{cls.section}</td>
                                        <td>{cls.students}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[(cls.status || '').toLowerCase()] || styles.notstarted}`}>
                                                {(cls.status || 'NOTSTARTED').toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SIDEBAR */}
                <div className={styles.sidebar}>
                    <div className={styles.sectionCard}>
                        <h3 className={styles.sectionTitle}>Quick Actions</h3>
                        <div className={styles.quickActions}>
                            <button className={styles.actionBtn} onClick={() => alert('Generating...')}>Generate Reports</button>
                            <button className={styles.actionBtn} onClick={() => window.print()}>Print Class List</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- REUSABLE COMPONENT ---
function StatCard({ label, value }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}><span>{label}</span></div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statUnderline}></div>
        </div>
    );
}