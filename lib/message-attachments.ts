import path from "path";
import { uploadMessageAttachmentFile } from "@/server/storage/message-attachments-storage";

export const MESSAGE_ATTACHMENT_MAX_FILES = 5;

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

const BLOCKED_EXT = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".js",
  ".mjs",
  ".sh",
  ".ps1",
  ".dll",
  ".msi",
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

export function validateMessageFiles(
  files: ParsedMessageFile[],
  maxBytes: number,
): string | null {
  if (files.length > MESSAGE_ATTACHMENT_MAX_FILES) {
    return `Maximum ${MESSAGE_ATTACHMENT_MAX_FILES} fichiers par message.`;
  }
  for (const f of files) {
    const ext = path.extname(f.fileName).toLowerCase();
    if (BLOCKED_EXT.has(ext)) {
      return `Extension non autorisée : ${f.fileName}`;
    }
    if (f.sizeBytes > maxBytes) {
      return `« ${f.fileName} » dépasse ${Math.round(maxBytes / (1024 * 1024))} Mo.`;
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
  const saved: { fileName: string; mimeType: string; sizeBytes: number; storageKey: string }[] = [];

  for (const file of files) {
    const safeName = sanitizeFileName(file.fileName);
    const { storageKey } = await uploadMessageAttachmentFile(
      messageId,
      file.buffer,
      safeName,
      file.mimeType,
    );
    saved.push({
      fileName: safeName,
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
