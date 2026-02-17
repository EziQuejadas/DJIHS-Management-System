"use client";

import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { supabase } from '@/app/lib/utils';
import { 
  fetchDashboardStats, 
  fetchTeacherList, 
  fetchSubjectList, 
  fetchSectionList 
} from '@/app/lib/data';
import styles from '@/app/ui/kteacher/dashboard.module.css';

const KeyTeacherDashboard = () => {
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const [teacherOptions, setTeacherOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [dbStats, setDbStats] = useState({ teachers: 0, subjects: 0, pending: 0, sections: 0 });

  const [assignment, setAssignment] = useState({
    subject: '',
    teacher: '',
    section: ''
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, tData, sData, secData] = await Promise.all([
          fetchDashboardStats(),
          fetchTeacherList(),
          fetchSubjectList(),
          fetchSectionList()
        ]);
        
        setDbStats(statsData);
        setTeacherOptions(tData.map(t => ({ id: t.teacherid, label: `${t.firstname} ${t.lastname}` })));
        setSubjectOptions(sData.map(s => ({ id: s.subjectcode, label: s.subjectname })));
        setSectionOptions(secData.map(sec => ({ id: sec.sectionid, label: sec.sectionname })));
      } catch (err) {
        console.error("Data loading failed:", err);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: profile } = await supabase
          .from('users') 
          .select('first_name')
          .eq('email', user.email)
          .single();

        if (profile) setUserName(profile.first_name);
      }
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  // --- Manual Assignment Logic ---
  const handleAssign = async () => {
    const { subject, teacher, section } = assignment;
    if (!subject || !teacher || !section) {
      alert("Please complete all assignment fields.");
      return;
    }

    try {
      const { data: existing, error: checkError } = await supabase
        .from('classes')
        .select('classid')
        .eq('subjectcode', subject)
        .eq('teacherid', parseInt(teacher))
        .eq('sectionid', parseInt(section))
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        alert("⚠️ This assignment already exists!");
        return;
      }

      const { error } = await supabase
        .from('classes')
        .insert([{ 
          subjectcode: subject, 
          teacherid: parseInt(teacher), 
          sectionid: parseInt(section) 
        }]);

      if (error) throw error;
      alert("✅ Subject successfully assigned!");
      setAssignment({ subject: '', teacher: '', section: '' });
      
    } catch (err) {
      alert("Failed to save assignment.");
    }
  };

  // --- Bulk Import Logic (using ExcelJS) ---
  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet(1); // Read first sheet
      const importData = [];

      // Iterate rows starting from 2 (skipping headers)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const subject_code = row.getCell(1).value;
          const teacher_id = row.getCell(2).value;
          const section_id = row.getCell(3).value;

          if (subject_code && teacher_id && section_id) {
            importData.push({
              subjectcode: subject_code.toString(),
              teacherid: parseInt(teacher_id),
              sectionid: parseInt(section_id)
            });
          }
        }
      });

      if (importData.length === 0) throw new Error("No valid data found in file.");

      const { error } = await supabase.from('classes').insert(importData);
      if (error) throw error;

      alert(`✅ Successfully imported ${importData.length} assignments!`);
    } catch (err) {
      console.error("Import Error:", err);
      alert("❌ Import failed. Ensure columns are: A: Subject Code, B: Teacher ID, C: Section ID");
    } finally {
      setIsImporting(false);
      e.target.value = null; 
    }
  };

  if (loading) return <div className={styles.container}>Initializing Dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.welcomeText}>
          <h3>Welcome back, {userName}!</h3>
        </div>
        <div className={styles.pageDate}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} | S.Y. 2025-26
        </div>
      </div>

      <div className={styles.statsContainer}>
        {[
          { label: "Total Teachers", value: dbStats.teachers, icon: <TeacherIcon /> },
          { label: "Subjects Offered", value: dbStats.subjects, icon: <SubjectIcon /> },
          { label: "Active Classes", value: dbStats.pending, icon: <AlertIcon /> },
          { label: "Sections", value: dbStats.sections, icon: <BuildingIcon /> },
        ].map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <span>{stat.label}</span>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        {/* MANUAL FORM */}
        <div className={styles.assignmentSection}>
          <h3 className={styles.sectionTitle}>Manual Assignment</h3>
          <div className={styles.assignmentForm}>
            <FormSelect 
              label="Subject" 
              options={subjectOptions} 
              value={assignment.subject}
              onChange={(e) => setAssignment({...assignment, subject: e.target.value})}
            />
            <FormSelect 
              label="Teacher" 
              options={teacherOptions} 
              value={assignment.teacher}
              onChange={(e) => setAssignment({...assignment, teacher: e.target.value})}
            />
            <FormSelect 
              label="Section" 
              options={sectionOptions} 
              value={assignment.section}
              onChange={(e) => setAssignment({...assignment, section: e.target.value})}
            />
            <button className={styles.assignBtn} onClick={handleAssign}>
              Assign Subject
            </button>
          </div>
        </div>

        {/* BULK IMPORT */}
        <div className={styles.importSection}>
          <h3 className={styles.sectionTitle}>Bulk Import</h3>
          <div className={styles.importCard}>
            <p className={styles.importInfo}>
              Upload Excel file (.xlsx) to assign multiple subjects.
            </p>
            <div className={styles.fileUploadContainer}>
              <input 
                type="file" 
                id="bulk-upload"
                accept=".xlsx"
                onChange={handleBulkImport}
                disabled={isImporting}
                className={styles.hiddenInput}
              />
              <label htmlFor="bulk-upload" className={styles.uploadLabel}>
                {isImporting ? "Processing..." : "📁 Upload Excel (.xlsx)"}
              </label>
            </div>
            <div className={styles.formatHelper}>
                
                <strong>Required Structure (Row 1 as Header):</strong>
                <ul>
                    <li>Column A: <code>subject_code</code></li>
                    <li>Column B: <code>teacher_id</code></li>
                    <li>Column C: <code>section_id</code></li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helpers ---
const FormSelect = ({ label, options, onChange, value }) => (
  <div className={styles.formGroup}>
    <label className={styles.formLabel}>{label}</label>
    <select className={styles.formSelect} onChange={onChange} value={value}>
      <option value="">-- Select {label} --</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.id}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Icons (Same as your previous ones) ---
const TeacherIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const SubjectIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>);
const AlertIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);
const BuildingIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 00-2 2h4a2 2 0 002-2v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>);

export default KeyTeacherDashboard;