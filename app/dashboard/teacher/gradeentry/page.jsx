import { getSessionUser } from "@/app/lib/data";
import GradeEntryClient from "@/app/dashboard/teacher/gradeentry/GradeEntryClient";
import { redirect } from "next/navigation";

export default async function GradeEntryPage() {
  // Fetch user using your cookie-based function
  const user = await getSessionUser();

  // If no cookie/user found, redirect to login immediately
  if (!user) {
    redirect("/login");
  }

  // Pass the user object to the Client Component
  return <GradeEntryClient user={user} />;
}