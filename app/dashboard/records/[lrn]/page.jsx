import { fetchStudentFullProfile } from "@/app/lib/data";
import styles from "@/app/ui/dashboard/records/studentprofile.module.css";
import Image from "next/image";
import GradeModal from "./gradeModal";
import BackButton from "./BackButton";

const StudentProfile = async ({ params }) => {
  const { lrn } = await params;
  const data = await fetchStudentFullProfile(lrn);

  if (!data) return <div className={styles.contentWrapper}>Record not found.</div>;

  // Aggregate separate quarter rows into a single subject object
  const subjectsMap = {};

  data.grades?.forEach((g) => {
    // Accessing subjectname through the classes relationship based on your schema
    const sCode = g.classes?.subjects?.subjectcode || "Unknown";
    const sName = g.classes?.subjects?.subjectname || "";
    
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
    
    // Assign finalgrade to the correct quarter column (q1, q2, q3, q4)
    subjectsMap[sCode][`q${g.quarter}`] = g.finalgrade;
    subjectsMap[sCode].total += g.finalgrade;
    subjectsMap[sCode].count += 1;
    
    // If any single quarter is failing, update remarks
    if (g.remarks === 'Failed') subjectsMap[sCode].remarks = 'Failed';
  });

  const processedGrades = Object.values(subjectsMap);

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <BackButton /> 
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
                  {data.students?.lastname?.toUpperCase()}, {data.students?.firstname} {data.students?.middleinitial ? `${data.students.middleinitial}.` : ''}
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Birth Date</div>
                <div className={styles.infoValue}>
                  {/* Updated to use 'birthday' based on your schema check */}
                  {data.students?.birthday ? new Date(data.students.birthday).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Sex</div>
                <div className={styles.infoValue}>{data.students?.sex || 'N/A'}</div>
              </div>
              <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                <div className={styles.infoLabel}>Address</div>
                <div className={styles.infoValue}>{data.students?.address || "No Address Recorded"}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Current Section</div>
                <div className={styles.infoValue}>{data.sections?.sectionname || 'Unassigned'}</div>
              </div>
            </div>

            <div className={styles.schoolLogo}>
              <Image src="/DJIHS_Logo.png" alt="School Logo" width={200} height={200} />
            </div>
          </div>

          <div className={styles.gradesSection}>
            <table className={styles.gradesTable}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th>
                  <th>Final</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {processedGrades.length > 0 ? (
                  processedGrades.map((grade, index) => {
                    const finalAvg = grade.count > 0 ? (grade.total / grade.count).toFixed(2) : '-';
                    return (
                      <tr key={index}>
                        <td>{grade.name}</td>
                        <td>{grade.q1}</td>
                        <td>{grade.q2}</td>
                        <td>{grade.q3}</td>
                        <td>{grade.q4}</td>
                        <td>{finalAvg}</td>
                        <td>
                          <span className={grade.remarks === 'Passed' ? styles.remarkPassed : styles.remarkFailed}>
                            {grade.remarks}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No grades recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.actionSection}>
            <GradeModal student={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;