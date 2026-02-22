"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js';
import { Bar, Scatter } from 'react-chartjs-2';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import styles from '@/app/ui/dashboard/classreports/classreports.module.css';
import { fetchReportData } from '@/app/lib/data';
import RoleGuard from "@/app/components/ProtectedRoutes";

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, 
  LineElement, ScatterController, Title, Tooltip, Legend
);

const ClassReportsContent = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const gradeDistRef = useRef(null);
  const attendanceRef = useRef(null);

  const [filters, setFilters] = useState({
    schoolYear: '2025-26',
    quarter: '1st Quarter'
  });

  const getQuarterInt = (qString) => {
    const map = { "1st Quarter": 1, "2nd Quarter": 2, "3rd Quarter": 3, "4th Quarter": 4 };
    return map[qString] || 1;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sy_id = filters.schoolYear === '2025-26' ? 1 : 2; 
      const quarterNum = getQuarterInt(filters.quarter);
      const data = await fetchReportData(sy_id, quarterNum);
      setReportData(data);
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = () => {
    loadData();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getGradeDistribution = () => {
    const distribution = [0, 0, 0, 0, 0, 0];
    reportData.forEach((item) => {
      const grade = item.final_grade;
      if (grade < 75) distribution[0]++;
      else if (grade <= 79) distribution[1]++;
      else if (grade <= 84) distribution[2]++;
      else if (grade <= 89) distribution[3]++;
      else if (grade <= 95) distribution[4]++;
      else distribution[5]++;
    });
    return distribution;
  };

  const getHonorRollList = () => {
    return [...reportData]
      .filter(s => s.final_grade >= 90)
      .sort((a, b) => b.final_grade - a.final_grade)
      .slice(0, 10);
  };

  const handleExportPDF = () => {
    const doc = jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const themeColor = [45, 95, 93]; 

    doc.setFillColor(...themeColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Don Jose Integrated High School", pageWidth / 2, 18, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Don Jose Proper, Don Jose, City of Santa Rosa, Laguna", pageWidth / 2, 25, { align: "center" });
    doc.text("Contact: (049) 541 0786", pageWidth / 2, 30, { align: "center" });

    doc.setTextColor(...themeColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("QUARTERLY PERFORMANCE REPORT", 14, 55);
    
    doc.setDrawColor(...themeColor);
    doc.setLineWidth(0.5);
    doc.line(14, 58, 80, 58); 

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`School Year: ${filters.schoolYear}`, 14, 66);
    doc.text(`Grading Period: ${filters.quarter}`, 14, 71);
    doc.text(`Date Exported: ${new Date().toLocaleDateString()}`, 14, 76);

    const getChartImage = (chartRef) => chartRef.current ? chartRef.current.toBase64Image() : null;

    const gradeDistImg = getChartImage(gradeDistRef);
    if (gradeDistImg) {
      doc.setTextColor(0);
      doc.setFontSize(13);
      doc.text("Grade Distribution Analysis", 14, 90);
      doc.addImage(gradeDistImg, 'PNG', 14, 95, 182, 75);
    }

    const attendanceImg = getChartImage(attendanceRef);
    if (attendanceImg) {
      doc.setFontSize(13);
      doc.text("Attendance & Academic Correlation", 14, 185);
      doc.addImage(attendanceImg, 'PNG', 14, 190, 182, 75);
    }

    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(...themeColor);
    doc.text(`Official Honor Roll List`, 14, 25);
    
    const honorRoll = getHonorRollList();
    const tableRows = honorRoll.map((s) => [
      s.lrn,
      s.studentName,
      s.section,
      s.final_grade,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["LRN", "Student Name", "Section", "Final Average"]],
      body: tableRows,
      headStyles: { fillColor: themeColor, fontSize: 11 },
      theme: "striped",
    });

    const finalY = doc.lastAutoTable.finalY + 35;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Certified Correct by:", 14, finalY - 10);
    doc.text("__________________________", 14, finalY);
    doc.setFont("helvetica", "bold");
    doc.text("School Registrar", 14, finalY + 5);

    doc.save(`DJIHS_Report_${filters.schoolYear}_${filters.quarter}.pdf`);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top', align: 'end' } },
  };

  const gradeDistData = {
    labels: ['Below 75', '75-79', '80-84', '85-89', '90-95', '96-100'],
    datasets: [{
      label: 'Students',
      data: getGradeDistribution(),
      backgroundColor: '#2D5F5D',
      borderRadius: 5,
    }],
  };

  const attendanceData = {
    datasets: [{
      label: 'Student Correlation',
      data: reportData.map(s => ({ x: s.attendance_rate, y: s.final_grade })),
      backgroundColor: '#4FB9A9',
    }],
  };

  const honorRollList = getHonorRollList();

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.reportsHeader}>
        <h2>Class Reports</h2>
      </div>

      <div className={styles.reportsGrid}>
        <div className={`${styles.card} ${styles.chartCard}`}>
          <h3>Grade Distribution Chart</h3>
          <div className={styles.chartArea}>
            <Bar ref={gradeDistRef} data={gradeDistData} options={options} />
          </div>
        </div>

        <div className={`${styles.card} ${styles.filtersCard}`}>
          <h3>Report Filters</h3>
          <div className={styles.filterGroup}>
            <label>School Year</label>
            <select name="schoolYear" className={styles.filterSelect} value={filters.schoolYear} onChange={handleFilterChange}>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Quarter</label>
            <select name="quarter" className={styles.filterSelect} value={filters.quarter} onChange={handleFilterChange}>
              <option value="1st Quarter">1st Quarter</option>
              <option value="2nd Quarter">2nd Quarter</option>
              <option value="3rd Quarter">3rd Quarter</option>
              <option value="4th Quarter">4th Quarter</option>
            </select>
          </div>
          <button className={styles.btnGenerate} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
          <button className={styles.btnExport} onClick={handleExportPDF}>Export to PDF</button>
        </div>

        <div className={`${styles.card} ${styles.honorRollCard}`}>
          <div className={styles.honorRollHeader}>
            <h3>Honor Roll 🏆</h3>
            <button className={styles.btnViewAll}>View All</button>
          </div>
          <table className={styles.honorTable}>
            <thead>
              <tr>
                <th>LRN</th>
                <th>Student Name</th>
                <th>Section</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : honorRollList.length > 0 ? (
                honorRollList.map((student) => (
                  <tr key={student.lrn}>
                    <td>{student.lrn}</td>
                    <td>{student.studentName}</td>
                    <td>{student.section}</td>
                    <td style={{ fontWeight: 'bold', color: '#2D5F5D' }}>{student.final_grade}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>No honor students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={`${styles.card} ${styles.bottomChartCard}`}>
           <h3>Total Students by Grade</h3>
           <div className={styles.chartArea}>
              <Bar data={gradeDistData} options={options} />
           </div>
        </div>

        <div className={`${styles.card} ${styles.bottomChartCard}`}>
           <h3>Attendance vs Grades</h3>
           <div className={styles.chartArea}>
              <Scatter ref={attendanceRef} data={attendanceData} options={options} />
           </div>
        </div>
      </div>
    </div>
  );
};

// Main Export with Protection
export default function ClassReportsPage() {
  return (
    <RoleGuard allowedRole="registrar">
      <ClassReportsContent />
    </RoleGuard>
  );
}