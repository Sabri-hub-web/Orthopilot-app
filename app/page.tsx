import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HomeView } from "@/features/dashboard/home-view";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await requireUser();
  const showPresenceTeam = hasPermission(user.role, "presence:view");
  return (
    <DashboardLayout
      title="Dashboard principal"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <HomeView showPresenceTeam={showPresenceTeam} />
    </DashboardLayout>
  );
}
