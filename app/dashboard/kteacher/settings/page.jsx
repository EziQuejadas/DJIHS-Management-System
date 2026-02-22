// app/dashboard/settings/page.jsx (Server Component)
import { getSessionUser } from "@/app/lib/data";
import SettingsClient from "./SettingsClient";
import { redirect } from "next/navigation";
import RoleGuard from "@/app/components/ProtectedRoutes";

export default async function SettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <RoleGuard allowedRole="key teacher">
      <SettingsClient user={user} />
    </RoleGuard>
  );
}