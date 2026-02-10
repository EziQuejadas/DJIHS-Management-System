"use client"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styles from "./card.module.css";

const Card = ({ title, value, color }) => {
  const data = [
    { name: "Progress", value: value },
    { name: "Remaining", value: 100 - value },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={65}
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#f0f0f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.details}>
          <span className={styles.title}>{title}</span>
          <span className={styles.number}>{value}%</span>
        </div>
      </div>
    </div>
  );
};

export default Card;