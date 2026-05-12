import type { PresenceStatus } from "@prisma/client";

export const PRESENCE_STATUS_VALUES = [
  "DISPONIBLE",
  "EN_CONSULTATION",
  "EN_REUNION",
  "ABSENT",
] as const satisfies readonly PresenceStatus[];

export const presenceStatusLabelMap: Record<PresenceStatus, string> = {
  DISPONIBLE: "Disponible",
  EN_CONSULTATION: "En consultation",
  EN_REUNION: "En reunion",
  ABSENT: "Absent",
};

export function presenceStatusLabel(status: PresenceStatus): string {
  return presenceStatusLabelMap[status];
}
