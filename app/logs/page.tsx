import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LogsView } from "@/features/logs/logs-view";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LogsPage() {
  const user = await requireUser();
  if (!hasPermission(user.role, "logs:view")) {
    redirect("/");
  }
  return (
    <DashboardLayout
      title="Logs & activite"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <LogsView />
    </DashboardLayout>
  );
}
