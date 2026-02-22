import { getSessionUser, fetchGradeSummary } from "@/app/lib/data";
import GradeSummaryClient from "@/app/dashboard/kteacher/assignsubjects/gradesummary/GradeSummaryClient";
import { redirect } from "next/navigation";
import RoleGuard from "@/app/components/ProtectedRoutes";

// Force dynamic rendering to ensure up-to-date grade data
export const revalidate = 0; 

export default async function GradeSummaryPage() {
  const user = await getSessionUser();

  // 1. Server-side Authentication Check
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch the data on the server side
  const initialData = await fetchGradeSummary();

  // 3. Wrap Client Component in RoleGuard
  return (
    <RoleGuard allowedRole="key teacher">
      <GradeSummaryClient user={user} initialData={initialData} />
    </RoleGuard>
  );
}