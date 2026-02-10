import { getSubjectPerformance } from "@/app/lib/data";
import SubjectChart from "./SubjectChart"; // The Recharts component

export default async function ChartContainer() {
  const chartData = await getSubjectPerformance();

  // If database is empty, we can provide fallback data or an empty state
  if (!chartData || chartData.length === 0) {
    return <div>No performance data available.</div>;
  }

  return <SubjectChart data={chartData} />;
}