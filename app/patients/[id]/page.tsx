import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PatientHubView } from "@/features/patients/patient-hub-view";
import { roleLabel } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export default async function PatientHubPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  return (
    <DashboardLayout
      title="Fiche patient"
      currentUserName={user.fullName}
      currentUserRole={roleLabel(user.role)}
      currentUserRoleKey={user.role}
    >
      <PatientHubView patientId={id} />
    </DashboardLayout>
  );
}
