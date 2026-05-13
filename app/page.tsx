import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HomeView } from "@/features/dashboard/home-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await requireUser();
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
        greetingName={greetingName}
        currentDateLabel={currentDateLabel}
        userDisplayName={user.fullName}
        userRoleLabel={roleLabel(user.role)}
      />
    </DashboardLayout>
  );
}
