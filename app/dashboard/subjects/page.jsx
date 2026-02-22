import { fetchSubjectsWithStats } from "@/app/lib/data";
import SubjectCard from "@/app/ui/dashboard/subjects/subjectCard";
import styles from "@/app/ui/dashboard/subjects/subject.module.css";
// Import your Guard
import RoleGuard from "@/app/components/ProtectedRoutes";

const Subjects = async ({ searchParams }) => {
  const params = await searchParams;
  const grade = params?.grade || 7;

  const subjects = await fetchSubjectsWithStats(grade);

  return (
    <RoleGuard allowedRole="registrar">
      <div className={styles.contentWrapper}>
        <div className={styles.subjectsHeader}>
          <h2>Manage Subjects</h2>
          
          <div className={styles.filter}>
            {[7, 8, 9, 10].map((g) => (
              <a 
                key={g} 
                href={`?grade=${g}`} 
                className={grade == g ? styles.active : ""}
              >
                Grade {g}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.subjectsGrid}>
          {subjects.map((subject) => (
            <SubjectCard 
              key={subject.subjectcode} 
              subject={subject} 
              stats={subject.stats} 
            />
          ))}
        </div>
      </div>
    </RoleGuard>
  );
};

export default Subjects;