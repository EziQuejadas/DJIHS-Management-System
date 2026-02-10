import styles from "./subjectCard.module.css";
import Image from "next/image";

const SubjectCard = ({ subject, stats }) => {
  return (
    <div className={styles.subjectCard}>
      <div className={styles.subjectAccent}></div>
      <div className={styles.subjectContent}>
        <h3 className={styles.subjectTitle}>{subject.subjectname}</h3>
        <div className={styles.subjectInfo}>{stats.totalClasses} Total Classes</div>
        <div className={styles.subjectDetails}>
          <div className={styles.detailItem}>{stats.totalTeachers} Teachers</div>
          <div className={styles.detailItem}>{stats.totalStudents} Students</div>
        </div>
        <div className={styles.subjectIcon}>
          <Image src="/images/student.png" alt="Icon" width={35} height={35} />
        </div>
      </div>
    </div>
  );
};

export default SubjectCard;