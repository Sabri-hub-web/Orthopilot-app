import { roleLabel } from "@/lib/auth/roles";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";
import type {
  ConversationSummary,
  InternalMessageLine,
  MessagesThreadResponse,
  RecipientOption,
} from "@/types/domain";

function previewBody(body: string, max = 120): string {
  const t = body.trim();
  if (t.length === 0) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function listRecipients(excludeUserId: string): Promise<{ items: RecipientOption[] }> {
  const users = await prisma.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { id: true, fullName: true, role: true },
    orderBy: { fullName: "asc" },
    take: 100,
  });
  return {
    items: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      roleLabel: roleLabel(u.role),
    })),
  };
}

export async function getConversations(userId: string): Promise<{ conversations: ConversationSummary[] }> {
  const rows = await prisma.internalMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { recipientId: userId }],
    },
    select: {
      body: true,
      createdAt: true,
      senderId: true,
      recipientId: true,
      sender: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
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

  const rowsDesc = await prisma.internalMessage.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: peerId },
        { senderId: peerId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });
  const rows = [...rowsDesc].reverse();

  const messages: InternalMessageLine[] = rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    recipientId: m.recipientId,
    body: m.body,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    isMine: m.senderId === userId,
    attachments: [],
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
  files: { fileName: string }[] = [],
): Promise<
  | { ok: true; id: string; message: InternalMessageLine }
  | { ok: false; reason: "SELF" | "NOT_FOUND" | "VALIDATION"; message?: string }
> {
  if (recipientId === senderId) return { ok: false, reason: "SELF" };

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    return { ok: false, reason: "VALIDATION", message: "Message requis." };
  }

  if (files.length > 0) {
    return {
      ok: false,
      reason: "VALIDATION",
      message: "Les pièces jointes ne sont plus disponibles.",
    };
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, fullName: true },
  });
  if (!recipient) return { ok: false, reason: "NOT_FOUND" };

  const created = await prisma.internalMessage.create({
    data: {
      senderId,
      recipientId,
      body: trimmedBody,
    },
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      body: true,
      readAt: true,
      createdAt: true,
    },
  });

  await writeActivityLog({
    actor: senderName,
    message: `Message interne envoye vers ${recipient.fullName} (contenu non journalise).`,
  });

  const message: InternalMessageLine = {
    id: created.id,
    senderId: created.senderId,
    recipientId: created.recipientId,
    body: created.body,
    readAt: created.readAt?.toISOString() ?? null,
    createdAt: created.createdAt.toISOString(),
    isMine: true,
    attachments: [],
  };

  return { ok: true, id: created.id, message };
}

export async function getMessageAttachmentForUser(
  _userId: string,
  _attachmentId: string,
): Promise<
  | {
      ok: true;
      fileName: string;
      mimeType: string;
      storageKey: string;
    }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" }
> {
  return { ok: false, reason: "NOT_FOUND" };
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
