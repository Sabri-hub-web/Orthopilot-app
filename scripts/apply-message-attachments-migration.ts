import "dotenv/config";
import { prisma } from "../server/db/client";

const SQL = `
CREATE TABLE IF NOT EXISTS "InternalMessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InternalMessageAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InternalMessageAttachment_messageId_idx"
  ON "InternalMessageAttachment"("messageId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'InternalMessageAttachment_messageId_fkey'
  ) THEN
    ALTER TABLE "InternalMessageAttachment"
      ADD CONSTRAINT "InternalMessageAttachment_messageId_fkey"
      FOREIGN KEY ("messageId") REFERENCES "InternalMessage"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
`;

async function main() {
  console.log("Application de la migration InternalMessageAttachment…");
  await prisma.$executeRawUnsafe(SQL);
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'InternalMessageAttachment'
    ) AS exists
  `;
  console.log("Table InternalMessageAttachment présente:", rows[0]?.exists === true);
}

main()
  .catch((e) => {
    console.error("Migration échouée:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
