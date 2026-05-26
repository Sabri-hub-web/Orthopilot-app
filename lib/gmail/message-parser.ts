type GmailHeader = { name: string; value: string };

type GmailPart = {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
};

export type GmailMessagePayload = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailPart[];
  };
};

export type ParsedGmailMessage = {
  gmailMessageId: string;
  gmailThreadId: string;
  sender: string;
  subject: string;
  receivedAt: Date;
  snippet: string;
  bodyText: string;
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

function extractHtmlAsFallback(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/html" && part.body?.data) {
    const html = decodeBase64Url(part.body.data);
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  if (part.parts?.length) {
    for (const child of part.parts) {
      const text = extractHtmlAsFallback(child);
      if (text) return text;
    }
  }
  return "";
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
    bodyText = extractHtmlAsFallback(message.payload);
  }
  const snippet = (message.snippet ?? bodyText.slice(0, 200)).trim();

  return {
    gmailMessageId: message.id,
    gmailThreadId: message.threadId,
    sender,
    subject,
    receivedAt,
    snippet,
    bodyText: bodyText || snippet,
  };
}

export function inferEmailCategory(subject: string, bodyText: string): "URGENT" | "ADMINISTRATIF" | "SUIVI_CLINIQUE" {
  const text = `${subject} ${bodyText}`.toLowerCase();
  if (
    text.includes("urgent") ||
    text.includes("douleur") ||
    text.includes("impay") ||
    text.includes("impaye") ||
    text.includes("douloureux")
  ) {
    return "URGENT";
  }
  if (
    text.includes("suivi") ||
    text.includes("appareil") ||
    text.includes("douleur") ||
    text.includes("clinique") ||
    text.includes("traitement")
  ) {
    return "SUIVI_CLINIQUE";
  }
  return "ADMINISTRATIF";
}
