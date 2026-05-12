import { prisma } from "@/server/db/client";

export async function writeActivityLog(input: {
  actor: string;
  message: string;
  patientId?: string | null;
}) {
  await prisma.activityLog.create({
    data: {
      actor: input.actor,
      message: input.message,
      patientId: input.patientId ?? undefined,
    },
  });
}
