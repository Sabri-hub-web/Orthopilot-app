import {
  InternalTask,
  PatientCommentLine,
  PatientDocumentLine,
  PatientFormPayload,
  PatientHubResponse,
  PatientListItem,
  PaymentFollowUp,
  PriorityEmail,
} from "@/types/domain";
import { prisma } from "@/server/db/client";
import { patientHubStatusLabelMap } from "@/lib/patients";
import type { PatientHubStatus, Prisma } from "@prisma/client";
import type { PatientsListQuery } from "@/lib/validation/patients";
import { writeActivityLog } from "@/server/activity-log";
import { toPaymentFollowUp } from "@/services/reglements-service";
import { toInternalTask } from "@/services/tasks-service";
import { toPriorityEmail } from "@/services/emails-service";

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
  nextAppointmentAt: Date | null;
  hubStatus: PatientHubStatus;
  _count: {
    reglements: number;
    tasks: number;
    emails: number;
  };
}): PatientListItem {
  return {
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    fullName: patientFullName(item.firstName, item.lastName),
    email: item.email,
    phone: item.phone,
    reglementsCount: item._count.reglements,
    tasksCount: item._count.tasks,
    emailsCount: item._count.emails,
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

  if (query.urgentEmail) {
    and.push({ emails: { some: { category: "URGENT" } } });
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
  const { page, pageSize, sort } = query;
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
        nextAppointmentAt: true,
        hubStatus: true,
        _count: {
          select: {
            reglements: true,
            tasks: true,
            emails: true,
          },
        },
      },
      orderBy: patientListOrderBy(sort),
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toPatientListItem),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPatientHub(patientId: string): Promise<PatientHubResponse | null> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      reglements: {
        orderBy: { dueDate: "asc" },
        include: { patient: true },
      },
      tasks: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          assignedUser: { select: { fullName: true } },
          patient: { select: { firstName: true, lastName: true } },
        },
      },
      emails: {
        orderBy: { receivedAt: "desc" },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          assignedUser: { select: { fullName: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, fullName: true } } },
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { id: true, fullName: true } } },
      },
      calendarEvents: {
        where: { startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" },
        take: 1,
        select: { startAt: true },
      },
    },
  });
  if (!patient) return null;

  const logs = await prisma.activityLog.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, actor: true, message: true, createdAt: true },
  });

  const reglements: PaymentFollowUp[] = patient.reglements.map((r) =>
    toPaymentFollowUp({
      ...r,
      patient: r.patient,
    }),
  );

  const tasks: InternalTask[] = patient.tasks.map((t) => toInternalTask(t));

  const emails: PriorityEmail[] = patient.emails.map((e) => toPriorityEmail(e));
  const comments: PatientCommentLine[] = patient.comments.map((c) => ({
    id: c.id,
    authorId: c.authorId ?? null,
    authorName: c.author?.fullName ?? "Équipe cabinet",
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
  const documents: PatientDocumentLine[] = patient.documents.map((d) => ({
    id: d.id,
    name: d.name,
    mimeType: d.mimeType ?? null,
    sizeBytes: d.sizeBytes,
    storagePath: d.storagePath ?? null,
    downloadUrl: d.downloadUrl ?? null,
    uploadedById: d.uploadedById ?? null,
    uploadedByName: d.uploadedBy?.fullName ?? null,
    createdAt: d.createdAt.toISOString(),
  }));
  const nextAppointmentFromCalendar = patient.calendarEvents[0]?.startAt ?? null;
  const nextAppointmentAt = nextAppointmentFromCalendar ?? patient.nextAppointmentAt;

  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      fullName: patientFullName(patient.firstName, patient.lastName),
      email: patient.email,
      phone: patient.phone,
      legalGuardian: patient.legalGuardian,
      nextAppointmentAt: nextAppointmentAt ? nextAppointmentAt.toISOString() : null,
      mutuelle: patient.mutuelle,
      internalComment: patient.internalComment,
      hubStatus: hubStatusLabel(patient.hubStatus),
    },
    reglements,
    tasks,
    emails,
    comments,
    documents,
    logs: logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function addPatientComment(patientId: string, content: string, author?: { id: string; fullName: string }) {
  const created = await prisma.patientComment.create({
    data: {
      patientId,
      content,
      authorId: author?.id ?? null,
    },
    include: { author: { select: { id: true, fullName: true } } },
  });

  await writeActivityLog({
    actor: author?.fullName ?? "Systeme",
    message: "Commentaire patient ajouté",
    patientId,
  });

  return {
    id: created.id,
    authorId: created.authorId ?? null,
    authorName: created.author?.fullName ?? author?.fullName ?? "Équipe cabinet",
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  } satisfies PatientCommentLine;
}

export async function addPatientDocumentPlaceholder(
  patientId: string,
  input: { name: string; mimeType?: string | null; sizeBytes?: number; storagePath?: string | null; downloadUrl?: string | null },
  author?: { id: string; fullName: string },
) {
  const created = await prisma.patientDocument.create({
    data: {
      patientId,
      uploadedById: author?.id ?? null,
      name: input.name,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? 0,
      storagePath: input.storagePath ?? null,
      downloadUrl: input.downloadUrl ?? null,
    },
    include: { uploadedBy: { select: { id: true, fullName: true } } },
  });

  await writeActivityLog({
    actor: author?.fullName ?? "Systeme",
    message: `Document ajouté: ${created.name}`,
    patientId,
  });

  return {
    id: created.id,
    name: created.name,
    mimeType: created.mimeType ?? null,
    sizeBytes: created.sizeBytes,
    storagePath: created.storagePath ?? null,
    downloadUrl: created.downloadUrl ?? null,
    uploadedById: created.uploadedById ?? null,
    uploadedByName: created.uploadedBy?.fullName ?? null,
    createdAt: created.createdAt.toISOString(),
  } satisfies PatientDocumentLine;
}

export async function createPatient(payload: PatientFormPayload) {
  const created = await prisma.patient.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      legalGuardian: payload.legalGuardian ?? null,
      nextAppointmentAt: payload.nextAppointmentAt ? new Date(payload.nextAppointmentAt) : null,
      mutuelle: payload.mutuelle ?? null,
      internalComment: payload.internalComment ?? null,
      hubStatus: payload.hubStatus ?? "ACTIF",
    },
  });

  await writeActivityLog({
    actor: "Systeme",
    message: `Creation patient: ${patientFullName(created.firstName, created.lastName)}`,
    patientId: created.id,
  });

  return created;
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
