import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { resolveAttachmentAbsolutePath, sanitizeFileName } from "@/lib/message-attachments";

export const SUPABASE_STORAGE_PREFIX = "sb/";
export const MESSAGES_ATTACHMENTS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() || "messages-attachments";

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function objectPath(messageId: string, fileName: string): string {
  const ext = path.extname(sanitizeFileName(fileName)) || "";
  return `${messageId}/${randomUUID()}${ext}`;
}

export async function uploadMessageAttachmentFile(
  messageId: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ storageKey: string }> {
  const relativePath = objectPath(messageId, fileName);

  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Client Supabase indisponible.");

    const { error } = await supabase.storage
      .from(MESSAGES_ATTACHMENTS_BUCKET)
      .upload(relativePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload failed", error);
      throw new Error("Échec de l’envoi du fichier vers le stockage.");
    }

    return { storageKey: `${SUPABASE_STORAGE_PREFIX}${relativePath}` };
  }

  const root = path.join(process.cwd(), "storage", "message-attachments");
  await mkdir(path.join(root, messageId), { recursive: true });
  const abs = resolveAttachmentAbsolutePath(relativePath);
  await writeFile(abs, buffer);
  return { storageKey: relativePath };
}

export async function downloadMessageAttachmentFile(storageKey: string): Promise<Buffer> {
  if (storageKey.startsWith(SUPABASE_STORAGE_PREFIX)) {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Stockage Supabase non configuré.");

    const objectKey = storageKey.slice(SUPABASE_STORAGE_PREFIX.length);
    const { data, error } = await supabase.storage
      .from(MESSAGES_ATTACHMENTS_BUCKET)
      .download(objectKey);

    if (error || !data) {
      console.error("Supabase download failed", error);
      throw new Error("Fichier introuvable dans le stockage.");
    }

    return Buffer.from(await data.arrayBuffer());
  }

  const abs = resolveAttachmentAbsolutePath(storageKey);
  return readFile(abs);
}
