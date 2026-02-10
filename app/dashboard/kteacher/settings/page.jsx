// app/dashboard/settings/page.jsx (Server Component)
import { getSessionUser } from "@/app/lib/data";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getSessionUser();

  return <SettingsClient user={user} />;
}