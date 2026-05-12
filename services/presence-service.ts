import type { PresenceStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { roleLabel } from "@/lib/auth/roles";
import type { AuthUser } from "@/lib/auth/session";
import { presenceStatusLabel } from "@/lib/presence";

export async function getMyPresenceStatus(userId: string): Promise<PresenceStatus> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { presenceStatus: true },
  });
  return row?.presenceStatus ?? "DISPONIBLE";
}

export async function setMyPresenceStatus(userId: string, status: PresenceStatus) {
  await prisma.user.update({
    where: { id: userId },
    data: { presenceStatus: status },
  });
}

export async function getTeamPresenceOverview() {
  const now = new Date();

  const [users, activeSessions] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        role: true,
        presenceStatus: true,
      },
    }),
    prisma.session.findMany({
      where: { expiresAt: { gt: now } },
      select: { userId: true, lastSeenAt: true },
    }),
  ]);

  const lastSeenByUser = new Map<string, Date>();
  for (const s of activeSessions) {
    const prev = lastSeenByUser.get(s.userId);
    if (!prev || s.lastSeenAt > prev) {
      lastSeenByUser.set(s.userId, s.lastSeenAt);
    }
  }

  const onlineUserIds = new Set(activeSessions.map((s) => s.userId));

  return {
    members: users.map((u) => ({
      userId: u.id,
      fullName: u.fullName,
      role: u.role as AuthUser["role"],
      roleLabel: roleLabel(u.role as AuthUser["role"]),
      presenceStatus: u.presenceStatus,
      presenceLabel: presenceStatusLabel(u.presenceStatus),
      isOnline: onlineUserIds.has(u.id),
      lastSeenAt: lastSeenByUser.get(u.id)?.toISOString() ?? null,
    })),
  };
}
