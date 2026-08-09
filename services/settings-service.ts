import pkg from "@/package.json";
import { prisma } from "@/server/db/client";
import { getGmailStatusForUser } from "@/services/gmail-service";

export async function getSettingsOverview(userId?: string, _userEmail?: string) {
  const [patients, reglements, tasks] = await Promise.all([
    prisma.patient.count(),
    prisma.reglement.count(),
    prisma.task.count(),
  ]);

  let gmail = undefined;
  let activeSessions = 0;

  if (userId) {
    gmail = await getGmailStatusForUser(userId);
    activeSessions = await prisma.session.count({
      where: { userId, expiresAt: { gt: new Date() } },
    });
  }

  const estimatedSizeMb = Math.max(1, Math.round(patients * 0.05 * 10) / 10);

  return {
    appName: "ORTHOPILOT",
    appVersion: pkg.version,
    environment: process.env.NODE_ENV ?? "development",
    databaseProvider: "postgresql",
    counts: {
      patients,
      reglements,
      emails: 0,
      tasks,
      logs: 0,
      documents: 0,
    },
    modules: [
      { name: "Dashboard", status: "Actif" as const, detail: "Vue d'ensemble du cabinet." },
      { name: "Patients", status: "Actif" as const, detail: "Fiches patients et commentaires." },
      { name: "Règlements", status: "Actif" as const, detail: "Suivi des paiements et relances." },
      { name: "Tâches", status: "Actif" as const, detail: "Kanban équipe et assignations." },
      { name: "Messages", status: "Actif" as const, detail: "Messagerie interne." },
    ],
    billing: {
      plan: "OrthoPilot Pro",
      documentsStored: 0,
      emailsSynced: 0,
      storageUsedMb: estimatedSizeMb,
    },
    security: {
      activeSessions,
      lastLoginAt: null as string | null,
    },
    backups: {
      lastBackupAt: null,
      totalBackups: 0,
      estimatedSizeMb,
    },
    gmail,
  };
}
