"use client";

import { useEffect, useState, use } from "react";
import { fetchStudentFullProfile } from "@/app/lib/data";
import styles from "@/app/ui/dashboard/records/studentprofile.module.css";
import Image from "next/image";
import GradeModal from "./gradeModal";
import BackButton from "./BackButton";
import RoleGuard from "@/app/components/ProtectedRoutes";

const StudentProfileContent = ({ params }) => {
  // Unwrap params for Next.js 15
  const resolvedParams = use(params);
  const lrn = resolvedParams?.lrn;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      if (!lrn) return;
      setLoading(true);
      const result = await fetchStudentFullProfile(lrn);
      setData(result);
      setLoading(false);
    };
    getData();
  }, [lrn]);

  if (loading) return <div className={styles.contentWrapper}>Loading student profile...</div>;
  if (!data) return <div className={styles.contentWrapper}>Record not found.</div>;

  const subjectsMap = {};
  let hasPendingGrades = false;

  const gradesToProcess = data.grades || [];

  gradesToProcess.forEach((g) => {
    const statusField = `q${g.quarter}_status`;
    const isCompleted = g.classes?.[statusField] === 'completed';

    if (!isCompleted) {
      hasPendingGrades = true;
      return; 
    }

    const sCode = g.classes?.subjects?.subjectcode || "N/A";
    const sName = g.classes?.subjects?.subjectname || "Unknown Subject";
    
    if (!subjectsMap[sCode]) {
      subjectsMap[sCode] = { 
        name: sCode, 
        fullName: sName,
        q1: '-', q2: '-', q3: '-', q4: '-', 
        total: 0, 
        count: 0,
        remarks: 'Passed' 
      };
    }
    
    const val = parseFloat(g.finalgrade) || 0;
    subjectsMap[sCode][`q${g.quarter}`] = val.toFixed(2);
    subjectsMap[sCode].total += val;
    subjectsMap[sCode].count += 1;
    
    if (g.remarks === 'Failed') subjectsMap[sCode].remarks = 'Failed';
  });

  const processedGrades = Object.values(subjectsMap);

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <BackButton />
          {hasPendingGrades && (
            <div className={styles.pendingAlert}>
              <span>ℹ️ Some grades are hidden pending Key Teacher verification.</span>
            </div>
          )}
        </div>

        <div className={styles.profileCard}>
          <div className={styles.profileInfoSection}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>LRN</div>
                <div className={styles.infoValue}>{data.lrn}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Student Name</div>
                <div className={styles.infoValue}>
                  {data.lastname?.toUpperCase()}, {data.firstname} {data.middleinitial ? `${data.middleinitial}.` : ''}
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Section</div>
                <div className={styles.infoValue}>{data.sections?.sectionname || 'Unassigned'}</div>
              </div>
              <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                <div className={styles.infoLabel}>Address</div>
                <div className={styles.infoValue}>{data.address || "No Address Recorded"}</div>
              </div>
            </div>

            <div className={styles.schoolLogo}>
              <Image src="/DJIHS_Logo.png" alt="School Logo" width={150} height={150} priority />
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.gradesSection}>
            <table className={styles.gradesTable}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th className={styles.textCenter}>Q1</th>
                  <th className={styles.textCenter}>Q2</th>
                  <th className={styles.textCenter}>Q3</th>
                  <th className={styles.textCenter}>Q4</th>
                  <th className={styles.textCenter}>Final</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {processedGrades.length > 0 ? (
                  processedGrades.map((grade, index) => {
                    const finalAvg = grade.count > 0 ? (grade.total / grade.count).toFixed(2) : '-';
                    return (
                      <tr key={index}>
                        <td>
                          <div className={styles.subjectName}>{grade.fullName}</div>
                          <div className={styles.subjectCode}>{grade.name}</div>
                        </td>
                        <td className={styles.textCenter}>{grade.q1}</td>
                        <td className={styles.textCenter}>{grade.q2}</td>
                        <td className={styles.textCenter}>{grade.q3}</td>
                        <td className={styles.textCenter}>{grade.q4}</td>
                        <td className={styles.textCenter} style={{fontWeight: 'bold'}}>{finalAvg}</td>
                        <td>
                          <span className={grade.remarks === 'Passed' ? styles.badgePassed : styles.badgeFailed}>
                            {grade.remarks}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className={styles.emptyState}>No verified grades found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.actionSection}>
            <GradeModal student={data} verifiedGrades={processedGrades} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StudentProfile(props) {
  return (
    <RoleGuard allowedRole="registrar">
      <StudentProfileContent {...props} />
    </RoleGuard>
  );
}