import type { UserRole } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AppNotification, NotificationsListResponse } from "@/types/domain";
import { markPeerMessagesRead } from "@/services/messages-service";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

function previewBody(body: string, max = 100): string {
  const t = body.trim();
  if (!t) return "Nouveau message";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/** Plus de table Notification : les créations sont no-op. */
export async function createNotification(_input: CreateNotificationInput) {
  return null;
}

export async function createNotificationsForRoles(
  _roles: UserRole[],
  _payload: Omit<CreateNotificationInput, "userId">,
) {
  // no-op
}

/** Notifications synthétiques : messages non lus + tâches assignées ouvertes. */
export async function getNotificationsForUser(
  userId: string,
  limit = 20,
): Promise<NotificationsListResponse> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const [unreadMessages, openTasks, unreadMessageCount, openTaskCount] = await Promise.all([
    prisma.internalMessage.findMany({
      where: { recipientId: userId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderId: true,
        sender: { select: { fullName: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: "TERMINEE" },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: safeLimit,
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.internalMessage.count({
      where: { recipientId: userId, readAt: null },
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { not: "TERMINEE" },
      },
    }),
  ]);

  const messageItems: AppNotification[] = unreadMessages.map((m) => ({
    id: `msg:${m.id}`,
    title: `Message de ${m.sender.fullName}`,
    message: previewBody(m.body),
    type: "INTERNAL_MESSAGE",
    isRead: false,
    createdAt: m.createdAt.toISOString(),
    relatedEntityType: "InternalMessage",
    relatedEntityId: m.senderId,
  }));

  const taskItems: AppNotification[] = openTasks.map((t) => ({
    id: `task:${t.id}`,
    title: "Tâche assignée",
    message: t.title,
    type: "TASK_ASSIGNED",
    isRead: false,
    createdAt: t.createdAt.toISOString(),
    relatedEntityType: "Task",
    relatedEntityId: t.id,
  }));

  const items = [...messageItems, ...taskItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, safeLimit);

  return {
    items,
    unreadCount: unreadMessageCount + openTaskCount,
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  if (notificationId.startsWith("msg:")) {
    const messageId = notificationId.slice(4);
    const message = await prisma.internalMessage.findFirst({
      where: { id: messageId, recipientId: userId },
      select: { senderId: true, readAt: true },
    });
    if (!message) return { ok: false as const, reason: "NOT_FOUND" as const };
    if (message.readAt) return { ok: true as const, alreadyRead: true as const };
    await markPeerMessagesRead(userId, message.senderId);
    return { ok: true as const, alreadyRead: false as const };
  }

  if (notificationId.startsWith("task:")) {
    const taskId = notificationId.slice(5);
    const task = await prisma.task.findFirst({
      where: { id: taskId, assigneeId: userId },
      select: { id: true },
    });
    if (!task) return { ok: false as const, reason: "NOT_FOUND" as const };
    return { ok: true as const, alreadyRead: true as const };
  }

  return { ok: false as const, reason: "NOT_FOUND" as const };
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.internalMessage.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updatedCount: result.count };
}
