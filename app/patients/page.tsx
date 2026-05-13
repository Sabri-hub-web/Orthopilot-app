import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PatientsView } from "@/features/patients/patients-view";
import { hasPermission } from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function PatientsPage() {
  const user = await requireUser();
  const canImportCsv = hasPermission(user.role, "patients:import");
  return (
    <DashboardLayout
      title="Patients"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <PatientsView canImportCsv={canImportCsv} />
    </DashboardLayout>
  );
}
