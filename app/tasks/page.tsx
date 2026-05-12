import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TasksView } from "@/features/tasks/tasks-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function TasksPage() {
  const user = await requireUser();
  return (
    <DashboardLayout
      title="Taches internes"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <TasksView />
    </DashboardLayout>
  );
}
