import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskDetailView } from "@/features/tasks/task-detail-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  return (
    <DashboardLayout
      title="Détail tâche"
      fillViewport
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <TaskDetailView taskId={id} />
    </DashboardLayout>
  );
}
