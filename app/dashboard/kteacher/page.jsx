"use client";

import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { supabase } from '@/app/lib/utils';
import { 
  fetchDashboardStats, 
  fetchTeacherList, 
  fetchSubjectList, 
  fetchSectionList,
  getSessionUser
} from '@/app/lib/data';
import styles from '@/app/ui/kteacher/dashboard.module.css';
import RoleGuard from "@/app/components/ProtectedRoutes";

const KeyTeacherDashboardContent = () => {
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState('classes'); // 'classes' or 'students'

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

        const user = await getSessionUser();
        if (user) {
          setUserName(user.first_name || "User");
        }

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
        console.error("Dashboard loading failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

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

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(importType === 'classes' ? 'Class Assignments' : 'Student List');

    const headers = importType === 'classes' 
      ? ['subject_code', 'teacher_id', 'section_id'] 
      : ['lrn', 'first_name', 'last_name', 'section_id', 'gender'];

    sheet.addRow(headers);
    
    // Formatting header
    sheet.getRow(1).font = { bold: true };
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${importType}_template.xlsx`;
    link.click();
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const errors = [];
    const validRows = [];
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      
      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error("Could not read Excel worksheet.");

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip headers
          const rowData = {};
          let isRowValid = true;

          if (importType === 'classes') {
            const subject_code = row.getCell(1).value;
            const teacher_id = row.getCell(2).value;
            const section_id = row.getCell(3).value;

            // Validation: Ensure all fields are present and IDs are numbers
            if (!subject_code || isNaN(parseInt(teacher_id)) || isNaN(parseInt(section_id))) {
              errors.push(`Row ${rowNumber}: Invalid or missing data.`);
              isRowValid = false;
            } else {
              rowData.subjectcode = subject_code.toString();
              rowData.teacherid = parseInt(teacher_id);
              rowData.sectionid = parseInt(section_id);
            }
          } else {
            // Student logic validation
            const lrn = row.getCell(1).value;
            const fname = row.getCell(2).value;
            const lname = row.getCell(3).value;
            const sec_id = row.getCell(4).value;
            const gender = row.getCell(5).value;

            if (!lrn || !fname || !lname || isNaN(parseInt(sec_id))) {
              errors.push(`Row ${rowNumber}: Missing required student details.`);
              isRowValid = false;
            } else {
              rowData.lrn = lrn.toString();
              rowData.firstname = fname.toString();
              rowData.lastname = lname.toString();
              rowData.sectionid = parseInt(sec_id);
              rowData.gender = gender ? gender.toString() : "N/A";
            }
          }

          if (isRowValid) validRows.push(rowData);
        }
      });

      // Show validation report if errors exist
      if (errors.length > 0) {
        const errorSummary = errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n...and ${errors.length - 5} more.` : '');
        const proceed = confirm(
          `Validation Report:\n\n❌ Errors found: ${errors.length}\n✅ Valid rows: ${validRows.length}\n\nErrors:\n${errorSummary}\n\nDo you want to skip the errors and import the valid rows?`
        );
        if (!proceed) {
          setIsImporting(false);
          e.target.value = null;
          return;
        }
      }

      if (validRows.length === 0) {
        alert("No valid rows found to import.");
      } else {
        const targetTable = importType === 'classes' ? 'classes' : 'students';
        const { error: insertError } = await supabase.from(targetTable).insert(validRows);
        
        if (insertError) throw insertError;
        alert(`✅ Successfully imported ${validRows.length} ${importType}!`);
      }

    } catch (err) {
      console.error("Import Error:", err);
      alert(`❌ Import failed: ${err.message || 'Database error'}`);
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
          <h3 className={styles.sectionTitle}>Manual Class Assignment</h3>
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
          <h3 className={styles.sectionTitle}>Bulk Data Import</h3>
          <div className={styles.importCard}>
            
            {/* TYPE TOGGLE */}
            <div className={styles.importTabs}>
              <button 
                className={importType === 'classes' ? styles.tabActive : styles.tab}
                onClick={() => setImportType('classes')}
              >
                Classes
              </button>
              <button 
                className={importType === 'students' ? styles.tabActive : styles.tab}
                onClick={() => setImportType('students')}
              >
                Students
              </button>
            </div>

            <p className={styles.importInfo}>
              Import {importType} via Excel. 
              <button onClick={downloadTemplate} className={styles.linkButton}>
                Download {importType} template
              </button>
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
                {isImporting ? "Processing..." : `📁 Upload ${importType} (.xlsx)`}
              </label>
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

// --- Icons ---
const TeacherIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const SubjectIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>);
const AlertIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>);
const BuildingIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 00-2 2h4a2 2 0 002-2v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>);

export default function KeyTeacherDashboard() {
  return (
    <RoleGuard allowedRole="key teacher">
      <KeyTeacherDashboardContent />
    </RoleGuard>
  );
}