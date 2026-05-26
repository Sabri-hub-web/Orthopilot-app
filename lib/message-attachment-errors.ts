import { Prisma } from "@prisma/client";

export type AttachmentFailurePhase = "storage_upload" | "db_insert" | "validation" | "unknown";

export interface AttachmentFailureInfo {
  phase: AttachmentFailurePhase;
  message: string;
  code?: string;
  storageBackend: "supabase" | "local" | "unconfigured";
  hint: string;
}

export function classifyAttachmentError(
  err: unknown,
  storageBackend: "supabase" | "local" | "unconfigured",
  phase: AttachmentFailurePhase = "unknown",
): AttachmentFailureInfo {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021") {
      return {
        phase: "db_insert",
        message: err.message,
        code: err.code,
        storageBackend,
        hint:
          "La table InternalMessageAttachment est absente. Exécutez: npx tsx scripts/apply-message-attachments-migration.ts",
      };
    }
    if (err.code === "P2003") {
      return {
        phase: "db_insert",
        message: err.message,
        code: err.code,
        storageBackend,
        hint: "Clé étrangère messageId invalide — message parent introuvable.",
      };
    }
    return {
      phase: "db_insert",
      message: err.message,
      code: err.code,
      storageBackend,
      hint: "Erreur Prisma lors de l'enregistrement de la pièce jointe.",
    };
  }

  const msg = err instanceof Error ? err.message : String(err);

  if (phase === "storage_upload" || msg.includes("stockage") || msg.includes("Supabase")) {
    return {
      phase: "storage_upload",
      message: msg,
      storageBackend,
      hint:
        storageBackend === "supabase"
          ? "Vérifiez NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et le bucket SUPABASE_STORAGE_BUCKET."
          : process.env.VERCEL
            ? "Sur Vercel le stockage local est impossible — configurez Supabase Storage."
            : "Vérifiez les droits d'écriture du dossier storage/message-attachments.",
    };
  }

  return {
    phase,
    message: msg,
    storageBackend,
    hint: "Consultez les logs serveur [messages/attachments].",
  };
}

export function logAttachmentFailure(
  context: Record<string, unknown>,
  info: AttachmentFailureInfo,
): void {
  console.error("[messages/attachments] Échec pièce jointe", {
    ...context,
    phase: info.phase,
    storageBackend: info.storageBackend,
    code: info.code,
    message: info.message,
    hint: info.hint,
  });
}
