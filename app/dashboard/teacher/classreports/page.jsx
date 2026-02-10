import { getSessionUser } from "@/app/lib/data";
import ClassReportsClient from "@/app/dashboard/teacher/classreports/ClassReportsClient";
import { redirect } from "next/navigation";

export default async function ClassReportsPage() {
  // Fetch user using your cookie-based function
  const user = await getSessionUser();

  // Redirect if no session exists
  if (!user) {
    redirect("/login");
  }

  // Pass the user object to the Client Component
  return <ClassReportsClient user={user} />;
}