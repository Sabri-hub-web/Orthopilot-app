import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL n'est pas défini.");
  }

  const pool =
    globalForPrisma.pgPool ?? new Pool({ connectionString });
  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Accès paresseux : évite d’exiger DATABASE_URL au chargement du module (phase
 * « Collecting page data » de `next build` sur Vercel sans .env).
 * La première requête Prisma échoue toujours si DATABASE_URL manque.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value: unknown = Reflect.get(client, prop, client);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
