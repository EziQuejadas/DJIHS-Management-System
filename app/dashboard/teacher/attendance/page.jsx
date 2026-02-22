import { getSessionUser } from "@/app/lib/data";
import AttendanceClient from "@/app/dashboard/teacher/attendance/AttendanceClient";
import { redirect } from "next/navigation";
import RoleGuard from "@/app/components/ProtectedRoutes";

export default async function AttendancePage() {
  // Fetch user using your cookie-based function
  const user = await getSessionUser();

  // 1. Server-side Authentication Check
  if (!user) {
    redirect("/login");
  }

  // 2. Wrap the UI in the Client-side RoleGuard
  // Use "subject teacher" as the requirement
  return (
    <RoleGuard allowedRole="subject teacher">
      <AttendanceClient user={user} />
    </RoleGuard>
  );
}