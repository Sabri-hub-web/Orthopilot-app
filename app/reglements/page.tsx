import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReglementsView } from "@/features/reglements/reglements-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function ReglementsPage() {
  const user = await requireUser();
  return (
    <DashboardLayout
      title="Suivi des reglements"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <ReglementsView />
    </DashboardLayout>
  );
}
