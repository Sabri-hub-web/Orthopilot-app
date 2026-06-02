import "dotenv/config";
import { prisma } from "../server/db/client";

const SQL = `
CREATE TABLE IF NOT EXISTS "PatientComment" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "authorId" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PatientDocument" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "uploadedById" TEXT,
  "name" TEXT NOT NULL,
  "mimeType" TEXT,
  "sizeBytes" INTEGER NOT NULL DEFAULT 0,
  "storagePath" TEXT,
  "downloadUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PatientDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PatientComment_patientId_createdAt_idx" ON "PatientComment"("patientId", "createdAt");
CREATE INDEX IF NOT EXISTS "PatientDocument_patientId_createdAt_idx" ON "PatientDocument"("patientId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PatientComment_patientId_fkey') THEN
    ALTER TABLE "PatientComment"
      ADD CONSTRAINT "PatientComment_patientId_fkey"
      FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PatientComment_authorId_fkey') THEN
    ALTER TABLE "PatientComment"
      ADD CONSTRAINT "PatientComment_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PatientDocument_patientId_fkey') THEN
    ALTER TABLE "PatientDocument"
      ADD CONSTRAINT "PatientDocument_patientId_fkey"
      FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PatientDocument_uploadedById_fkey') THEN
    ALTER TABLE "PatientDocument"
      ADD CONSTRAINT "PatientDocument_uploadedById_fkey"
      FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
`;

async function main() {
  console.log("Application migration Patients Phase 2…");
  await prisma.$executeRawUnsafe(SQL);
  console.log("Migration Patients Phase 2 terminée.");
}

main()
  .catch((e) => {
    console.error("Migration échouée:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
