import "dotenv/config";
import { prisma } from "../server/db/client";

const SQL = `
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "categoryManual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "hasAttachments" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "aiCategory" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "aiPriority" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "aiGeneratedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "EmailAttachment" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "gmailAttachmentId" TEXT,
    "gmailMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailAttachment_emailId_idx" ON "EmailAttachment"("emailId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EmailAttachment_emailId_fkey'
  ) THEN
    ALTER TABLE "EmailAttachment"
      ADD CONSTRAINT "EmailAttachment_emailId_fkey"
      FOREIGN KEY ("emailId") REFERENCES "Email"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
`;

async function main() {
  console.log("Application de la migration Emails Phase 2…");
  await prisma.$executeRawUnsafe(SQL);
  console.log("Migration Emails Phase 2 terminee.");
}

main()
  .catch((e) => {
    console.error("Migration échouée:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
