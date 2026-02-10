import { getSessionUser } from "@/app/lib/data";
import MyClassesClient from "@/app/dashboard/teacher/classes/ClassesClient";
import { redirect } from "next/navigation";

export default async function MyClassesPage() {
  // Fetch user using your cookie-based function
  const user = await getSessionUser();

  // If no cookie/user found, redirect to login
  if (!user) {
    redirect("/login");
  }

  // Pass the user object (containing the ID and email) to the Client Component
  return <MyClassesClient user={user} />;
}