import type { CalendarEventTypeApi } from "@/types/domain";

export const CALENDAR_EVENT_TYPES = [
  "CONSULTATION",
  "RDV_PATIENT",
  "REUNION",
  "TACHE",
  "PAUSE",
  "AUTRE",
] as const satisfies readonly CalendarEventTypeApi[];

export const calendarEventTypeLabelMap: Record<CalendarEventTypeApi, string> = {
  CONSULTATION: "Consultation",
  RDV_PATIENT: "Rendez-vous patient",
  REUNION: "Reunion",
  TACHE: "Tache",
  PAUSE: "Pause",
  AUTRE: "Autre",
};

export function calendarEventTypeLabel(type: CalendarEventTypeApi): string {
  return calendarEventTypeLabelMap[type];
}
