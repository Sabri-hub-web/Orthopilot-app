import { prisma } from "../server/db/client";

async function main() {
  try {
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'InternalMessageAttachment'
      ) AS exists
    `;
    console.log("InternalMessageAttachment table exists:", rows[0]?.exists);

    await prisma.internalMessageAttachment.findFirst({ take: 1 });
    console.log("Prisma model query: OK");
  } catch (e) {
    console.error("Prisma model query FAILED:", e instanceof Error ? e.message : e);
  }
}

main()
  .finally(() => prisma.$disconnect());
