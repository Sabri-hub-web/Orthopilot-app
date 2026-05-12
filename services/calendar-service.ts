import type { CalendarEventType } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { calendarEventTypeLabel } from "@/lib/calendar";
import type { CalendarEventItem } from "@/types/domain";
import { writeActivityLog } from "@/server/activity-log";
import { toInternalTask } from "@/services/tasks-service";
import type { InternalTask } from "@/types/domain";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  type: CalendarEventType;
  patientId: string | null;
  patient: { firstName: string; lastName: string } | null;
  assigneeId: string | null;
  assignee: { fullName: string } | null;
  createdById: string | null;
  createdBy: { fullName: string } | null;
};

function patientName(p: { firstName: string; lastName: string } | null): string | null {
  if (!p) return null;
  return `${p.firstName} ${p.lastName}`;
}

export function toCalendarEventItem(row: EventRow): CalendarEventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    type: row.type,
    typeLabel: calendarEventTypeLabel(row.type),
    patientId: row.patientId,
    patientName: patientName(row.patient),
    assigneeId: row.assigneeId,
    assigneeName: row.assignee?.fullName ?? null,
    createdById: row.createdById,
    createdByName: row.createdBy?.fullName ?? null,
  };
}

const eventInclude = {
  patient: { select: { firstName: true, lastName: true } },
  assignee: { select: { fullName: true } },
  createdBy: { select: { fullName: true } },
} as const;

export async function getCalendarFeed(from: Date, to: Date): Promise<{
  events: CalendarEventItem[];
  tasks: InternalTask[];
}> {
  const [events, tasks] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        AND: [{ startAt: { lte: to } }, { endAt: { gte: from } }],
      },
      include: eventInclude,
      orderBy: { startAt: "asc" },
    }),
    prisma.task.findMany({
      where: {
        dueDate: { gte: from, lte: to },
      },
      include: {
        assignedUser: { select: { fullName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    events: events.map((e) => toCalendarEventItem(e)),
    tasks: tasks.map((t) => toInternalTask(t)),
  };
}

export async function createCalendarEvent(
  data: {
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    type: CalendarEventType;
    patientId?: string | null;
    assigneeId?: string | null;
  },
  createdById: string,
  actorLabel: string,
): Promise<CalendarEventItem> {
  const row = await prisma.calendarEvent.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      type: data.type,
      patientId: data.patientId ?? null,
      assigneeId: data.assigneeId ?? null,
      createdById,
    },
    include: eventInclude,
  });

  await writeActivityLog({
    actor: actorLabel,
    message: `Evenement calendrier cree: ${row.title}`,
    patientId: row.patientId,
  });

  return toCalendarEventItem(row);
}

export async function updateCalendarEvent(
  eventId: string,
  patch: {
    title?: string;
    description?: string | null;
    startAt?: string;
    endAt?: string;
    type?: CalendarEventType;
    patientId?: string | null;
    assigneeId?: string | null;
  },
  actorLabel: string,
): Promise<CalendarEventItem | null> {
  const existing = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: eventInclude,
  });
  if (!existing) return null;

  const startAt = patch.startAt !== undefined ? new Date(patch.startAt) : existing.startAt;
  const endAt = patch.endAt !== undefined ? new Date(patch.endAt) : existing.endAt;
  if (endAt <= startAt) {
    throw new Error("INVALID_RANGE");
  }

  const row = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.startAt !== undefined ? { startAt: new Date(patch.startAt) } : {}),
      ...(patch.endAt !== undefined ? { endAt: new Date(patch.endAt) } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.patientId !== undefined ? { patientId: patch.patientId } : {}),
      ...(patch.assigneeId !== undefined ? { assigneeId: patch.assigneeId } : {}),
    },
    include: eventInclude,
  });

  await writeActivityLog({
    actor: actorLabel,
    message: `Evenement calendrier modifie: ${row.title}`,
    patientId: row.patientId,
  });

  return toCalendarEventItem(row);
}

export async function deleteCalendarEvent(
  eventId: string,
  actorLabel: string,
): Promise<{ id: string } | null> {
  const existing = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, patientId: true },
  });
  if (!existing) return null;

  await prisma.calendarEvent.delete({ where: { id: eventId } });

  await writeActivityLog({
    actor: actorLabel,
    message: `Evenement calendrier supprime: ${existing.title}`,
    patientId: existing.patientId,
  });

  return { id: existing.id };
}
