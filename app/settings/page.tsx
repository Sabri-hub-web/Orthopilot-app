import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SettingsView } from "@/features/settings/settings-view";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await requireUser();
  if (!hasPermission(user.role, "settings:view")) {
    redirect("/");
  }
  return (
    <DashboardLayout
      title="Parametres"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <SettingsView />
    </DashboardLayout>
  );
}
