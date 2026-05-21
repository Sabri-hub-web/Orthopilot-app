import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MessagesView } from "@/features/messages/messages-view";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function MessagesPage() {
  const user = await requireUser();
  if (!hasPermission(user.role, "messages:view")) {
    redirect("/");
  }

  return (
    <DashboardLayout
      title="Messages"
      fillViewport
      topbarCompact
      contentFlush
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <MessagesView currentUserName={user.fullName} />
    </DashboardLayout>
  );
}
