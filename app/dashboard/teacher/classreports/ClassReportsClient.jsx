"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchClassReport, getTeacherDashboardStatsByEmail } from "@/app/lib/data";
import styles from "@/app/ui/steacher/classreports/classreports.module.css";

const ClassReportsClient = ({ user }) => {
  const [reportData, setReportData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ classId: "", quarter: 1 });
  const [currentDate, setCurrentDate] = useState("");

  const userEmail = user?.email;

  // Set the actual date on the client side to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    setCurrentDate(formatted);
  }, []);

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

  useEffect(() => {
    if (filters.classId) handleGenerate();
  }, [filters.classId, filters.quarter]);

  const atRiskCount = useMemo(() => {
    return reportData?.students?.filter(s => s.final < 75).length || 0;
  }, [reportData]);

  const handlePrint = () => window.print();

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Class Performance Summary</h2>
          <div className={styles.pageDate}>{currentDate} | S.Y. 2025-26</div>
        </div>
        <button className={styles.printBtn} onClick={handlePrint}>
          Print Report
        </button>
      </div>

      <div className={styles.statsRow}>
        <StatCard label="Class Average" value={reportData?.stats?.average || 0} iconType="chart" />
        <StatCard label="Passing Rate" value={`${reportData?.stats?.passingRate || 0}%`} iconType="check" />
        <StatCard label="Total Students" value={reportData?.stats?.totalStudents || 0} iconType="users" />
        <StatCard label="At-Risk" value={atRiskCount} iconType="warning" isAlert={atRiskCount > 0} />
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
                    style={{ 
                        height: item.height || '10%',
                        backgroundColor: item.label === 'Failing' || item.label === 'Below 75' ? '#e74c3c' : '#2d5f4f' 
                    }}
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
                  <tr key={idx} className={student.final < 75 ? styles.atRiskRow : ''}>
                    <td>
                      <div className={`${styles.rankBadge} ${student.rank === 1 ? styles.gold : student.rank === 2 ? styles.silver : student.rank === 3 ? styles.bronze : styles.neutral}`}>
                        {student.rank}
                      </div>
                    </td>
                    <td>{student.lrn}</td>
                    <td>
                        {student.name}
                        {student.final < 75 && <span className={styles.riskTag}>At Risk</span>}
                    </td>
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
                <option key={sub.classid} value={sub.classid}>{sub.subject} ({sub.section})</option>
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
                <option key={q} value={q}>Quarter {q}</option>
              ))}
            </select>
          </div>

          <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, iconType, isAlert }) => (
  <div className={styles.statCard}>
    <div className={styles.statHeader}>
      <div className={styles.statIcon} style={isAlert ? {background: '#fdecea'} : {}}>
        <svg viewBox="0 0 24 24" fill="none" stroke={isAlert ? "#e74c3c" : "#2d5f4f"} strokeWidth="2">
          {iconType === 'chart' && <path d="M18 20V10M12 20V4M6 20v-6" />}
          {iconType === 'check' && <path d="M20 6L9 17l-5-5" />}
          {iconType === 'users' && <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />}
          {iconType === 'warning' && <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
        </svg>
      </div>
      <span>{label}</span>
    </div>
    <div className={styles.statValue} style={isAlert ? {color: '#e74c3c', borderColor: '#e74c3c'} : {}}>{value}</div>
  </div>
);

export default ClassReportsClient;