import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HomeView } from "@/features/dashboard/home-view";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await requireUser();
  const showPresenceTeam = hasPermission(user.role, "presence:view");
  const greetingName = user.fullName.split(/\s+/)[0] ?? user.fullName;
  const currentDateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <DashboardLayout
      title="Tableau de bord"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <HomeView
        showPresenceTeam={showPresenceTeam}
        greetingName={greetingName}
        currentDateLabel={currentDateLabel}
      />
    </DashboardLayout>
  );
}
