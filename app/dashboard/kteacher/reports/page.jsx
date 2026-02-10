"use client";

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Updated import
import { supabase } from '@/app/lib/utils';
import { fetchSubmissionStatuses } from '@/app/lib/data'; 
import styles from '@/app/ui/kteacher/reports/reports.module.css';

const ReportsPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // --- REPORT 1: TEACHER LOAD ---
  const generateTeacherLoadReport = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        subjects(subjectname),
        teachers(firstname, lastname),
        sections(sectionname)
      `);

    if (error) throw error;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Teacher Load Summary", 14, 15);
    doc.setFontSize(10);
    doc.text(`Academic Year 2025-2026 | Generated: ${new Date().toLocaleString()}`, 14, 22);

    const tableRows = data.map(item => [
      `${item.teachers?.firstname || 'N/A'} ${item.teachers?.lastname || ''}`,
      item.subjects?.subjectname || 'N/A',
      item.sections?.sectionname || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Teacher Name', 'Subject', 'Section']],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50] } 
    });

    doc.save("Teacher_Load_Report.pdf");
  };

  // --- REPORT 2: PENDING SUBMISSIONS ---
  const generatePendingReport = async () => {
    const data = await fetchSubmissionStatuses(1); 
    const pendingTeachers = data.filter(item => item.status !== 'completed');

    if (pendingTeachers.length === 0) {
      alert("All teachers have completed their submissions!");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Pending Grade Submissions Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Quarter 1 | Generated: ${new Date().toLocaleString()}`, 14, 22);

    const tableRows = pendingTeachers.map(item => [
      item.teacher,
      item.subject,
      item.section,
      item.pendingCount
    ]);

    autoTable(doc, {
      head: [['Teacher Name', 'Subject', 'Section', 'Remaining Students']],
      body: tableRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [237, 108, 2] }
    });

    doc.save("Pending_Submissions_Report.pdf");
  };

  // --- REPORT 3: SUBJECT SUBMISSION SUMMARY ---
  const generateSummaryReport = async () => {
    const data = await fetchSubmissionStatuses(1); 

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Subject Submission Summary", 14, 15);
    doc.setFontSize(10);
    doc.text(`Full Overview | Generated: ${new Date().toLocaleString()}`, 14, 22);

    const tableRows = data.map(item => [
      item.subject,
      item.teacher,
      item.section,
      item.status?.toUpperCase() || 'PENDING'
    ]);

    autoTable(doc, {
      head: [['Subject', 'Teacher', 'Section', 'Status']],
      body: tableRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save("Submission_Summary_Report.pdf");
  };

  // Main Handler
  const handleGenerate = async (id) => {
    try {
      setIsGenerating(true);
      if (id === 'load') {
        await generateTeacherLoadReport();
      } else if (id === 'pending') {
        await generatePendingReport();
      } else if (id === 'summary') {
        await generateSummaryReport();
      }
    } catch (err) {
      console.error("Report Error:", err);
      alert(`Error: ${err.message || "Could not connect to database"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const reports = [
    {
      id: "summary",
      title: "Subject Submission Summary",
      description: "Overview of all subject grade submissions by quarter.",
      colorClass: styles.blueIcon,
      btnClass: styles.btnBlue,
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    },
    {
      id: "load",
      title: "Teacher Load Summary",
      description: "Current subject assignments per teacher",
      colorClass: styles.greenIcon,
      btnClass: styles.btnGreen,
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    },
    {
      id: "pending",
      title: "Pending Submission",
      description: "List of teachers with pending grade submissions",
      colorClass: styles.orangeIcon,
      btnClass: styles.btnOrange,
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Generate Reports</h2>
        <div className={styles.pageDate}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} | S.Y. 2025-26
        </div>
      </div>

      <div className={styles.reportsGrid}>
        {reports.map((report) => (
          <div key={report.id} className={styles.reportCard}>
            <div className={`${styles.reportIcon} ${report.colorClass}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                {report.icon}
              </svg>
            </div>
            <div className={styles.reportContent}>
              <h3 className={styles.reportTitle}>{report.title}</h3>
              <p className={styles.reportDescription}>{report.description}</p>
              <button 
                className={`${styles.generateBtn} ${report.btnClass}`}
                disabled={isGenerating}
                onClick={() => handleGenerate(report.id)}
              >
                {isGenerating ? "Processing..." : "Generate Report"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;