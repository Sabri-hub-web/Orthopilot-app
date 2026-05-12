import pkg from "@/package.json";
import { prisma } from "@/server/db/client";

export async function getSettingsOverview() {
  const [patients, reglements, emails, tasks, logs] = await Promise.all([
    prisma.patient.count(),
    prisma.reglement.count(),
    prisma.email.count(),
    prisma.task.count(),
    prisma.activityLog.count(),
  ]);

  return {
    appName: "ORTHOPILOT",
    appVersion: pkg.version,
    environment: process.env.NODE_ENV ?? "development",
    databaseProvider: "sqlite",
    counts: {
      patients,
      reglements,
      emails,
      tasks,
      logs,
    },
    modules: [
      {
        name: "Dashboard",
        status: "Actif",
        detail: "Resume global branche sur API et base Prisma.",
      },
      {
        name: "Reglements",
        status: "Actif",
        detail: "Liste paginee disponible, etape CRUD a venir en phase B.",
      },
      {
        name: "Emails",
        status: "Actif",
        detail: "Tri urgent et pagination disponibles.",
      },
      {
        name: "Taches",
        status: "Actif",
        detail: "Liste paginee et statuts operationnels.",
      },
      {
        name: "Patients",
        status: "Actif",
        detail: "Centralisation de base disponible.",
      },
      {
        name: "Logs & activite",
        status: "Actif",
        detail: "Journal pagine branche sur la base.",
      },
      {
        name: "Parametres avances",
        status: "En preparation",
        detail: "Configuration metier editable prevue en phase B.",
      },
    ] as const,
  };
}
