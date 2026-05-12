import type { UserRole } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AppNotification, NotificationsListResponse } from "@/types/domain";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

function toAppNotification(item: {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}): AppNotification {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.type,
    isRead: item.isRead,
    createdAt: item.createdAt.toISOString(),
    relatedEntityType: item.relatedEntityType,
    relatedEntityId: item.relatedEntityId,
  };
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
    },
  });
}

export async function createNotificationsForRoles(
  roles: UserRole[],
  payload: Omit<CreateNotificationInput, "userId">,
) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });
  if (!users.length) return;

  await prisma.notification.createMany({
    data: users.map((user) => ({
      userId: user.id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      relatedEntityType: payload.relatedEntityType ?? null,
      relatedEntityId: payload.relatedEntityId ?? null,
      isRead: false,
    })),
  });
}

export async function getNotificationsForUser(userId: string, limit = 20): Promise<NotificationsListResponse> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    items: items.map(toAppNotification),
    unreadCount,
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { id: true, isRead: true },
  });
  if (!row) return { ok: false as const, reason: "NOT_FOUND" as const };
  if (row.isRead) return { ok: true as const, alreadyRead: true as const };

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
  return { ok: true as const, alreadyRead: false as const };
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updatedCount: result.count };
}
