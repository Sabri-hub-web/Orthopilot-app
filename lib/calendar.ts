import type { CalendarEventType } from "@prisma/client";

export const CALENDAR_EVENT_TYPES = [
  "CONSULTATION",
  "REUNION",
  "ABSENCE",
  "AUTRE",
] as const satisfies readonly CalendarEventType[];

export const calendarEventTypeLabelMap: Record<CalendarEventType, string> = {
  CONSULTATION: "Consultation",
  REUNION: "Reunion",
  ABSENCE: "Absence",
  AUTRE: "Autre",
};

export function calendarEventTypeLabel(type: CalendarEventType): string {
  return calendarEventTypeLabelMap[type];
}
