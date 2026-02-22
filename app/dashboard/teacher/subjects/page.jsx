import { getSessionUser, getTeacherDashboardStatsByEmail } from "@/app/lib/data";
import styles from "@/app/ui/steacher/subjects/steachersubject.module.css";
// Import the Guard
import RoleGuard from "@/app/components/ProtectedRoutes";

const SubjectsPage = async () => {
  const user = await getSessionUser();
  
  // Fetch stats based on the user's email
  const stats = await getTeacherDashboardStatsByEmail(user?.email) || [];

  return (
    <RoleGuard allowedRole="subject teacher">
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
              {stats.length > 0 ? (
                stats.map((item, index) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    No subjects assigned to your account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGuard>
  );
};

export default SubjectsPage;