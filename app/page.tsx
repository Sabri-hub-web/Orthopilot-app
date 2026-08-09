import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HomeView } from "@/features/dashboard/home-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await requireUser();
  const greetingName = user.fullName.split(/\s+/)[0] ?? user.fullName;

  return (
    <DashboardLayout
      title="Accueil"
      fillViewport
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <HomeView greetingName={greetingName} />
    </DashboardLayout>
  );
}
