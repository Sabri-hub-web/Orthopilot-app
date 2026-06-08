import pkg from "@/package.json";
import { prisma } from "@/server/db/client";
import { getGmailStatusForUser } from "@/services/gmail-service";

export async function getSettingsOverview(userId?: string, userEmail?: string) {
  const [patients, reglements, emails, tasks, logs, documents] = await Promise.all([
    prisma.patient.count(),
    prisma.reglement.count(),
    prisma.email.count(),
    prisma.task.count(),
    prisma.activityLog.count(),
    prisma.patientDocument.count(),
  ]);

  const gmailImported = await prisma.email.count({ where: { importedFrom: "GMAIL" } });

  let gmail = undefined;
  let activeSessions = 0;
  let lastLoginAt: string | null = null;

  if (userId) {
    gmail = await getGmailStatusForUser(userId);
    activeSessions = await prisma.session.count({
      where: { userId, expiresAt: { gt: new Date() } },
    });
  }

  if (userEmail) {
    const lastLogin = await prisma.activityLog.findFirst({
      where: { message: { contains: userEmail } },
      orderBy: { createdAt: "desc" },
    });
    if (lastLogin && lastLogin.message.toLowerCase().startsWith("connexion")) {
      lastLoginAt = lastLogin.createdAt.toISOString();
    }
  }

  const estimatedSizeMb = Math.max(
    1,
    Math.round((patients * 0.05 + documents * 0.5 + emails * 0.02 + logs * 0.01) * 10) / 10,
  );

  return {
    appName: "ORTHOPILOT",
    appVersion: pkg.version,
    environment: process.env.NODE_ENV ?? "development",
    databaseProvider: "postgresql",
    counts: {
      patients,
      reglements,
      emails,
      tasks,
      logs,
      documents,
    },
    modules: [
      { name: "Dashboard", status: "Actif" as const, detail: "Vue d'ensemble du cabinet." },
      { name: "Patients", status: "Actif" as const, detail: "Fiches patients et commentaires." },
      { name: "Emails", status: "Actif" as const, detail: "Gmail et emails manuels." },
      { name: "Règlements", status: "Actif" as const, detail: "Suivi des paiements et relances." },
      { name: "Tâches", status: "Actif" as const, detail: "Kanban équipe et assignations." },
      { name: "Logs & activité", status: "Actif" as const, detail: "Journal métier du cabinet." },
    ],
    billing: {
      plan: "OrthoPilot Pro",
      documentsStored: documents,
      emailsSynced: gmailImported,
      storageUsedMb: estimatedSizeMb,
    },
    security: {
      activeSessions,
      lastLoginAt,
    },
    backups: {
      lastBackupAt: null,
      totalBackups: 0,
      estimatedSizeMb,
    },
    gmail,
  };
}
