"use client";

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/app/lib/utils';
import { fetchSubmissionStatuses, getSessionUser } from '@/app/lib/data'; 
import styles from '@/app/ui/kteacher/reports/reports.module.css';
import RoleGuard from '@/app/components/ProtectedRoutes';

const ReportsPageContent = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBy, setGeneratedBy] = useState("Authorized Staff");
  const [selectedQuarter, setSelectedQuarter] = useState(1); // Default to Quarter 1

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getSessionUser();
        if (user) {
          setGeneratedBy(user.full_name || user.email || "Authorized User");
        }
      } catch (err) {
        console.error("User fetch error:", err);
      }
    };
    loadUser();
  }, []);

  const generateMasterReport = async () => {
    try {
      setIsGenerating(true);

      // Fetch data based on the selected quarter
      const [loadRes, submissionData] = await Promise.all([
        supabase.from('classes').select(`
          subjects(subjectname),
          teachers(firstname, lastname),
          sections(sectionname)
        `),
        fetchSubmissionStatuses(selectedQuarter) // Dynamic Quarter selection
      ]);

      if (loadRes.error) throw loadRes.error;

      const doc = new jsPDF();
      const dateStr = new Date().toLocaleString();

      // --- HEADER ---
      doc.setFontSize(18);
      doc.text("DON JOSE INTEGRATED HIGH SCHOOL", 14, 20);
      doc.setFontSize(12);
      doc.text("ACADEMIC MASTER REPORT", 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`S.Y. 2025-2026 | QUARTER ${selectedQuarter}`, 14, 35); // Reflects the quarter
      doc.setLineWidth(0.5);
      doc.line(14, 40, 196, 40);

      // --- TABLE 1: TEACHER LOAD ---
      doc.setFontSize(13);
      doc.setTextColor(0);
      doc.text("1. Teacher Assignment Load", 14, 50);
      
      const loadRows = (loadRes.data || []).map(item => [
        `${item.teachers?.lastname || ''}, ${item.teachers?.firstname || ''}`,
        item.subjects?.subjectname || 'N/A',
        item.sections?.sectionname || 'N/A'
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Teacher', 'Subject', 'Section']],
        body: loadRows,
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] } 
      });

      // --- TABLE 2: SUBMISSION SUMMARY ---
      let finalY = doc.lastAutoTable.finalY;
      
      if (finalY > 200) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(13);
      doc.text(`2. Grade Submission Status (Quarter ${selectedQuarter})`, 14, finalY + 15);
      
      const summaryRows = (submissionData || []).map(item => [
        item.subject,
        item.teacher,
        item.status?.toUpperCase() || 'PENDING'
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Subject', 'Assigned Teacher', 'Current Status']],
        body: summaryRows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }
      });

      // --- PREPARED BY SECTION ---
      const signatureY = doc.lastAutoTable.finalY + 25;
      if (signatureY > 260) doc.addPage();

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text("Prepared by:", 14, signatureY);
      
      doc.setFont(undefined, 'bold');
      doc.text(generatedBy.toUpperCase(), 14, signatureY + 7);
      
      doc.setFont(undefined, 'normal');
      doc.setLineWidth(0.2);
      doc.line(14, signatureY + 8, 80, signatureY + 8); 
      
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`System Generated on: ${dateStr}`, 14, signatureY + 14);

      // --- FOOTER ---
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, 285, { align: 'center' });
      }

      doc.save(`DJIHS_Q${selectedQuarter}_MasterReport_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (err) {
      alert("Error generating report: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Administrative Reports</h2>
        <p className={styles.subtitle}>Select a quarter and download the comprehensive academic report.</p>
      </div>

      <div className={styles.centeredCard}>
        <div className={styles.mainReportCard}>
          <div className={styles.iconContainer}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h3>Master Academic Report</h3>
          
          {/* Quarter Selection UI */}
          <div className={styles.filterSection}>
            <label htmlFor="quarterSelect">Select Grading Period:</label>
            <select 
              id="quarterSelect"
              className={styles.quarterDropdown}
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
            >
              <option value={1}>1st Quarter</option>
              <option value={2}>2nd Quarter</option>
              <option value={3}>3rd Quarter</option>
              <option value={4}>4th Quarter</option>
            </select>
          </div>
          
          <div className={styles.preparerNote}>
            <span>Document will be prepared by:</span>
            <strong>{generatedBy}</strong>
          </div>

          <button 
            className={styles.primaryBtn} 
            onClick={generateMasterReport}
            disabled={isGenerating}
          >
            {isGenerating ? "Compiling PDF..." : `Download Q${selectedQuarter} Report`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  return (
    <RoleGuard allowedRole="key teacher">
      <ReportsPageContent />
    </RoleGuard>
  );
}