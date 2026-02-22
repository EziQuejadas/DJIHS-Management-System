import { getSessionUser } from "@/app/lib/data";
import ClassReportsClient from "@/app/dashboard/teacher/classreports/ClassReportsClient";
import { redirect } from "next/navigation";
import RoleGuard from "@/app/components/ProtectedRoutes";

export default async function ClassReportsPage() {
  // Fetch user using your cookie-based function
  const user = await getSessionUser();

  // 1. Initial Server-side Session Check
  if (!user) {
    redirect("/login");
  }

  // 2. Wrap the UI in the Client-side RoleGuard
  // Restricts access to users with the 'subject teacher' role
  return (
    <RoleGuard allowedRole="subject teacher">
      <ClassReportsClient user={user} />
    </RoleGuard>
  );
}