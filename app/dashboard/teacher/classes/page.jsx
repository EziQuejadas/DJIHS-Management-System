import { getSessionUser } from "@/app/lib/data";
import MyClassesClient from "@/app/dashboard/teacher/classes/ClassesClient";
import { redirect } from "next/navigation";
import RoleGuard from "@/app/components/ProtectedRoutes";

export default async function MyClassesPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <RoleGuard allowedRole="subject teacher">
      <MyClassesClient user={user} />
    </RoleGuard>
  );
}