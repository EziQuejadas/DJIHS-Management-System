"use client"
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './piechart.module.css';
import { fetchGradeDistribution } from '@/app/lib/data';

const COLORS = ['#00C49F', '#1F6354', '#1B4332', '#2D6A4F'];

const PieChartComponent = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const data = await fetchGradeDistribution();
      setChartData(data);
      setLoading(false);
    };
    getData();
  }, []);

  if (loading) return <div className={styles.container}>Loading Chart...</div>;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Grade Level Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: "10px", border: "none" }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center" 
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;