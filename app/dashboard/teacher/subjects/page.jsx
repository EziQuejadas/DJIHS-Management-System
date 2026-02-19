import { getSessionUser, getTeacherDashboardStatsByEmail } from "@/app/lib/data";
import styles from "@/app/ui/steacher/subjects/steachersubject.module.css";

const SubjectsPage = async () => {
  const user = await getSessionUser();
  const stats = await getTeacherDashboardStatsByEmail(user?.email);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>My Subjects</h2>
      </div>

      <div className={styles.subjectsContainer}>
        <table className={styles.subjectTable}>
          <thead>
            <tr>
              <th>Subject</th>
              <th>Section</th>
              <th>No. of Students</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stats.map((item, index) => (
              <tr key={index}>
                <td>{item.subject}</td>
                <td>{item.section}</td>
                <td>{item.students} Students</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles['status' + item.status.replace(/\s/g, '')]}`}>
                    {item.status === 'pending' ? `${item.pending} pending` : 
                     item.status === 'completed' ? 'Completed' : 'Not Started'}
                  </span>
                </td>
                <td><button className={styles.optionsBtn}>⋮</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectsPage;