import type { CalendarEventItem, CalendarEventTypeApi, InternalTask } from "@/types/domain";

export const CALENDAR_HOUR_START = 7;
export const CALENDAR_HOUR_END = 19;
export const CALENDAR_HOUR_COUNT = CALENDAR_HOUR_END - CALENDAR_HOUR_START;

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
    bg: "bg-sky-50/95",
    border: "border-sky-200/80",
    accent: "border-l-sky-500",
    text: "text-sky-950",
    muted: "text-sky-700/85",
    dot: "bg-sky-500",
    legend: "Consultation",
  },
  RDV_PATIENT: {
    bg: "bg-emerald-50/95",
    border: "border-emerald-200/80",
    accent: "border-l-emerald-500",
    text: "text-emerald-950",
    muted: "text-emerald-700/85",
    dot: "bg-emerald-500",
    legend: "RDV patient",
  },
  REUNION: {
    bg: "bg-violet-50/95",
    border: "border-violet-200/80",
    accent: "border-l-violet-500",
    text: "text-violet-950",
    muted: "text-violet-700/85",
    dot: "bg-violet-500",
    legend: "Réunion",
  },
  TACHE: {
    bg: "bg-rose-50/95",
    border: "border-rose-200/80",
    accent: "border-l-rose-500",
    text: "text-rose-950",
    muted: "text-rose-700/85",
    dot: "bg-rose-500",
    legend: "Tâche",
  },
  PAUSE: {
    bg: "bg-orange-50/95",
    border: "border-orange-200/80",
    accent: "border-l-orange-500",
    text: "text-orange-950",
    muted: "text-orange-700/85",
    dot: "bg-orange-500",
    legend: "Pause",
  },
  AUTRE: {
    bg: "bg-slate-50/95",
    border: "border-slate-200/80",
    accent: "border-l-slate-400",
    text: "text-slate-900",
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

export interface PlacedEvent {
  event: CalendarEventItem;
  dayKey: string;
  topPct: number;
  heightPct: number;
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
  const totalMin = CALENDAR_HOUR_COUNT * 60;

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

      const startMin = segStart.getHours() * 60 + segStart.getMinutes() - CALENDAR_HOUR_START * 60;
      const endMin = segEnd.getHours() * 60 + segEnd.getMinutes() - CALENDAR_HOUR_START * 60;
      const topPct = Math.max(0, (startMin / totalMin) * 100);
      const heightPct = Math.min(100 - topPct, ((endMin - startMin) / totalMin) * 100);
      if (heightPct <= 0) continue;

      placed.push({
        event: ev,
        dayKey: key,
        topPct,
        heightPct: Math.max(heightPct, 3.2),
        columnDate: day,
      });
    }
  }
  return placed;
}

function rangesOverlap(aTop: number, aH: number, bTop: number, bH: number): boolean {
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
    const sorted = [...dayEvents].sort((a, b) => a.topPct - b.topPct || b.heightPct - a.heightPct);
    const layouts: PlacedEventLayout[] = [];

    for (const item of sorted) {
      const overlapping = layouts.filter((o) =>
        rangesOverlap(item.topPct, item.heightPct, o.topPct, o.heightPct),
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
    start.setHours(9, 0, 0, 0);
  } else if (start.getHours() === 0 && start.getMinutes() === 0) {
    start.setHours(9, 0, 0, 0);
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

export function eventSubtitle(event: CalendarEventItem): string {
  const who = event.patientName ?? event.assigneeName;
  return who ?? "Cabinet";
}

export function eventRoomLabel(): string {
  return "—";
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

export function currentTimeLine(now = new Date()): { topPct: number; label: string } | null {
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < CALENDAR_HOUR_START || h >= CALENDAR_HOUR_END) return null;
  const totalMin = CALENDAR_HOUR_COUNT * 60;
  const offset = (h - CALENDAR_HOUR_START) * 60 + m;
  return { topPct: (offset / totalMin) * 100, label: formatTimeHm(now) };
}
