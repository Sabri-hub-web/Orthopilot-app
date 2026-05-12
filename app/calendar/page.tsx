import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CalendarView } from "@/features/calendar/calendar-view";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function CalendarPage() {
  const user = await requireUser();
  if (!hasPermission(user.role, "calendar:view")) {
    redirect("/");
  }

  const canManage = hasPermission(user.role, "calendar:manage");

  return (
    <DashboardLayout
      title="Calendrier"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <CalendarView canManage={canManage} />
    </DashboardLayout>
  );
}
