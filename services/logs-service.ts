/** Journal d'activité désactivé (modèle ActivityLog retiré du schéma). */
export async function getLogsList(page: number, pageSize: number) {
  return {
    items: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
  };
}
