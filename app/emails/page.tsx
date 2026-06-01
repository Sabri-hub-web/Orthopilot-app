import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailsView } from "@/features/emails/emails-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function EmailsPage() {
  const user = await requireUser();
  return (
    <DashboardLayout
      title="Emails"
      fillViewport
      topbarCompact
      contentFlush
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <EmailsView currentUserId={user.id} />
    </DashboardLayout>
  );
}
