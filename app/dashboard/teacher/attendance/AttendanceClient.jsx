"use client";

import React, { useEffect, useState, useMemo } from "react";
import { fetchAttendanceEntryData, getTeacherDashboardStatsByEmail } from "@/app/lib/data";
import { supabase } from "@/app/lib/utils";
import styles from "@/app/ui/steacher/attendance/attendance.module.css";

const AttendanceClient = ({ user }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ 
    classid: "", 
    date: todayStr 
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const userEmail = user?.email;

  // 1. Fetch Classes for the dropdown
  useEffect(() => {
    if (!userEmail) return;
    const loadInitialData = async () => {
      setLoading(true);
      const classData = await getTeacherDashboardStatsByEmail(userEmail);
      if (classData && classData.length > 0) {
        setSubjects(classData);
        setFilters(prev => ({ ...prev, classid: classData[0].classid.toString() }));
      }
      setIsInitialLoad(false);
    };
    loadInitialData();
  }, [userEmail]);

  // 2. Fetch Students & Specific Logs for the selected date
  useEffect(() => {
    if (!filters.classid || isInitialLoad) return;

    const getData = async () => {
      setLoading(true);
      try {
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(filters.date));
        
        // Fetch Roster and specific Daily Logs
        const [roster, { data: dailyLogs }] = await Promise.all([
          fetchAttendanceEntryData(filters.classid, monthName),
          supabase
            .from('attendance_logs')
            .select('enrollmentid, status')
            .eq('attendance_date', filters.date)
            .eq('classid', filters.classid)
        ]);
        
        const mapped = (roster || []).map(student => {
          const existingLog = dailyLogs?.find(l => l.enrollmentid === student.enrollmentid);
          return {
            ...student,
            dailyStatus: existingLog ? existingLog.status : 'present',
            isSaved: !!existingLog,
            originalStatus: existingLog ? existingLog.status : 'present'
          };
        }).sort((a, b) => a.studentName.localeCompare(b.studentName));
        
        setStudents(mapped);
      } catch (error) {
        console.error("Attendance Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [filters.classid, filters.date, isInitialLoad]);

  const handleStatusUpdate = (enrollmentid, status) => {
    setStudents(prev => prev.map(s => 
      s.enrollmentid === enrollmentid ? { ...s, dailyStatus: status } : s
    ));
  };

  const stats = useMemo(() => {
    return {
      present: students.filter(s => s.dailyStatus === 'present').length,
      excused: students.filter(s => s.dailyStatus === 'excused').length,
      absent: students.filter(s => s.dailyStatus === 'absent').length,
      total: students.length
    };
  }, [students]);

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, dailyStatus: 'present' })));
  };

  const handleConfirmSave = async () => {
    if (students.length === 0) return;
    setIsSaving(true);

    try {
      const payload = students.map(s => ({
        attendance_date: filters.date,
        enrollmentid: s.enrollmentid,
        classid: filters.classid,
        status: s.dailyStatus
      }));

      const { error } = await supabase
        .from('attendance_logs')
        .upsert(payload, { onConflict: 'attendance_date, enrollmentid' });

      if (error) throw error;

      setStudents(prev => prev.map(s => ({ ...s, isSaved: true, originalStatus: s.dailyStatus })));
      alert(`Attendance for ${filters.date} archived.`);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.attendanceHeader}>
        <div className={styles.headerInfo}>
          <h2>Daily Attendance Monitor</h2>
          <span className={styles.headerSub}>
            {subjects.find(s => s.classid.toString() === filters.classid)?.subject || "Select Course"} 
            — {subjects.find(s => s.classid.toString() === filters.classid)?.section || ""}
          </span>
        </div>
        <button className={styles.btnGhost} onClick={markAllPresent}>
          Mark All Present
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Attendance Date</label>
          <input 
            type="date" 
            className={styles.filterSelect} 
            value={filters.date}
            max={todayStr} // STOPS FUTURE DATE SELECTION
            onChange={(e) => setFilters({...filters, date: e.target.value})}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Selected Class</label>
          <select 
            className={styles.filterSelect}
            value={filters.classid}
            onChange={(e) => setFilters({...filters, classid: e.target.value})}
          >
            {subjects.map(s => (
              <option key={s.classid} value={s.classid}>
                {s.subject} ({s.section})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.gradeTableContainer}>
        <table className={styles.gradeTable}>
          <thead>
            <tr>
              <th style={{ width: '60%' }}>Student Name</th>
              <th style={{ textAlign: 'center' }}>Daily Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading ? (
              students.length > 0 ? (
                students.map((s) => (
                  <tr 
                    key={s.enrollmentid} 
                    className={s.dailyStatus === 'absent' ? styles.absentRow : s.dailyStatus !== s.originalStatus ? styles.unsavedRow : ''}
                  >
                    <td>
                      <div className={styles.nameBadgeRow}>
                        <span className={styles.studentName}>{s.studentName}</span>
                        {s.isSaved && s.dailyStatus === s.originalStatus && (
                          <span className={styles.savedBadge}>Logged</span>
                        )}
                      </div>
                      <span className={styles.lrnText}>LRN: {s.lrn}</span>
                    </td>
                    <td>
                      <div className={styles.buttonCenter}>
                        <div className={styles.segmentedControl}>
                          <button 
                            onClick={() => handleStatusUpdate(s.enrollmentid, 'present')}
                            className={`${styles.iconBtn} ${styles.present} ${s.dailyStatus === 'present' ? styles.active : ''}`}
                          >✓</button>
                          <button 
                            onClick={() => handleStatusUpdate(s.enrollmentid, 'excused')}
                            className={`${styles.iconBtn} ${styles.excused} ${s.dailyStatus === 'excused' ? styles.active : ''}`}
                          >📝</button>
                          <button 
                            onClick={() => handleStatusUpdate(s.enrollmentid, 'absent')}
                            className={`${styles.iconBtn} ${styles.absent} ${s.dailyStatus === 'absent' ? styles.active : ''}`}
                          >✕</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="2" style={{ textAlign: 'center', padding: '100px' }}>No student records found.</td></tr>
              )
            ) : (
              <tr><td colSpan="2" style={{ textAlign: 'center', padding: '100px' }}>Syncing logs...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footerArea}>
        <div className={styles.summaryBox}>
          <div className={styles.summaryItem}>
            <span>Present</span>
            <strong className={styles.countGreen}>{stats.present}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Excused</span>
            <strong className={styles.countOrange}>{stats.excused}</strong>
          </div>
          <div className={styles.summaryItem}>
            <span>Absent</span>
            <strong className={styles.countRed}>{stats.absent}</strong>
          </div>
        </div>
        
        <button 
          className={styles.btnPrimary} 
          onClick={handleConfirmSave}
          disabled={loading || isSaving || students.length === 0}
        >
          {isSaving ? "Syncing..." : "Commit Attendance Records"}
        </button>
      </div>
    </div>
  );
};

export default AttendanceClient;