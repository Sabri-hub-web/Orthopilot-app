import { roleLabel } from "@/lib/auth/roles";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";
import { MESSAGE_ATTACHMENT_MAX_BYTES } from "@/lib/messages-ui";
import {
  persistMessageAttachments,
  type ParsedMessageFile,
  validateMessageFiles,
} from "@/lib/message-attachments";
import { createNotification } from "@/services/notifications-service";
import type {
  ConversationSummary,
  InternalMessageLine,
  MessagesThreadResponse,
  RecipientOption,
} from "@/types/domain";

function previewBody(body: string, hasAttachments: boolean, max = 120): string {
  const t = body.trim();
  if (t.length > 0) {
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  }
  if (hasAttachments) return "📎 Pièce jointe";
  return "";
}

export async function listRecipients(excludeUserId: string): Promise<{ items: RecipientOption[] }> {
  const users = await prisma.user.findMany({
    where: { id: { not: excludeUserId } },
    select: { id: true, fullName: true, role: true },
    orderBy: { fullName: "asc" },
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
    include: {
      sender: { select: { id: true, fullName: true } },
      recipient: { select: { id: true, fullName: true } },
      attachments: { select: { id: true }, take: 1 },
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
        lastPreview: previewBody(row.body, row.attachments.length > 0, 100),
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
      attachments: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
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
    attachments: m.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      createdAt: a.createdAt.toISOString(),
    })),
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
  files: ParsedMessageFile[] = [],
): Promise<
  | { ok: true; id: string; message: InternalMessageLine }
  | { ok: false; reason: "SELF" | "NOT_FOUND" | "VALIDATION"; message?: string }
> {
  if (recipientId === senderId) return { ok: false, reason: "SELF" };

  const trimmedBody = body.trim();
  if (!trimmedBody && files.length === 0) {
    return { ok: false, reason: "VALIDATION", message: "Message ou pièce jointe requis." };
  }

  const fileError = validateMessageFiles(files, MESSAGE_ATTACHMENT_MAX_BYTES);
  if (fileError) return { ok: false, reason: "VALIDATION", message: fileError };

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, fullName: true },
  });
  if (!recipient) return { ok: false, reason: "NOT_FOUND" };

  const msg = await prisma.internalMessage.create({
    data: {
      senderId,
      recipientId,
      body: trimmedBody,
    },
    select: { id: true },
  });

  if (files.length > 0) {
    try {
      const saved = await persistMessageAttachments(msg.id, files);
      await prisma.internalMessageAttachment.createMany({
        data: saved.map((s) => ({
          messageId: msg.id,
          fileName: s.fileName,
          mimeType: s.mimeType,
          sizeBytes: s.sizeBytes,
          storageKey: s.storageKey,
        })),
      });
    } catch (err) {
      await prisma.internalMessage.delete({ where: { id: msg.id } }).catch(() => undefined);
      console.error("Attachment persist failed", err);
      return {
        ok: false,
        reason: "VALIDATION",
        message:
          "Impossible d’enregistrer la pièce jointe. Vérifiez le stockage (Supabase) ou la migration DB.",
      };
    }
  }

  const notifPreview = previewBody(trimmedBody, files.length > 0, 160);

  await writeActivityLog({
    actor: senderName,
    message: `Message interne envoye vers ${recipient.fullName} (contenu non journalise).`,
  });

  await createNotification({
    userId: recipientId,
    title: `Message de ${senderName}`,
    message: notifPreview,
    type: "INTERNAL_MESSAGE",
    relatedEntityType: "InternalMessage",
    relatedEntityId: msg.id,
  });

  const created = await prisma.internalMessage.findUnique({
    where: { id: msg.id },
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      body: true,
      readAt: true,
      createdAt: true,
      attachments: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!created) return { ok: false, reason: "NOT_FOUND" };

  const message: InternalMessageLine = {
    id: created.id,
    senderId: created.senderId,
    recipientId: created.recipientId,
    body: created.body,
    readAt: created.readAt?.toISOString() ?? null,
    createdAt: created.createdAt.toISOString(),
    isMine: true,
    attachments: created.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  return { ok: true, id: msg.id, message };
}

export async function getMessageAttachmentForUser(
  userId: string,
  attachmentId: string,
): Promise<
  | {
      ok: true;
      fileName: string;
      mimeType: string;
      storageKey: string;
    }
  | { ok: false; reason: "NOT_FOUND" | "FORBIDDEN" }
> {
  const att = await prisma.internalMessageAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      message: { select: { senderId: true, recipientId: true } },
    },
  });

  if (!att) return { ok: false, reason: "NOT_FOUND" };

  const { senderId, recipientId } = att.message;
  if (senderId !== userId && recipientId !== userId) {
    return { ok: false, reason: "FORBIDDEN" };
  }

  return {
    ok: true,
    fileName: att.fileName,
    mimeType: att.mimeType,
    storageKey: att.storageKey,
  };
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
