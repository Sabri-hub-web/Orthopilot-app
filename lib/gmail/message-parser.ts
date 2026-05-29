import { htmlToCleanText } from "@/lib/email-html";

type GmailHeader = { name: string; value: string };

type GmailPart = {
  partId?: string;
  filename?: string;
  mimeType?: string;
  body?: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailPart[];
};

export type GmailMessagePayload = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart & {
    headers?: GmailHeader[];
  };
};

export type GmailAttachmentMeta = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  gmailAttachmentId: string | null;
};

export type ParsedGmailMessage = {
  gmailMessageId: string;
  gmailThreadId: string;
  sender: string;
  subject: string;
  receivedAt: Date;
  snippet: string;
  bodyText: string;
  attachments: GmailAttachmentMeta[];
  hasAttachments: boolean;
};

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf8");
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  const found = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase());
  return found?.value?.trim() ?? "";
}

function extractPlainText(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data).trim();
  }
  if (part.parts?.length) {
    for (const child of part.parts) {
      const text = extractPlainText(child);
      if (text) return text;
    }
  }
  return "";
}

function extractHtml(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/html" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  if (part.parts?.length) {
    for (const child of part.parts) {
      const html = extractHtml(child);
      if (html) return html;
    }
  }
  return "";
}

function collectAttachments(part: GmailPart | undefined, out: GmailAttachmentMeta[]) {
  if (!part) return;
  const hasFilename = Boolean(part.filename && part.filename.trim().length > 0);
  const hasAttachmentId = Boolean(part.body?.attachmentId);
  if (hasFilename && hasAttachmentId) {
    out.push({
      fileName: part.filename!.trim(),
      mimeType: part.mimeType ?? "application/octet-stream",
      sizeBytes: part.body?.size ?? 0,
      gmailAttachmentId: part.body?.attachmentId ?? null,
    });
  }
  if (part.parts?.length) {
    for (const child of part.parts) collectAttachments(child, out);
  }
}

function parseEmailDate(raw: string, internalDate?: string): Date {
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (internalDate) {
    const ms = Number(internalDate);
    if (Number.isFinite(ms)) return new Date(ms);
  }
  return new Date();
}

export function parseGmailMessage(message: GmailMessagePayload): ParsedGmailMessage {
  const headers = message.payload?.headers ?? [];
  const sender = headerValue(headers, "From") || "Inconnu";
  const subject = headerValue(headers, "Subject") || "(Sans objet)";
  const dateHeader = headerValue(headers, "Date");
  const receivedAt = parseEmailDate(dateHeader, message.internalDate);

  let bodyText = extractPlainText(message.payload);
  if (!bodyText) {
    const html = extractHtml(message.payload);
    if (html) bodyText = htmlToCleanText(html);
  }
  const snippet = (message.snippet ?? bodyText.slice(0, 200)).trim();

  const attachments: GmailAttachmentMeta[] = [];
  collectAttachments(message.payload, attachments);

  return {
    gmailMessageId: message.id,
    gmailThreadId: message.threadId,
    sender,
    subject,
    receivedAt,
    snippet,
    bodyText: bodyText || snippet,
    attachments,
    hasAttachments: attachments.length > 0,
  };
}

const DOCUMENT_MIME_HINTS = ["pdf", "msword", "officedocument", "excel", "spreadsheet", "image/"];

export function isDocumentAttachment(mimeType: string): boolean {
  const m = mimeType.toLowerCase();
  return DOCUMENT_MIME_HINTS.some((hint) => m.includes(hint));
}

/**
 * Catégorisation automatique vers l'enum EmailCategory (URGENT | ADMINISTRATIF | SUIVI_CLINIQUE).
 * Les facettes Devis / Documents / RDV / Mutuelle sont gérées côté filtre (mots-clés + pièces jointes).
 */
export function inferEmailCategory(
  subject: string,
  bodyText: string,
  options?: { hasDocumentAttachment?: boolean },
): "URGENT" | "ADMINISTRATIF" | "SUIVI_CLINIQUE" {
  const text = `${subject} ${bodyText}`.toLowerCase();

  if (
    text.includes("urgent") ||
    text.includes("urgence") ||
    text.includes("douleur") ||
    text.includes("probleme") ||
    text.includes("problème") ||
    text.includes("impay") ||
    text.includes("relance") ||
    text.includes("retard") ||
    text.includes("plainte")
  ) {
    return "URGENT";
  }

  if (
    text.includes("appareil") ||
    text.includes("suivi") ||
    text.includes("clinique") ||
    text.includes("traitement") ||
    text.includes("controle") ||
    text.includes("contrôle")
  ) {
    return "SUIVI_CLINIQUE";
  }

  // devis / rdv / mutuelle / documents → administratif au niveau enum (facettes gérées par filtre)
  return "ADMINISTRATIF";
}
