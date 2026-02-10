import { fetchSubjectsWithStats } from "@/app/lib/data";
import SubjectCard from "@/app/ui/dashboard/subjects/subjectCard";
import styles from "@/app/ui/dashboard/subjects/subject.module.css";

const Subjects = async ({ searchParams }) => {
  const params = await searchParams;
  const grade = params?.grade || 7;

  // Removed the 'query' parameter
  const subjects = await fetchSubjectsWithStats(grade);

  return (
    <div className={styles.contentWrapper}>
      <div className={styles.subjectsHeader}>
        <h2>Manage Subjects</h2>
        
        {/* Simplified Header: Just the filters */}
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
  );
};

export default Subjects;