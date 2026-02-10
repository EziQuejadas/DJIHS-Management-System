"use client"

import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import styles from "./enrollmentchart.module.css";
import { fetchEnrollmentTrends } from "@/app/lib/data";

const EnrollmentChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const data = await fetchEnrollmentTrends();
      setChartData(data);
      setLoading(false);
    };
    getData();
  }, []);

  if (loading) return <div className={styles.container}>Loading Trends...</div>;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Student Enrollment by Year</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis 
            dataKey="year" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#999', fontSize: 12 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#999', fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
          />
          <Legend verticalAlign="top" align="center" iconType="circle" />
          
          <Line 
            type="monotone" 
            dataKey="Students" 
            stroke="#2d6a4f" 
            strokeWidth={4} 
            dot={{ r: 6, fill: "#2d6a4f", strokeWidth: 2, stroke: "#fff" }} 
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnrollmentChart;