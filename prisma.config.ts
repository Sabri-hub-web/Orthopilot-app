import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Supabase : `DATABASE_URL` = pooler transaction (app / PrismaClient).
 * `DIRECT_URL` = session pooler ou connexion directe (migrate, db push, introspection).
 * Voir https://supabase.com/docs/guides/database/connecting-to-postgres
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed-b1.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
