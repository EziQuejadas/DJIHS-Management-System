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

    // Hardcoded email as requested to bypass Auth hassle
    const USER_EMAIL = "cbgalmonte@gmail.com";

    useEffect(() => {
        async function loadDashboardData() {
            try {
                setLoading(true);

                // 1. Fetch Teacher Name from YOUR 'users' table
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('first_name')
                    .eq('email', USER_EMAIL)
                    .maybeSingle();

                if (userData) {
                    setTeacherName(userData.first_name);
                }

                // 2. Fetch Dashboard stats/classes from the database logic
                // Ensure RLS is disabled for these tables or policies are set to 'true'
                const data = await getTeacherDashboardStatsByEmail(USER_EMAIL);

                if (data && data.length > 0) {
                    setClassData(data);
                    setStats({
                        students: data.reduce((acc, curr) => acc + (Number(curr.students) || 0), 0),
                        subjects: data.length,
                        pending: data.reduce((acc, curr) => acc + (Number(curr.pending) || 0), 0)
                    });
                }
            } catch (error) {
                console.error("Critical Dashboard Error:", error);
            } finally {
                setLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    // --- QUICK ACTION HANDLERS ---
    const handleGenerateReport = () => {
        alert(`Generating Performance Report for ${teacherName}'s classes...`);
        // Logic for report generation goes here
    };

    const handlePrintClassList = () => {
        if (classData.length === 0) {
            alert("No class data available to print.");
            return;
        }
        window.print();
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <h3>Loading Don Jose Integrated HS Portal...</h3>
                    <p>Fetching teacher records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.welcomeSection}>
                <div className={styles.welcomeText}>
                    <h3>Welcome back, {teacherName}!</h3>
                </div>
                <div className={styles.statsDate}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} | S.Y. 2025-26
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className={styles.statsContainer}>
                <StatCard label="Total Students" value={stats.students} />
                <StatCard label="Subjects Taught" value={stats.subjects} />
                <StatCard label="Grades Pending" value={stats.pending} />
            </div>

            <div className={styles.contentRow}>
                {/* Main Content: My Subjects Table */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>My Subjects</h3>
                        <Link href="/dashboard/teacher/subjects" className={styles.viewAll}>
                            View All
                        </Link>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.subjectTable}>
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Section</th>
                                    <th>Students</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {classData.length > 0 ? (
                                    classData.map((cls, index) => (
                                        <tr key={index}>
                                            <td><strong>{cls.subject}</strong></td>
                                            <td>{cls.section}</td>
                                            <td>{cls.students} Students</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[(cls.status || '').toLowerCase()] || styles.notstarted}`}>
                                                    {(cls.status || 'NOTSTARTED').toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                            No subjects assigned to your account.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Quick Actions */}
                <div className={styles.sidebar}>
                    <div className={styles.sectionCard}>
                        <h3 className={styles.sectionTitle}>Quick Actions</h3>
                        <div className={styles.quickActions}>
                            <button 
                                className={styles.actionBtn}
                                onClick={handleGenerateReport}
                            >
                                Generate Reports
                            </button>
                            <button 
                                className={styles.actionBtn}
                                onClick={handlePrintClassList}
                            >
                                Print Class List
                            </button>
                        </div>
                    </div>

                    {/* Optional: Reminders Card */}
                    <div className={styles.sectionCard} style={{ marginTop: '20px' }}>
                        <h3 className={styles.sectionTitle}>Upcoming</h3>
                        <div style={{ fontSize: '0.85rem', color: '#555' }}>
                            <p>• Submit Q3 Grades by Feb 20</p>
                            <p>• Faculty Meeting at 3:00 PM</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Reusable Stat Card Component
 */
function StatCard({ label, value }) {
    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}><span>{label}</span></div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statUnderline}></div>
        </div>
    );
}