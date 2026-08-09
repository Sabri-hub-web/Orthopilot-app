import {
  PatientCommentLine,
  PatientFormPayload,
  PatientHubResponse,
  PatientListItem,
  PaymentFollowUp,
} from "@/types/domain";
import { prisma } from "@/server/db/client";
import { patientHubStatusLabelMap } from "@/lib/patients";
import type { PatientHubStatus, Prisma } from "@prisma/client";
import type { PatientsListQuery } from "@/lib/validation/patients";
import { writeActivityLog } from "@/server/activity-log";
import { toPaymentFollowUp } from "@/services/reglements-service";

function formatDateTimeLocal(date: Date): string {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function patientFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`;
}

function hubStatusLabel(status: PatientHubStatus) {
  return patientHubStatusLabelMap[status];
}

function toPatientListItem(item: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  legalGuardian: string | null;
  mutuelle: string | null;
  nextAppointmentAt: Date | null;
  hubStatus: PatientHubStatus;
  _count: {
    reglements: number;
    tasks: number;
  };
}): PatientListItem {
  return {
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    fullName: patientFullName(item.firstName, item.lastName),
    email: item.email,
    phone: item.phone,
    legalGuardian: item.legalGuardian,
    mutuelle: item.mutuelle,
    reglementsCount: item._count.reglements,
    tasksCount: item._count.tasks,
    emailsCount: 0,
    nextAppointmentAt: item.nextAppointmentAt ? formatDateTimeLocal(item.nextAppointmentAt) : null,
    hubStatus: hubStatusLabel(item.hubStatus),
  };
}

function searchWhere(search: string | undefined) {
  const q = search?.trim();
  if (!q) return undefined;
  return {
    OR: [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ],
  };
}

function patientListOrderBy(sort: PatientsListQuery["sort"]): Prisma.PatientOrderByWithRelationInput[] {
  switch (sort) {
    case "name_desc":
      return [{ lastName: "desc" }, { firstName: "desc" }];
    case "created_desc":
      return [{ createdAt: "desc" }];
    case "created_asc":
      return [{ createdAt: "asc" }];
    case "next_rdv_asc":
      return [{ nextAppointmentAt: "asc" }];
    case "next_rdv_desc":
      return [{ nextAppointmentAt: "desc" }];
    case "name_asc":
    default:
      return [{ lastName: "asc" }, { firstName: "asc" }];
  }
}

function buildPatientsListWhere(query: PatientsListQuery): Prisma.PatientWhereInput {
  const and: Prisma.PatientWhereInput[] = [];

  const searchCond = searchWhere(query.search);
  if (searchCond) and.push(searchCond);

  if (query.rdvSoon) {
    const days = query.rdvSoonDays ?? 7;
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    end.setHours(23, 59, 59, 999);
    and.push({
      nextAppointmentAt: {
        not: null,
        gte: now,
        lte: end,
      },
    });
  }

  if (query.noNextRdv) {
    and.push({ nextAppointmentAt: null });
  }

  if (query.reglementRetard) {
    and.push({ reglements: { some: { status: "EN_RETARD" } } });
  }

  if (query.reglementOrange) {
    and.push({
      reglements: {
        some: { status: { in: ["PARTIEL", "RELANCE_ENVOYEE"] } },
      },
    });
  }

  if (query.openTask) {
    and.push({
      tasks: { some: { status: { not: "TERMINEE" } } },
    });
  }

  if (query.missingEmail) {
    and.push({
      OR: [{ email: null }, { email: "" }],
    });
  }

  if (query.missingPhone) {
    and.push({
      OR: [{ phone: null }, { phone: "" }],
    });
  }

  if (query.hasMutuelle) {
    and.push({
      AND: [{ mutuelle: { not: null } }, { NOT: { mutuelle: "" } }],
    });
  }

  if (!and.length) return {};
  return { AND: and };
}

export async function getPatientsList(query: PatientsListQuery) {
  const { page, sort } = query;
  const pageSize = Math.min(Math.max(query.pageSize, 1), 100);
  const skip = (page - 1) * pageSize;
  const where = buildPatientsListWhere(query);

  const [total, rows] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        legalGuardian: true,
        mutuelle: true,
        nextAppointmentAt: true,
        hubStatus: true,
        createdAt: true,
      },
      orderBy: patientListOrderBy(sort),
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map((item) =>
      toPatientListItem({
        ...item,
        _count: { reglements: 0, tasks: 0 },
      }),
    ),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPatientHub(patientId: string): Promise<PatientHubResponse | null> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      legalGuardian: true,
      nextAppointmentAt: true,
      mutuelle: true,
      internalComment: true,
      hubStatus: true,
      reglements: {
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
        take: 100,
        select: {
          id: true,
          patientId: true,
          amountDue: true,
          dueDate: true,
          status: true,
          comment: true,
          relanceCount: true,
          lastRelanceAt: true,
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          authorId: true,
          recipientId: true,
          content: true,
          isDone: true,
          doneAt: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { id: true, fullName: true } },
          recipient: { select: { id: true, fullName: true } },
        },
      },
    },
  });
  if (!patient) return null;

  const patientName = { firstName: patient.firstName, lastName: patient.lastName };
  const reglements: PaymentFollowUp[] = patient.reglements.map((r) =>
    toPaymentFollowUp({
      ...r,
      patient: patientName,
    }),
  );

  const comments: PatientCommentLine[] = patient.comments.map((c) => ({
    id: c.id,
    authorId: c.authorId ?? null,
    authorName: c.author?.fullName ?? "Équipe cabinet",
    recipientId: c.recipientId ?? null,
    recipientName: c.recipient?.fullName ?? null,
    content: c.content,
    isDone: c.isDone,
    doneAt: c.doneAt ? c.doneAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      fullName: patientFullName(patient.firstName, patient.lastName),
      email: patient.email,
      phone: patient.phone,
      legalGuardian: patient.legalGuardian,
      nextAppointmentAt: patient.nextAppointmentAt
        ? patient.nextAppointmentAt.toISOString()
        : null,
      mutuelle: patient.mutuelle,
      internalComment: patient.internalComment,
      hubStatus: hubStatusLabel(patient.hubStatus),
    },
    reglements,
    tasks: [],
    emails: [],
    comments,
    documents: [],
    logs: [],
  };
}

export async function addPatientComment(
  patientId: string,
  content: string,
  options?: { author?: { id: string; fullName: string }; recipientId?: string | null },
) {
  const created = await prisma.patientComment.create({
    data: {
      patientId,
      content: content.trim(),
      authorId: options?.author?.id ?? null,
      recipientId: options?.recipientId ?? null,
    },
    include: {
      author: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
    },
  });

  await writeActivityLog({
    actor: options?.author?.fullName ?? "Systeme",
    message: "Commentaire patient ajouté",
    patientId,
  });

  return {
    id: created.id,
    authorId: created.authorId ?? null,
    authorName: created.author?.fullName ?? options?.author?.fullName ?? "Équipe cabinet",
    recipientId: created.recipientId ?? null,
    recipientName: created.recipient?.fullName ?? null,
    content: created.content,
    isDone: created.isDone,
    doneAt: created.doneAt ? created.doneAt.toISOString() : null,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  } satisfies PatientCommentLine;
}

export async function updatePatientCommentStatus(
  patientId: string,
  commentId: string,
  isDone: boolean,
  actor?: { fullName: string },
) {
  const updated = await prisma.patientComment.updateMany({
    where: { id: commentId, patientId },
    data: { isDone, doneAt: isDone ? new Date() : null },
  });
  if (updated.count === 0) return null;

  const row = await prisma.patientComment.findUnique({
    where: { id: commentId },
    include: {
      author: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
    },
  });
  if (!row) return null;

  await writeActivityLog({
    actor: actor?.fullName ?? "Systeme",
    message: isDone ? "Commentaire patient marqué terminé" : "Commentaire patient réactivé",
    patientId,
  });

  return {
    id: row.id,
    authorId: row.authorId ?? null,
    authorName: row.author?.fullName ?? "Équipe cabinet",
    recipientId: row.recipientId ?? null,
    recipientName: row.recipient?.fullName ?? null,
    content: row.content,
    isDone: row.isDone,
    doneAt: row.doneAt ? row.doneAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } satisfies PatientCommentLine;
}

export async function createPatient(payload: PatientFormPayload) {
  // Schéma Patient simplifié uniquement (pas d'ActivityLog / documents / relations nestées).
  return prisma.patient.create({
    data: {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email?.trim() ? payload.email.trim() : null,
      phone: payload.phone?.trim() ? payload.phone.trim() : null,
      legalGuardian: payload.legalGuardian?.trim() ? payload.legalGuardian.trim() : null,
      nextAppointmentAt: payload.nextAppointmentAt
        ? new Date(payload.nextAppointmentAt)
        : null,
      mutuelle: payload.mutuelle?.trim() ? payload.mutuelle.trim() : null,
      internalComment: payload.internalComment?.trim()
        ? payload.internalComment.trim()
        : null,
      hubStatus: payload.hubStatus ?? "ACTIF",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });
}

export async function updatePatient(patientId: string, payload: Partial<PatientFormPayload>) {
  const before = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!before) return null;

  const updated = await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...(payload.firstName !== undefined ? { firstName: payload.firstName } : {}),
      ...(payload.lastName !== undefined ? { lastName: payload.lastName } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.legalGuardian !== undefined ? { legalGuardian: payload.legalGuardian } : {}),
      ...(payload.nextAppointmentAt !== undefined
        ? {
            nextAppointmentAt: payload.nextAppointmentAt
              ? new Date(payload.nextAppointmentAt)
              : null,
          }
        : {}),
      ...(payload.mutuelle !== undefined ? { mutuelle: payload.mutuelle } : {}),
      ...(payload.internalComment !== undefined ? { internalComment: payload.internalComment } : {}),
      ...(payload.hubStatus !== undefined ? { hubStatus: payload.hubStatus } : {}),
    },
  });

  const name = patientFullName(updated.firstName, updated.lastName);
  const nonCommentKeys = Object.keys(payload).filter((k) => k !== "internalComment");
  if (nonCommentKeys.length > 0) {
    await writeActivityLog({
      actor: "Systeme",
      message: `Modification patient: ${name}`,
      patientId: updated.id,
    });
  }

  if (
    payload.internalComment !== undefined &&
    payload.internalComment !== before.internalComment
  ) {
    await writeActivityLog({
      actor: "Systeme",
      message: `Mise a jour commentaire interne patient: ${name}`,
      patientId: updated.id,
    });
  }

  return updated;
}
