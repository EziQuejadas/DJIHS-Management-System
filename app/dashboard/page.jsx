import styles from '../ui/dashboard/dashboard.module.css';
import Card from '../ui/dashboard/card/card';
import Chart from '../ui/dashboard/chart/ChartCointainer';
import PieChart from '../ui/dashboard/piechart/piechart';
import EnrollmentChart from '../ui/dashboard/enrollmentchart/enrollmentchart';
import StatBox from '../ui/dashboard/statbox/statbox';
import { 
  getGraduationRate, 
  getAttendanceRate,
  getRetentionRate,
  getTotalCounts,
  getSessionUser,
} from '@/app/lib/data';

const user = await getSessionUser();
if (user.role?.toLowerCase() !== 'registrar') {
    redirect(user.role === 'subject teacher' ? '/dashboard/steacher' : '/dashboard/kteacher');
}

const Dashboard = async () => {
  // Fetching all data in parallel to keep the dashboard fast
  const [
    gradRate, 
    retRate, 
    attRate, 
    counts
  ] = await Promise.all([
    getGraduationRate(),
    getRetentionRate(),
    getAttendanceRate(),
    getTotalCounts()
  ]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.main}>
        {/* The Subject Performance Chart (Client Component handles internal filtering) */}
        <div className={styles.chart}>
          <Chart />
        </div>

        <div className={styles.cardsRow}>
          <Card 
            title="Graduation Rate" 
            value={gradRate} 
            color="#1F6354" 
          />
          <Card 
            title="Retention Rate" 
            value={retRate} 
            color="#1F6354" 
          />
        </div>

        {/* Enrollment Trends Line Chart */}
        <div className={styles.enrollmentchart}>
          <EnrollmentChart />
        </div>
      </div>

      <div className={styles.side}>
        {/* Real-time Student/Teacher Counts */}
        <div className={styles.stats}>
          <StatBox 
            type="Student" 
            count={counts.students.toLocaleString()} 
          />
          <StatBox 
            type="Teacher" 
            count={counts.teachers.toLocaleString()} 
          />
        </div>

        {/* Gender or Status Distribution Pie Chart */}
        <div className={styles.piechart}>
          <PieChart />
        </div>

        {/* Third Progress Card */}
        <div className={styles.card}>
          <Card 
            title="Attendance Rate" 
            value={attRate} 
            color="#1F6354" 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;