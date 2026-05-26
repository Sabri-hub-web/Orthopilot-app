import "dotenv/config";
import { prisma } from "../server/db/client";

const SQL = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmailImportSource') THEN
    CREATE TYPE "EmailImportSource" AS ENUM ('MANUAL', 'GMAIL');
  END IF;
END $$;

ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "gmailMessageId" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "gmailThreadId" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "snippet" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "bodyText" TEXT;
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "importedFrom" "EmailImportSource" NOT NULL DEFAULT 'MANUAL';

CREATE UNIQUE INDEX IF NOT EXISTS "Email_gmailMessageId_key" ON "Email"("gmailMessageId");

CREATE TABLE IF NOT EXISTS "GmailAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailEmail" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GmailAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GmailAccount_userId_key" ON "GmailAccount"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'GmailAccount_userId_fkey'
  ) THEN
    ALTER TABLE "GmailAccount"
      ADD CONSTRAINT "GmailAccount_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
`;

async function main() {
  console.log("Application de la migration Gmail…");
  await prisma.$executeRawUnsafe(SQL);
  console.log("Migration Gmail terminee.");
}

main()
  .catch((e) => {
    console.error("Migration échouée:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
