/** Journal d'activité désactivé (modèle ActivityLog retiré du schéma). */
export async function writeActivityLog(_input: {
  actor: string;
  message: string;
  patientId?: string | null;
}) {
  // no-op
}
