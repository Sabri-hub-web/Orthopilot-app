import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  MESSAGE_ATTACHMENT_MAX_FILES,
} from "@/lib/messages-ui";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export interface ParsedMessageFile {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export function messageAttachmentsRoot(): string {
  return path.join(process.cwd(), "storage", "message-attachments");
}

export function resolveAttachmentAbsolutePath(storageKey: string): string {
  const root = messageAttachmentsRoot();
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error("Chemin de fichier invalide.");
  }
  return resolved;
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ()àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ ]+/gi, "_");
  return base.slice(0, 180) || "fichier";
}

export function isAllowedMessageMime(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function validateMessageFiles(files: ParsedMessageFile[]): string | null {
  if (files.length > MESSAGE_ATTACHMENT_MAX_FILES) {
    return `Maximum ${MESSAGE_ATTACHMENT_MAX_FILES} fichiers par message.`;
  }
  for (const f of files) {
    if (f.sizeBytes > MESSAGE_ATTACHMENT_MAX_BYTES) {
      return `« ${f.fileName} » dépasse 5 Mo.`;
    }
    if (!isAllowedMessageMime(f.mimeType)) {
      return `Type de fichier non autorisé : ${f.fileName}.`;
    }
  }
  return null;
}

export async function persistMessageAttachments(
  messageId: string,
  files: ParsedMessageFile[],
): Promise<{ fileName: string; mimeType: string; sizeBytes: number; storageKey: string }[]> {
  const root = messageAttachmentsRoot();
  await mkdir(path.join(root, messageId), { recursive: true });

  const saved: { fileName: string; mimeType: string; sizeBytes: number; storageKey: string }[] = [];

  for (const file of files) {
    const ext = path.extname(sanitizeFileName(file.fileName)) || "";
    const storageKey = `${messageId}/${randomUUID()}${ext}`;
    const abs = resolveAttachmentAbsolutePath(storageKey);
    await writeFile(abs, file.buffer);
    saved.push({
      fileName: sanitizeFileName(file.fileName),
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storageKey,
    });
  }

  return saved;
}

export async function parseMessageFilesFromFormData(formData: FormData): Promise<ParsedMessageFile[]> {
  const entries = formData.getAll("files");
  const files: ParsedMessageFile[] = [];

  for (const entry of entries) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    const buffer = Buffer.from(await entry.arrayBuffer());
    const mimeType = entry.type || "application/octet-stream";
    files.push({
      buffer,
      fileName: sanitizeFileName(entry.name),
      mimeType,
      sizeBytes: buffer.length,
    });
  }

  return files;
}
