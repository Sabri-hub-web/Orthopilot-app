import type { CalendarEventType } from "@prisma/client";

export const CALENDAR_EVENT_TYPES = [
  "CONSULTATION",
  "RDV_PATIENT",
  "REUNION",
  "TACHE",
  "PAUSE",
  "AUTRE",
] as const satisfies readonly CalendarEventType[];

export const calendarEventTypeLabelMap: Record<CalendarEventType, string> = {
  CONSULTATION: "Consultation",
  RDV_PATIENT: "Rendez-vous patient",
  REUNION: "Reunion",
  TACHE: "Tache",
  PAUSE: "Pause",
  AUTRE: "Autre",
};

export function calendarEventTypeLabel(type: CalendarEventType): string {
  return calendarEventTypeLabelMap[type];
}
