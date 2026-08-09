import { PaymentFollowUp, ReglementFormPayload } from "@/types/domain";
import { prisma } from "@/server/db/client";
import { reglementStatusLabelMap } from "@/lib/reglements";
import { writeActivityLog } from "@/server/activity-log";
import type { ReglementStatus } from "@prisma/client";
import { createNotificationsForRoles } from "@/services/notifications-service";

type ReglementRow = {
  id: string;
  patientId: string;
  amountDue: number;
  dueDate: Date;
  status: ReglementStatus;
  comment: string | null;
  relanceCount: number;
  lastRelanceAt: Date | null;
  patient: { firstName: string; lastName: string };
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDaysLate(dueDate: Date): number {
  const diffMs = Date.now() - dueDate.getTime();
  return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

function patientLabel(patient: { firstName: string; lastName: string }) {
  return `${patient.firstName} ${patient.lastName}`;
}

export function toPaymentFollowUp(item: ReglementRow): PaymentFollowUp {
  return {
    id: item.id,
    patientId: item.patientId,
    patientName: patientLabel(item.patient),
    amountDue: item.amountDue,
    dueDate: formatDate(item.dueDate),
    daysLate: getDaysLate(item.dueDate),
    status: reglementStatusLabelMap[item.status],
    comment: item.comment,
    relanceCount: item.relanceCount,
    lastRelanceAt: item.lastRelanceAt ? item.lastRelanceAt.toISOString() : null,
  };
}

async function createReglementLog(message: string, patientId: string) {
  await writeActivityLog({ actor: "Systeme", message, patientId });
}

const reglementInclude = {
  patient: { select: { firstName: true, lastName: true } },
} as const;

export async function getReglementsList(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const take = Math.min(Math.max(pageSize, 1), 100);

  const [total, rows] = await Promise.all([
    prisma.reglement.count(),
    prisma.reglement.findMany({
      select: {
        id: true,
        patientId: true,
        amountDue: true,
        dueDate: true,
        status: true,
        comment: true,
        relanceCount: true,
        lastRelanceAt: true,
        createdAt: true,
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
  ]);

  return {
    items: rows.map(toPaymentFollowUp),
    total,
    page,
    pageSize: take,
    totalPages: Math.max(1, Math.ceil(total / take)),
  };
}

export async function createReglement(payload: ReglementFormPayload) {
  const created = await prisma.reglement.create({
    data: {
      patientId: payload.patientId,
      amountDue: payload.amountDue,
      dueDate: new Date(payload.dueDate),
      status: payload.status,
      comment: payload.comment ?? null,
    },
    include: reglementInclude,
  });

  await createReglementLog(
    `Creation reglement: ${patientLabel(created.patient)} — ${created.amountDue} EUR — echeance ${formatDate(created.dueDate)}`,
    created.patientId,
  );

  if (created.status === "EN_RETARD") {
    await createNotificationsForRoles(["ADMIN", "RESPONSABLE", "SECRETAIRE"], {
      title: "Reglement en retard",
      message: `Le reglement de ${patientLabel(created.patient)} est en retard.`,
      type: "REGLEMENT_RETARD",
      relatedEntityType: "Reglement",
      relatedEntityId: created.id,
    });
  }

  return toPaymentFollowUp(created);
}

export async function updateReglement(reglementId: string, payload: Partial<ReglementFormPayload>) {
  const before = await prisma.reglement.findUnique({
    where: { id: reglementId },
    include: reglementInclude,
  });
  if (!before) return null;

  const updated = await prisma.reglement.update({
    where: { id: reglementId },
    data: {
      patientId: payload.patientId,
      amountDue: payload.amountDue,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      status: payload.status,
      comment: payload.comment,
    },
    include: reglementInclude,
  });

  await createReglementLog(
    `Modification reglement: ${patientLabel(updated.patient)} — ${updated.amountDue} EUR`,
    updated.patientId,
  );

  if (payload.status && payload.status !== before.status) {
    await createReglementLog(
      `Changement statut reglement (${patientLabel(updated.patient)}): ${before.status} -> ${payload.status}`,
      updated.patientId,
    );
  }

  if (payload.status === "EN_RETARD" && before.status !== "EN_RETARD") {
    await createNotificationsForRoles(["ADMIN", "RESPONSABLE", "SECRETAIRE"], {
      title: "Reglement passe en retard",
      message: `Le reglement de ${patientLabel(updated.patient)} est passe en retard.`,
      type: "REGLEMENT_RETARD",
      relatedEntityType: "Reglement",
      relatedEntityId: updated.id,
    });
  }

  return toPaymentFollowUp(updated);
}

export async function deleteReglement(reglementId: string) {
  const row = await prisma.reglement.findUnique({
    where: { id: reglementId },
    include: reglementInclude,
  });
  if (!row) return null;

  await prisma.reglement.delete({ where: { id: reglementId } });
  await createReglementLog(
    `Suppression reglement: ${patientLabel(row.patient)} — ${row.amountDue} EUR`,
    row.patientId,
  );
  return { id: row.id };
}

export async function registerRelance(reglementId: string): Promise<
  | { ok: true; item: PaymentFollowUp }
  | { ok: false; reason: "NOT_FOUND" | "ALREADY_SETTLED" }
> {
  const row = await prisma.reglement.findUnique({
    where: { id: reglementId },
    include: reglementInclude,
  });
  if (!row) return { ok: false, reason: "NOT_FOUND" };
  if (row.status === "REGLE") return { ok: false, reason: "ALREADY_SETTLED" };

  const updated = await prisma.reglement.update({
    where: { id: reglementId },
    data: {
      relanceCount: { increment: 1 },
      lastRelanceAt: new Date(),
      status: "RELANCE_ENVOYEE",
    },
    include: reglementInclude,
  });

  await createReglementLog(
    `Relance enregistree: ${patientLabel(updated.patient)} — ${updated.amountDue} EUR (n° ${updated.relanceCount})`,
    updated.patientId,
  );
  return { ok: true, item: toPaymentFollowUp(updated) };
}
