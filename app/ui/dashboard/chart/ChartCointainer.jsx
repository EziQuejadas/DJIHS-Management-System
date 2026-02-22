"use client";

import { useEffect, useState } from "react";
import { getSubjectPerformance } from "@/app/lib/data";
import SubjectChart from "./SubjectChart";

export default function ChartContainer() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getSubjectPerformance();
      setChartData(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading Chart...</div>;
  if (!chartData || chartData.length === 0) return <div>No performance data available.</div>;

  return <SubjectChart data={chartData} />;
}