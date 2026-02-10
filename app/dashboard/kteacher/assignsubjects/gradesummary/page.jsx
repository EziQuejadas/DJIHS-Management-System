import { getSessionUser, fetchGradeSummary } from "@/app/lib/data";
import GradeSummaryClient from "@/app/dashboard/kteacher/assignsubjects/gradesummary/GradeSummaryClient";
import { redirect } from "next/navigation";

// This line forces Next.js to fetch new data on every request
export const revalidate = 0; 

export default async function GradeSummaryPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the data on the server side for faster initial load
  const initialData = await fetchGradeSummary();

  return <GradeSummaryClient user={user} initialData={initialData} />;
}