import { ActivityLog } from "@/types/domain";
import { prisma } from "@/server/db/client";

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function toActivityLog(item: { id: string; actor: string; message: string; createdAt: Date }): ActivityLog {
  return {
    id: item.id,
    actor: item.actor,
    message: item.message,
    createdAt: formatRelativeTime(item.createdAt),
  };
}

export async function getLogsList(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toActivityLog),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
