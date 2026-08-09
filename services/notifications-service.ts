import type { UserRole } from "@prisma/client";
import type { NotificationsListResponse } from "@/types/domain";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

/** Notifications désactivées (modèle Notification retiré du schéma). */
export async function createNotification(_input: CreateNotificationInput) {
  return null;
}

export async function createNotificationsForRoles(
  _roles: UserRole[],
  _payload: Omit<CreateNotificationInput, "userId">,
) {
  // no-op
}

export async function getNotificationsForUser(
  _userId: string,
  _limit = 20,
): Promise<NotificationsListResponse> {
  return { items: [], unreadCount: 0 };
}

export async function markNotificationAsRead(
  _userId: string,
  _notificationId: string,
): Promise<
  | { ok: true; alreadyRead: boolean }
  | { ok: false; reason: "NOT_FOUND" }
> {
  return { ok: false, reason: "NOT_FOUND" };
}

export async function markAllNotificationsAsRead(_userId: string) {
  return { updatedCount: 0 };
}
