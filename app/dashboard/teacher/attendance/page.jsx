import { getSessionUser } from "@/app/lib/data";
import AttendanceClient from "@/app/dashboard/teacher/attendance/AttendanceClient";
import { redirect } from "next/navigation";

export default async function AttendancePage() {
  // Fetch user using your cookie-based function
  const user = await getSessionUser();

  // If no cookie/user found, redirect to login immediately
  if (!user) {
    redirect("/login");
  }

  // Pass the user object to the Client Component
  return <AttendanceClient user={user} />;
}