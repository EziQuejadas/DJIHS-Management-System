"use client";

import { useEffect, useState, useCallback } from 'react';
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
  getTotalCounts
} from '@/app/lib/data';
import RoleGuard from "@/app/components/ProtectedRoutes";

const DashboardContent = () => {
  const [data, setData] = useState({
    gradRate: "0%",
    retRate: "0%",
    attRate: "0%",
    counts: { students: 0, teachers: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [gradRate, retRate, attRate, counts] = await Promise.all([
        getGraduationRate(),
        getRetentionRate(),
        getAttendanceRate(),
        getTotalCounts()
      ]);
      
      setData({ gradRate, retRate, attRate, counts });
    } catch (error) {
      console.error("Dashboard data fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <div className={styles.wrapper}>Loading Dashboard Overview...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.main}>
        <div className={styles.chart}>
          <Chart />
        </div>

        <div className={styles.cardsRow}>
          <Card 
            title="Graduation Rate" 
            value={data.gradRate} 
            color="#1F6354" 
          />
          <Card 
            title="Retention Rate" 
            value={data.retRate} 
            color="#1F6354" 
          />
        </div>

        <div className={styles.enrollmentchart}>
          <EnrollmentChart />
        </div>
      </div>

      <div className={styles.side}>
        <div className={styles.stats}>
          <StatBox 
            type="Student" 
            count={data.counts.students.toLocaleString()} 
          />
          <StatBox 
            type="Teacher" 
            count={data.counts.teachers.toLocaleString()} 
          />
        </div>

        <div className={styles.piechart}>
          <PieChart />
        </div>

        <div className={styles.card}>
          <Card 
            title="Attendance Rate" 
            value={data.attRate} 
            color="#1F6354" 
          />
        </div>
      </div>
    </div>
  );
};

// Main Export with Protection
export default function Dashboard() {
  return (
    <RoleGuard allowedRole="registrar">
      <DashboardContent />
    </RoleGuard>
  );
}