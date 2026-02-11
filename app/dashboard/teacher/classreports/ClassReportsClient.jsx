"use client";

import { useState, useEffect } from "react";
import { fetchClassReport, getTeacherDashboardStatsByEmail } from "@/app/lib/data";
import styles from "@/app/ui/steacher/classreports/classreports.module.css";

const ClassReportsClient = ({ user }) => {
  const [reportData, setReportData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ classId: "", quarter: 1 });

  // Email pulled directly from the secure server-side user object
  const userEmail = user?.email;

  // 1. Initial Load: Fetch teacher's subjects using cookie email
  useEffect(() => {
    if (!userEmail) return;

    const loadSubjects = async () => {
      const data = await getTeacherDashboardStatsByEmail(userEmail);
      if (data && data.length > 0) {
        setSubjects(data);
        setFilters(prev => ({ ...prev, classId: data[0].classid }));
      }
    };
    loadSubjects();
  }, [userEmail]);

  const handleGenerate = async () => {
    if (!filters.classId) return;
    setLoading(true);
    try {
      const data = await fetchClassReport(filters.classId, filters.quarter);
      setReportData(data);
    } catch (error) {
      console.error("Report Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when classId is first set or changed
  useEffect(() => {
    if (filters.classId) handleGenerate();
  }, [filters.classId, filters.quarter]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Class Performance Summary</h2>
        <div className={styles.pageDate}>Feb. 10, 2026 | S.Y. 2025-26</div>
      </div>

      <div className={styles.statsRow}>
        <StatCard label="Class Average" value={reportData?.stats?.average || 0} iconType="chart" />
        <StatCard label="Passing Rate" value={`${reportData?.stats?.passingRate || 0}%`} iconType="check" />
        <StatCard label="Total Students" value={reportData?.stats?.totalStudents || 0} iconType="users" />
      </div>

      <div className={styles.contentLayout}>
        <div className={styles.chartsSection}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Grade Distribution Analysis</h3>
            <div className={styles.chartBars}>
              {reportData?.distribution?.map((item, index) => (
                <div key={`bar-${index}`} className={styles.barGroup}>
                  <div 
                    className={styles.bar} 
                    style={{ height: item.height || '10%' }}
                  >
                    {item.count}
                  </div>
                  <div className={styles.barLabel}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Student Rankings</h3>
            <table className={styles.performanceTable}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>LRN</th>
                  <th>Student Name</th>
                  <th>Final</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.students?.map((student, idx) => (
                  <tr key={`rank-${student.lrn}-${idx}`}>
                    <td>
                      <div className={`${styles.rankBadge} ${student.rank === 1 ? styles.gold : student.rank === 2 ? styles.silver : student.rank === 3 ? styles.bronze : student.rank >= 4 ? styles.neutral : ''}`}>
                        {student.rank}
                      </div>
                    </td>
                    <td>{student.lrn}</td>
                    <td>{student.name}</td>
                    <td><strong>{student.final}</strong></td>
                    <td>
                      <span className={student.remarks === 'PASSED' ? styles.statusPassed : styles.statusFailed}>
                        {student.remarks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.filterPanel}>
          <h3 className={styles.filterTitle}>Report Filters</h3>
          <div className={styles.filterGroup}>
            <label>Subject</label>
            <select 
              className={styles.filterSelect}
              value={filters.classId}
              onChange={(e) => setFilters({...filters, classId: e.target.value})}
            >
              {subjects.map((sub) => (
                <option key={`opt-${sub.classid}`} value={sub.classid}>
                  {sub.subject} ({sub.section})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Quarter</label>
            <select 
              className={styles.filterSelect}
              value={filters.quarter}
              onChange={(e) => setFilters({...filters, quarter: parseInt(e.target.value)})}
            >
              {[1, 2, 3, 4].map(q => (
                <option key={q} value={q}>{q === 1 ? '1st' : q === 2 ? '2nd' : q === 3 ? '3rd' : '4th'} Quarter</option>
              ))}
            </select>
          </div>

          <button 
            className={styles.generateBtn} 
            onClick={handleGenerate} 
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, iconType }) => (
  <div className={styles.statCard}>
    <div className={styles.statHeader}>
      <div className={styles.statIcon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {iconType === 'chart' && <path d="M18 20V10M12 20V4M6 20v-6" />}
          {iconType === 'check' && <path d="M20 6L9 17l-5-5" />}
          {iconType === 'users' && <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />}
        </svg>
      </div>
      <span>{label}</span>
    </div>
    <div className={styles.statValue}>{value}</div>
  </div>
);

export default ClassReportsClient;