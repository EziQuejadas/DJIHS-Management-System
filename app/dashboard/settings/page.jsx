// app/dashboard/settings/page.jsx (Server Component)
import { getSessionUser } from "@/app/lib/data";
import SettingsClient from "./SettingsClient";
import RoleGuard from "@/app/components/ProtectedRoutes";

export default async function SettingsPage() {
  const user = await getSessionUser();

  return (
    <RoleGuard allowedRole="registrar">
      <SettingsClient user={user} />
    </RoleGuard>
  );
}