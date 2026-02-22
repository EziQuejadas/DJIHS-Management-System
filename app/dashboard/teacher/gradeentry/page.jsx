import { getSessionUser } from "@/app/lib/data";
import GradeEntryClient from "@/app/dashboard/teacher/gradeentry/GradeEntryClient";
import { redirect } from "next/navigation";
// Import your Guard
import RoleGuard from "@/app/components/ProtectedRoutes";

export default async function GradeEntryPage() {
  // Fetch user using your cookie-based function
  const user = await getSessionUser();

  // 1. Server-side session check
  if (!user) {
    redirect("/login");
  }

  // 2. Wrap the UI in the Client-side RoleGuard
  return (
    <RoleGuard allowedRole="subject teacher">
      <GradeEntryClient user={user} />
    </RoleGuard>
  );
}