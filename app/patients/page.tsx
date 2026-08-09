import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PatientsView } from "@/features/patients/patients-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function PatientsPage() {
  const user = await requireUser();
  return (
    <DashboardLayout
      title="Patients"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <PatientsView />
    </DashboardLayout>
  );
}
