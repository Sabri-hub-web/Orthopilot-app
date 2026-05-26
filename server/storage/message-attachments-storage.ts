import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile, unlink } from "fs/promises";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { resolveAttachmentAbsolutePath, sanitizeFileName } from "@/lib/message-attachments";

export const SUPABASE_STORAGE_PREFIX = "sb/";
export const MESSAGES_ATTACHMENTS_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET?.trim() || "messages-attachments";

export type MessageStorageBackend = "supabase" | "local" | "unconfigured";

export function getMessageStorageBackend(): MessageStorageBackend {
  if (isSupabaseStorageConfigured()) return "supabase";
  if (process.env.VERCEL) return "unconfigured";
  return "local";
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function getStorageEnvDiagnostics(): Record<string, string | boolean> {
  return {
    backend: getMessageStorageBackend(),
    supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    supabaseServiceKeySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    bucket: MESSAGES_ATTACHMENTS_BUCKET,
    vercel: Boolean(process.env.VERCEL),
    forceLocal: process.env.MESSAGE_ATTACHMENTS_STORAGE?.trim() === "local",
  };
}

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ensureMessagesBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("[messages/storage] listBuckets failed", {
      message: listError.message,
      name: listError.name,
    });
    throw new Error(`Impossible de lister les buckets Supabase: ${listError.message}`);
  }

  const exists = buckets?.some((b) => b.name === MESSAGES_ATTACHMENTS_BUCKET);
  if (exists) return;

  console.info("[messages/storage] Création du bucket", MESSAGES_ATTACHMENTS_BUCKET);
  const { error: createError } = await supabase.storage.createBucket(
    MESSAGES_ATTACHMENTS_BUCKET,
    {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
    },
  );

  if (createError) {
    console.error("[messages/storage] createBucket failed", {
      bucket: MESSAGES_ATTACHMENTS_BUCKET,
      message: createError.message,
      name: createError.name,
    });
    throw new Error(
      `Bucket « ${MESSAGES_ATTACHMENTS_BUCKET} » introuvable et création impossible: ${createError.message}`,
    );
  }
}

function objectPath(messageId: string, fileName: string): string {
  const ext = path.extname(sanitizeFileName(fileName)) || "";
  return `${messageId}/${randomUUID()}${ext}`;
}

function shouldUseSupabase(): boolean {
  if (process.env.MESSAGE_ATTACHMENTS_STORAGE?.trim() === "local") return false;
  return isSupabaseStorageConfigured();
}

export async function uploadMessageAttachmentFile(
  messageId: string,
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ storageKey: string }> {
  const relativePath = objectPath(messageId, fileName);
  const backend = getMessageStorageBackend();

  if (process.env.VERCEL && !shouldUseSupabase()) {
    console.error("[messages/storage] Vercel sans Supabase Storage", getStorageEnvDiagnostics());
    throw new Error(
      "Stockage pièces jointes indisponible sur Vercel sans Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error("Client Supabase indisponible malgré la configuration.");

    await ensureMessagesBucket(supabase);

    console.info("[messages/storage] Upload Supabase", {
      bucket: MESSAGES_ATTACHMENTS_BUCKET,
      path: relativePath,
      bytes: buffer.length,
      mimeType,
    });

    const { error } = await supabase.storage
      .from(MESSAGES_ATTACHMENTS_BUCKET)
      .upload(relativePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("[messages/storage] upload failed", {
        bucket: MESSAGES_ATTACHMENTS_BUCKET,
        path: relativePath,
        message: error.message,
        name: error.name,
      });
      throw new Error(`Échec upload Supabase: ${error.message}`);
    }

    return { storageKey: `${SUPABASE_STORAGE_PREFIX}${relativePath}` };
  }

  console.info("[messages/storage] Upload local", {
    backend,
    path: relativePath,
    bytes: buffer.length,
  });

  const root = path.join(process.cwd(), "storage", "message-attachments");
  await mkdir(path.join(root, messageId), { recursive: true });
  const abs = resolveAttachmentAbsolutePath(relativePath);
  await writeFile(abs, buffer);
  return { storageKey: relativePath };
}

export async function deleteMessageAttachmentFile(storageKey: string): Promise<void> {
  try {
    if (storageKey.startsWith(SUPABASE_STORAGE_PREFIX)) {
      const supabase = getSupabaseAdmin();
      if (!supabase) return;
      const objectKey = storageKey.slice(SUPABASE_STORAGE_PREFIX.length);
      const { error } = await supabase.storage
        .from(MESSAGES_ATTACHMENTS_BUCKET)
        .remove([objectKey]);
      if (error) {
        console.warn("[messages/storage] delete supabase failed", { objectKey, error: error.message });
      }
      return;
    }
    const abs = resolveAttachmentAbsolutePath(storageKey);
    await unlink(abs).catch(() => undefined);
  } catch (e) {
    console.warn("[messages/storage] delete failed", e instanceof Error ? e.message : e);
  }
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
      console.error("[messages/storage] download failed", {
        objectKey,
        message: error?.message,
      });
      throw new Error("Fichier introuvable dans Supabase Storage.");
    }

    return Buffer.from(await data.arrayBuffer());
  }

  const abs = resolveAttachmentAbsolutePath(storageKey);
  return readFile(abs);
}
