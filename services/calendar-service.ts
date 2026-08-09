import type { CalendarEventTypeApi, CalendarEventItem, InternalTask } from "@/types/domain";
import { prisma } from "@/server/db/client";
import { toInternalTask } from "@/services/tasks-service";

/** Calendrier événements désactivé (modèle CalendarEvent retiré). Les tâches restent visibles. */

export async function getCalendarFeed(from: Date, to: Date): Promise<{
  events: CalendarEventItem[];
  tasks: InternalTask[];
}> {
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { gte: from, lte: to },
    },
    include: {
      assignedUser: { select: { fullName: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return {
    events: [],
    tasks: tasks.map((t) => toInternalTask(t)),
  };
}

export async function createCalendarEvent(
  _data: {
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    type: CalendarEventTypeApi;
    patientId?: string | null;
    assigneeId?: string | null;
  },
  _createdById: string,
  _actorLabel: string,
): Promise<CalendarEventItem> {
  throw new Error("Module calendrier (événements) désactivé.");
}

export async function updateCalendarEvent(
  _eventId: string,
  _patch: {
    title?: string;
    description?: string | null;
    startAt?: string;
    endAt?: string;
    type?: CalendarEventTypeApi;
    patientId?: string | null;
    assigneeId?: string | null;
  },
  _actorLabel: string,
): Promise<CalendarEventItem | null> {
  return null;
}

export async function deleteCalendarEvent(
  _eventId: string,
  _actorLabel: string,
): Promise<{ id: string } | null> {
  return null;
}
