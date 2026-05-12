import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";
import { createNotification } from "@/services/notifications-service";
import type {
  ConversationSummary,
  InternalMessageLine,
  MessagesThreadResponse,
  RecipientOption,
} from "@/types/domain";

function previewBody(body: string, max = 120): string {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function listRecipients(excludeUserId: string): Promise<{ items: RecipientOption[] }> {
  const users = await prisma.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
  return { items: users };
}

export async function getConversations(userId: string): Promise<{ conversations: ConversationSummary[] }> {
  const rows = await prisma.internalMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { recipientId: userId }],
    },
    include: {
      sender: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const unreadAgg = await prisma.internalMessage.groupBy({
    by: ["senderId"],
    where: {
      recipientId: userId,
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadAgg.map((u) => [u.senderId, u._count._all]));

  const convMap = new Map<string, ConversationSummary>();

  for (const row of rows) {
    const peer = row.senderId === userId ? row.recipient : row.sender;
    if (!convMap.has(peer.id)) {
      convMap.set(peer.id, {
        peerId: peer.id,
        peerName: peer.fullName,
        lastMessageAt: row.createdAt.toISOString(),
        lastPreview: previewBody(row.body, 100),
        unreadCount: unreadMap.get(peer.id) ?? 0,
      });
    }
  }

  const conversations = [...convMap.values()].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

  return { conversations };
}

export async function getThread(
  userId: string,
  peerId: string,
): Promise<MessagesThreadResponse | null | "SELF"> {
  if (peerId === userId) return "SELF";

  const peer = await prisma.user.findUnique({
    where: { id: peerId },
    select: { id: true, fullName: true },
  });
  if (!peer) return null;

  const rows = await prisma.internalMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: peerId },
        { senderId: peerId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });

  const messages: InternalMessageLine[] = rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    recipientId: m.recipientId,
    body: m.body,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    isMine: m.senderId === userId,
  }));

  return {
    peer: { id: peer.id, fullName: peer.fullName },
    messages,
  };
}

export async function sendInternalMessage(
  senderId: string,
  senderName: string,
  recipientId: string,
  body: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: "SELF" | "NOT_FOUND" }> {
  if (recipientId === senderId) return { ok: false, reason: "SELF" };

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, fullName: true },
  });
  if (!recipient) return { ok: false, reason: "NOT_FOUND" };

  const msg = await prisma.internalMessage.create({
    data: {
      senderId,
      recipientId,
      body,
    },
    select: { id: true },
  });

  await writeActivityLog({
    actor: senderName,
    message: `Message interne envoye vers ${recipient.fullName} (contenu non journalise).`,
  });

  await createNotification({
    userId: recipientId,
    title: `Message de ${senderName}`,
    message: previewBody(body, 160),
    type: "INTERNAL_MESSAGE",
    relatedEntityType: "InternalMessage",
    relatedEntityId: msg.id,
  });

  return { ok: true, id: msg.id };
}

export async function markPeerMessagesRead(userId: string, peerId: string): Promise<{ updated: number }> {
  const result = await prisma.internalMessage.updateMany({
    where: {
      senderId: peerId,
      recipientId: userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}
