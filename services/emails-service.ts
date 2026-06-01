import { EmailFormPayload, PriorityEmail } from "@/types/domain";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";
import { emailCategoryLabelMap, emailStatusLabelMap } from "@/lib/emails";
import type { EmailCategory, EmailStatus } from "@prisma/client";
import { createNotification, createNotificationsForRoles } from "@/services/notifications-service";
import { buildAiSummary } from "@/services/email-ai";

type EmailAttachmentRow = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type EmailRow = {
  id: string;
  sender: string;
  subject: string;
  receivedAt: Date;
  category: EmailCategory;
  status: EmailStatus;
  comment: string | null;
  snippet: string | null;
  bodyText: string | null;
  importedFrom: "MANUAL" | "GMAIL";
  gmailMessageId: string | null;
  gmailThreadId: string | null;
  hasAttachments: boolean;
  aiSummary: string | null;
  aiCategory: string | null;
  aiPriority: string | null;
  aiGeneratedAt: Date | null;
  patientId: string | null;
  patient: { firstName: string; lastName: string } | null;
  assigneeId: string | null;
  assignedUser: { fullName: string } | null;
  attachments?: EmailAttachmentRow[];
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatHour(date: Date): string {
  return date.toISOString().slice(11, 16);
}

function patientLabel(patient: { firstName: string; lastName: string } | null) {
  if (!patient) return null;
  return `${patient.firstName} ${patient.lastName}`;
}

export function toPriorityEmail(item: EmailRow): PriorityEmail {
  return {
    id: item.id,
    from: item.sender,
    subject: item.subject,
    receivedDate: formatDate(item.receivedAt),
    receivedAt: formatHour(item.receivedAt),
    category: emailCategoryLabelMap[item.category],
    status: emailStatusLabelMap[item.status],
    comment: item.comment,
    snippet: item.snippet,
    bodyText: item.bodyText,
    importedFrom: item.importedFrom,
    gmailMessageId: item.gmailMessageId,
    gmailThreadId: item.gmailThreadId,
    hasAttachments: item.hasAttachments,
    attachments: (item.attachments ?? []).map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
    })),
    aiSummary: item.aiSummary,
    aiCategory: item.aiCategory,
    aiPriority: item.aiPriority,
    aiGeneratedAt: item.aiGeneratedAt ? item.aiGeneratedAt.toISOString() : null,
    patientId: item.patientId,
    patientName: patientLabel(item.patient),
    assigneeId: item.assigneeId,
    assignee: item.assignedUser?.fullName ?? "Non assignee",
  };
}

async function createEmailLog(message: string, patientId?: string | null) {
  await writeActivityLog({ actor: "Systeme", message, patientId });
}

const emailInclude = {
  patient: { select: { firstName: true, lastName: true } },
  assignedUser: { select: { fullName: true } },
  attachments: {
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true },
    orderBy: { createdAt: "asc" },
  },
} as const;

const statusSortWeight: Record<EmailStatus, number> = {
  A_TRAITER: 0,
  EN_COURS: 1,
  TRAITE: 2,
  ARCHIVE: 3,
};

export async function getEmailsList(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.email.count(),
    prisma.email.findMany({
      include: emailInclude,
      orderBy: { receivedAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const ordered = [...rows].sort((a, b) => {
    if (a.category === "URGENT" && b.category !== "URGENT") return -1;
    if (a.category !== "URGENT" && b.category === "URGENT") return 1;
    const sa = statusSortWeight[a.status];
    const sb = statusSortWeight[b.status];
    if (sa !== sb) return sa - sb;
    return b.receivedAt.getTime() - a.receivedAt.getTime();
  });

  return {
    items: ordered.map(toPriorityEmail),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createEmail(payload: EmailFormPayload) {
  const created = await prisma.email.create({
    data: {
      sender: payload.sender,
      subject: payload.subject,
      receivedAt: new Date(payload.receivedAt),
      category: payload.category,
      status: payload.status ?? "A_TRAITER",
      comment: payload.comment ?? null,
      patientId: payload.patientId ?? null,
      assigneeId: payload.assigneeId ?? null,
    },
    include: emailInclude,
  });

  await createEmailLog(`Creation email (cabinet): ${created.subject} — ${created.sender}`, created.patientId);

  if (created.category === "URGENT") {
    await createNotificationsForRoles(["ADMIN", "RESPONSABLE", "SECRETAIRE"], {
      title: "Email urgent",
      message: `Un email urgent a ete recu: "${created.subject}".`,
      type: "EMAIL_URGENT",
      relatedEntityType: "Email",
      relatedEntityId: created.id,
    });
  }

  return toPriorityEmail(created);
}

export async function updateEmail(emailId: string, payload: Partial<EmailFormPayload>) {
  const before = await prisma.email.findUnique({
    where: { id: emailId },
    include: emailInclude,
  });
  if (!before) return null;

  const categoryChangedManually =
    payload.category !== undefined && payload.category !== before.category;

  const updated = await prisma.email.update({
    where: { id: emailId },
    data: {
      sender: payload.sender,
      subject: payload.subject,
      receivedAt: payload.receivedAt ? new Date(payload.receivedAt) : undefined,
      category: payload.category,
      // Marque la catégorie comme manuelle pour ne pas l'écraser lors des resync Gmail.
      ...(categoryChangedManually ? { categoryManual: true } : {}),
      status: payload.status,
      comment: payload.comment,
      patientId: payload.patientId,
      assigneeId: payload.assigneeId,
    },
    include: emailInclude,
  });

  await createEmailLog(`Modification email: ${updated.subject}`, updated.patientId);

  if (payload.status && payload.status !== before.status) {
    await createEmailLog(
      `Changement statut email (${updated.subject}): ${before.status} -> ${payload.status}`,
      updated.patientId,
    );
  }

  if (payload.category && payload.category !== before.category) {
    await createEmailLog(
      `Changement categorie email (${updated.subject}): ${before.category} -> ${payload.category}`,
      updated.patientId,
    );
  }

  if (payload.category === "URGENT" && before.category !== "URGENT") {
    await createNotificationsForRoles(["ADMIN", "RESPONSABLE", "SECRETAIRE"], {
      title: "Email marque urgent",
      message: `L'email "${updated.subject}" est passe en urgent.`,
      type: "EMAIL_URGENT",
      relatedEntityType: "Email",
      relatedEntityId: updated.id,
    });
  }

  if (payload.assigneeId !== undefined && payload.assigneeId !== before.assigneeId) {
    await createEmailLog(
      `Assignation email (${updated.subject}) a ${updated.assignedUser?.fullName ?? "non assignee"}`,
      updated.patientId,
    );
  }

  return toPriorityEmail(updated);
}

export async function deleteEmail(emailId: string) {
  const row = await prisma.email.findUnique({
    where: { id: emailId },
    select: { id: true, subject: true, patientId: true },
  });
  if (!row) return null;

  await prisma.email.delete({ where: { id: emailId } });
  await createEmailLog(`Suppression email: ${row.subject}`, row.patientId);
  return { id: row.id };
}

export async function assignEmail(emailId: string, assigneeId: string | null) {
  const before = await prisma.email.findUnique({
    where: { id: emailId },
    include: emailInclude,
  });
  if (!before) return null;

  const updated = await prisma.email.update({
    where: { id: emailId },
    data: { assigneeId },
    include: emailInclude,
  });

  if (assigneeId && assigneeId !== before.assigneeId) {
    await createEmailLog(
      `Assignation email (${updated.subject}) a ${updated.assignedUser?.fullName ?? "?"}`,
      updated.patientId,
    );
    await createNotification({
      userId: assigneeId,
      title: "Nouvel email assigné",
      message: `Un email vous a été assigné : ${updated.subject}`,
      type: "EMAIL_ASSIGNED",
      relatedEntityType: "Email",
      relatedEntityId: updated.id,
    });
  } else if (!assigneeId && before.assigneeId) {
    await createEmailLog(`Desassignation email (${updated.subject})`, updated.patientId);
  }

  return toPriorityEmail(updated);
}

export async function getEmailById(emailId: string) {
  const row = await prisma.email.findUnique({
    where: { id: emailId },
    include: emailInclude,
  });
  if (!row) return null;
  return toPriorityEmail(row);
}

export async function generateEmailAiSummary(emailId: string) {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
    include: emailInclude,
  });
  if (!email) return null;

  const result = buildAiSummary({
    subject: email.subject,
    sender: email.sender,
    bodyText: email.bodyText ?? email.snippet ?? "",
    category: email.category,
  });

  const updated = await prisma.email.update({
    where: { id: emailId },
    data: {
      aiSummary: result.summary,
      aiCategory: result.category,
      aiPriority: result.priority,
      aiGeneratedAt: new Date(),
    },
    include: emailInclude,
  });

  return toPriorityEmail(updated);
}
