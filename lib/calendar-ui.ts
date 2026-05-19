import type { CalendarEventItem, CalendarEventTypeApi, InternalTask } from "@/types/domain";

/** Horaires cabinet : 10:00 → 20:00 */
export const CALENDAR_HOUR_START = 10;
export const CALENDAR_HOUR_END = 20;
export const CALENDAR_HOUR_COUNT = CALENDAR_HOUR_END - CALENDAR_HOUR_START;
export const CALENDAR_HOUR_HEIGHT_PX = 52;
export const CALENDAR_GRID_HEIGHT_PX = CALENDAR_HOUR_COUNT * CALENDAR_HOUR_HEIGHT_PX;
export const CALENDAR_TIME_GUTTER_PX = 54;
export const CALENDAR_DAY_HEADER_PX = 70;
export const CALENDAR_MIN_EVENT_HEIGHT_PX = 40;

export const LUNCH_START_HOUR = 13;
export const LUNCH_END_HOUR = 14;

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

export const CALENDAR_VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: "Jour" },
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "agenda", label: "Agenda" },
];

export const EVENT_TYPE_STYLES: Record<
  CalendarEventTypeApi,
  {
    card: string;
    bg: string;
    border: string;
    accent: string;
    text: string;
    muted: string;
    dot: string;
    legend: string;
  }
> = {
  CONSULTATION: {
    card: "bg-blue-50 border-blue-200 text-blue-900",
    bg: "bg-blue-50",
    border: "border-blue-200",
    accent: "border-l-blue-500",
    text: "text-blue-900",
    muted: "text-blue-800/80",
    dot: "bg-blue-500",
    legend: "Consultation",
  },
  RDV_PATIENT: {
    card: "bg-emerald-50 border-emerald-200 text-emerald-900",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    accent: "border-l-emerald-500",
    text: "text-emerald-900",
    muted: "text-emerald-800/80",
    dot: "bg-emerald-500",
    legend: "RDV patient",
  },
  REUNION: {
    card: "bg-violet-50 border-violet-200 text-violet-900",
    bg: "bg-violet-50",
    border: "border-violet-200",
    accent: "border-l-violet-500",
    text: "text-violet-900",
    muted: "text-violet-800/80",
    dot: "bg-violet-500",
    legend: "Réunion",
  },
  TACHE: {
    card: "bg-rose-50 border-rose-200 text-rose-900",
    bg: "bg-rose-50",
    border: "border-rose-200",
    accent: "border-l-rose-500",
    text: "text-rose-900",
    muted: "text-rose-800/80",
    dot: "bg-rose-500",
    legend: "Tâche",
  },
  PAUSE: {
    card: "bg-orange-50 border-orange-200 text-orange-900",
    bg: "bg-orange-50",
    border: "border-orange-200",
    accent: "border-l-orange-500",
    text: "text-orange-900",
    muted: "text-orange-800/80",
    dot: "bg-orange-500",
    legend: "Pause",
  },
  AUTRE: {
    card: "bg-slate-50 border-slate-200 text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
    accent: "border-l-slate-400",
    text: "text-slate-700",
    muted: "text-slate-600/85",
    dot: "bg-slate-400",
    legend: "Autre",
  },
};

export function formatTimeHm(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatWeekRangeLabel(from: Date, to: Date): string {
  const monthFmt = new Intl.DateTimeFormat("fr-FR", { month: "long" });
  const year = to.getFullYear();
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `${from.getDate()} – ${to.getDate()} ${monthFmt.format(to).replace(/^\w/, (c) => c.toUpperCase())} ${year}`;
  }
  const fromMonth = monthFmt.format(from).replace(/^\w/, (c) => c.toUpperCase());
  const toMonth = monthFmt.format(to).replace(/^\w/, (c) => c.toUpperCase());
  return `${from.getDate()} ${fromMonth} – ${to.getDate()} ${toMonth} ${year}`;
}

export function dayKeyLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKeyLocal(a) === dayKeyLocal(b);
}

export function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfWeekSunday(fromMonday: Date): Date {
  const x = new Date(fromMonday);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function minutesFromCalendarStart(hours: number, minutes: number): number {
  return hours * 60 + minutes - CALENDAR_HOUR_START * 60;
}

export function minutesToTopPx(totalMinutesFromStart: number): number {
  return (totalMinutesFromStart / 60) * CALENDAR_HOUR_HEIGHT_PX;
}

export function durationToHeightPx(durationMinutes: number): number {
  return Math.max(CALENDAR_MIN_EVENT_HEIGHT_PX, (durationMinutes / 60) * CALENDAR_HOUR_HEIGHT_PX);
}

export function lunchBreakLayout(): { topPx: number; heightPx: number } {
  const startMin = minutesFromCalendarStart(LUNCH_START_HOUR, 0);
  const endMin = minutesFromCalendarStart(LUNCH_END_HOUR, 0);
  return {
    topPx: minutesToTopPx(startMin),
    heightPx: minutesToTopPx(endMin - startMin),
  };
}

export interface PlacedEvent {
  event: CalendarEventItem;
  dayKey: string;
  topPx: number;
  heightPx: number;
  columnDate: Date;
}

export interface PlacedEventLayout extends PlacedEvent {
  column: number;
  columnCount: number;
}

export function placeEventsForWeek(
  events: CalendarEventItem[],
  weekDays: Date[],
): PlacedEvent[] {
  const keys = new Set(weekDays.map(dayKeyLocal));
  const placed: PlacedEvent[] = [];

  for (const ev of events) {
    const start = new Date(ev.startAt);
    const end = new Date(ev.endAt);
    for (const day of weekDays) {
      const key = dayKeyLocal(day);
      if (!keys.has(key)) continue;

      const dayStart = new Date(day);
      dayStart.setHours(CALENDAR_HOUR_START, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(CALENDAR_HOUR_END, 0, 0, 0);

      const segStart = start > dayStart ? start : dayStart;
      const segEnd = end < dayEnd ? end : dayEnd;
      if (segEnd <= segStart) continue;

      const startMin = minutesFromCalendarStart(segStart.getHours(), segStart.getMinutes());
      const endMin = minutesFromCalendarStart(segEnd.getHours(), segEnd.getMinutes());
      const topPx = Math.max(0, minutesToTopPx(startMin));
      const heightPx = Math.min(
        CALENDAR_GRID_HEIGHT_PX - topPx,
        durationToHeightPx(endMin - startMin),
      );
      if (heightPx <= 0) continue;

      placed.push({
        event: ev,
        dayKey: key,
        topPx,
        heightPx,
        columnDate: day,
      });
    }
  }
  return placed;
}

function rangesOverlapPx(aTop: number, aH: number, bTop: number, bH: number): boolean {
  return aTop < bTop + bH && bTop < aTop + aH;
}

export function layoutOverlappingEvents(placed: PlacedEvent[]): PlacedEventLayout[] {
  const byDay = new Map<string, PlacedEvent[]>();
  for (const p of placed) {
    const list = byDay.get(p.dayKey) ?? [];
    list.push(p);
    byDay.set(p.dayKey, list);
  }

  const result: PlacedEventLayout[] = [];

  for (const [, dayEvents] of byDay) {
    const sorted = [...dayEvents].sort((a, b) => a.topPx - b.topPx || b.heightPx - a.heightPx);
    const layouts: PlacedEventLayout[] = [];

    for (const item of sorted) {
      const overlapping = layouts.filter((o) =>
        rangesOverlapPx(item.topPx, item.heightPx, o.topPx, o.heightPx),
      );
      const used = new Set(overlapping.map((o) => o.column));
      let column = 0;
      while (used.has(column)) column += 1;
      const columnCount = Math.max(column + 1, ...overlapping.map((o) => o.columnCount), 1);
      for (const o of overlapping) {
        o.columnCount = Math.max(o.columnCount, columnCount);
      }
      layouts.push({ ...item, column, columnCount });
    }

    const maxCols = Math.max(1, ...layouts.map((l) => l.columnCount));
    for (const l of layouts) {
      l.columnCount = maxCols;
      result.push(l);
    }
  }

  return result;
}

export function taskToCalendarEvent(task: InternalTask): CalendarEventItem {
  const due = new Date(task.dueDate);
  const start = new Date(due);
  if (Number.isNaN(start.getTime())) {
    start.setHours(CALENDAR_HOUR_START, 0, 0, 0);
  } else if (start.getHours() === 0 && start.getMinutes() === 0) {
    start.setHours(CALENDAR_HOUR_START, 0, 0, 0);
  }
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  return {
    id: `task-${task.id}`,
    title: task.title,
    description: task.comment,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    type: "TACHE",
    typeLabel: "Tâche",
    patientId: task.patientId,
    patientName: task.patientName,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee || null,
    createdById: null,
    createdByName: null,
  };
}

export function eventPractitionerLabel(event: CalendarEventItem): string {
  return event.assigneeName ?? event.patientName ?? "Cabinet";
}

export function eventRoomLabel(_event?: CalendarEventItem): string {
  return "Salle 1";
}

export function relativeDayLabel(date: Date, now = new Date()): string {
  const today = dayKeyLocal(now);
  const tomorrow = dayKeyLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const key = dayKeyLocal(date);
  if (key === today) return "Aujourd'hui";
  if (key === tomorrow) return "Demain";
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export function filterEvents(
  events: CalendarEventItem[],
  opts: {
    assigneeId: string;
    types: Set<CalendarEventTypeApi>;
  },
): CalendarEventItem[] {
  return events.filter((ev) => {
    if (opts.assigneeId && ev.assigneeId !== opts.assigneeId) return false;
    if (opts.types.size > 0 && !opts.types.has(ev.type)) return false;
    return true;
  });
}

export function currentTimeLine(now = new Date()): { topPx: number; label: string } | null {
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < CALENDAR_HOUR_START || h >= CALENDAR_HOUR_END) return null;
  const offsetMin = minutesFromCalendarStart(h, m);
  return { topPx: minutesToTopPx(offsetMin), label: formatTimeHm(now) };
}

/** Labels d'heures affichés : 10:00 … 20:00 */
export function calendarHourLabels(): number[] {
  const list: number[] = [];
  for (let h = CALENDAR_HOUR_START; h <= CALENDAR_HOUR_END; h += 1) list.push(h);
  return list;
}
