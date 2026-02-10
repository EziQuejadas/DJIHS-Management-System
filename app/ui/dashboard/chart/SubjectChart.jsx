"use client"
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './chart.module.css';

const SubjectChart = ({ data }) => {
  const [selectedGrade, setSelectedGrade] = useState("7");

  // Using == instead of === is safer here for String/Number comparisons
  const filteredData = data?.filter(item => item.level?.toString() == selectedGrade) || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Student Performance by Subject</h2>
        
        <select 
          className={styles.select}
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
        >
          <option value="7">Grade 7</option>
          <option value="8">Grade 8</option>
          <option value="9">Grade 9</option>
          <option value="10">Grade 10</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          layout="vertical"
          data={filteredData}
          barCategoryGap="20%" 
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          barGap={-20}
          barSize={20}
        >
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            width={120} 
            tick={{ 
              fill: '#000000', 
              fontSize: 12,
              textAnchor: 'end' 
            }}
          />
          <Tooltip 
            cursor={{fill: 'transparent'}} 
            formatter={(value, name) => [value, name === 'score' ? 'Current Average' : 'Total Points']}
          />
          <Bar dataKey="full" fill="#b2c9c5" radius={[0, 10, 10, 0]} isAnimationActive={false} />
          <Bar dataKey="score" fill="#2d6a4f" radius={[0, 10, 10, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {filteredData.length === 0 && (
        <p style={{textAlign: 'center', fontSize: '12px', color: '#666'}}>
          No data in memory for Grade {selectedGrade}
        </p>
      )}
    </div>
  );
};

export default SubjectChart;