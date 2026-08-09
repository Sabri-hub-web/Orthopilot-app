import { TaskFormPayload, InternalTask } from "@/types/domain";
import { taskPriorityLabelMap, taskStatusLabelMap } from "@/lib/tasks";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";
import { createNotification, createNotificationsForRoles } from "@/services/notifications-service";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTaskDueDate(date: Date): string {
  return formatDate(date);
}

export function toInternalTask(item: {
  id: string;
  title: string;
  comment: string | null;
  assigneeId: string | null;
  assignee: string | null;
  assignedUser: { fullName: string } | null;
  patientId: string | null;
  patient: { firstName: string; lastName: string } | null;
  dueDate: Date;
  priority: keyof typeof taskPriorityLabelMap;
  status: keyof typeof taskStatusLabelMap;
  createdAt?: Date | null;
}): InternalTask {
  return {
    id: item.id,
    title: item.title,
    comment: item.comment,
    assigneeId: item.assigneeId,
    assignee: item.assignedUser?.fullName ?? item.assignee ?? "Non assignee",
    patientId: item.patientId,
    patientName: item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : null,
    dueDate: formatTaskDueDate(item.dueDate),
    priority: taskPriorityLabelMap[item.priority],
    status: taskStatusLabelMap[item.status],
    createdAt: item.createdAt ? item.createdAt.toISOString() : null,
  };
}

async function createTaskLog(message: string, patientId?: string | null) {
  await writeActivityLog({ actor: "Systeme", message, patientId });
}

export async function getTasksList(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.task.count(),
    prisma.task.findMany({
      include: {
        assignedUser: { select: { fullName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toInternalTask),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getTaskById(taskId: string): Promise<InternalTask | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedUser: { select: { fullName: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  });
  if (!task) return null;
  return toInternalTask(task);
}

export async function createTask(payload: TaskFormPayload) {
  const assignee =
    payload.assigneeId
      ? await prisma.user.findUnique({
          where: { id: payload.assigneeId },
          select: { fullName: true },
        })
      : null;

  const task = await prisma.task.create({
    data: {
      title: payload.title,
      comment: payload.comment ?? null,
      dueDate: new Date(payload.dueDate),
      priority: payload.priority,
      status: payload.status,
      assignee: assignee?.fullName ?? null,
      assigneeId: payload.assigneeId ?? null,
      patientId: payload.patientId ?? null,
    },
    include: {
      assignedUser: { select: { fullName: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  });

  await createTaskLog(`Creation tache: ${task.title}`, task.patientId);

  if (task.assigneeId) {
    await createNotification({
      userId: task.assigneeId,
      title: "Nouvelle tache assignee",
      message: `La tache "${task.title}" vous a ete assignee.`,
      type: "TASK_ASSIGNED",
      relatedEntityType: "Task",
      relatedEntityId: task.id,
    });
  }

  if (task.priority === "URGENTE") {
    await createNotificationsForRoles(["ADMIN", "RESPONSABLE", "SECRETAIRE"], {
      title: "Tache urgente creee",
      message: `La tache "${task.title}" est marquee urgente.`,
      type: "TASK_URGENT",
      relatedEntityType: "Task",
      relatedEntityId: task.id,
    });
  }

  return toInternalTask(task);
}

export async function updateTask(taskId: string, payload: Partial<TaskFormPayload>) {
  const before = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignedUser: { select: { fullName: true } } },
  });
  if (!before) return null;

  const assignee =
    payload.assigneeId !== undefined && payload.assigneeId !== null
      ? await prisma.user.findUnique({
          where: { id: payload.assigneeId },
          select: { fullName: true },
        })
      : null;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: payload.title,
      comment: payload.comment,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      priority: payload.priority,
      status: payload.status,
      assignee: payload.assigneeId !== undefined ? (assignee?.fullName ?? null) : undefined,
      assigneeId: payload.assigneeId,
      patientId: payload.patientId,
    },
    include: {
      assignedUser: { select: { fullName: true } },
      patient: { select: { firstName: true, lastName: true } },
    },
  });

  await createTaskLog(`Modification tache: ${updated.title}`, updated.patientId);

  if (payload.status && payload.status !== before.status) {
    await createTaskLog(
      `Changement statut tache (${updated.title}): ${before.status} -> ${payload.status}`,
      updated.patientId,
    );
    if (payload.status === "TERMINEE") {
      await createTaskLog(`Tache terminee: ${updated.title}`, updated.patientId);
    }
  }

  if (payload.assigneeId !== undefined && payload.assigneeId !== before.assigneeId) {
    await createTaskLog(
      `Assignation tache (${updated.title}) a ${updated.assignedUser?.fullName ?? "non assignee"}`,
      updated.patientId,
    );

    if (updated.assigneeId) {
      await createNotification({
        userId: updated.assigneeId,
        title: "Tache assignee",
        message: `La tache "${updated.title}" vous a ete assignee.`,
        type: "TASK_ASSIGNED",
        relatedEntityType: "Task",
        relatedEntityId: updated.id,
      });
    }
  }

  if (payload.priority === "URGENTE" && before.priority !== "URGENTE") {
    await createNotificationsForRoles(["ADMIN", "RESPONSABLE", "SECRETAIRE"], {
      title: "Tache devenue urgente",
      message: `La tache "${updated.title}" est maintenant urgente.`,
      type: "TASK_URGENT",
      relatedEntityType: "Task",
      relatedEntityId: updated.id,
    });
  }

  return toInternalTask(updated);
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, title: true, patientId: true },
  });
  if (!task) return null;

  await prisma.task.delete({ where: { id: taskId } });
  await createTaskLog(`Suppression tache: ${task.title}`, task.patientId);
  return { id: task.id };
}
