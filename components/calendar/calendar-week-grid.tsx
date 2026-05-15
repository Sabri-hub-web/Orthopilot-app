"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarEventCard } from "@/components/calendar/calendar-event-card";
import {
  CALENDAR_HOUR_COUNT,
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_START,
  dayKeyLocal,
  formatTimeHm,
  isSameDay,
  placeEventsForWeek,
  type PlacedEvent,
} from "@/lib/calendar-ui";
import type { CalendarEventItem } from "@/types/domain";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOUR_ROWS = `repeat(${CALENDAR_HOUR_COUNT}, minmax(0, 1fr))`;

interface CalendarWeekGridProps {
  weekDays: Date[];
  events: CalendarEventItem[];
  onEventClick: (ev: CalendarEventItem) => void;
}

export function CalendarWeekGrid({ weekDays, events, onEventClick }: CalendarWeekGridProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = CALENDAR_HOUR_START; h < CALENDAR_HOUR_END; h += 1) list.push(h);
    return list;
  }, []);

  const placed = useMemo(() => placeEventsForWeek(events, weekDays), [events, weekDays]);
  const byDayKey = useMemo(() => {
    const map = new Map<string, PlacedEvent[]>();
    for (const p of placed) {
      const arr = map.get(p.dayKey) ?? [];
      arr.push(p);
      map.set(p.dayKey, arr);
    }
    return map;
  }, [placed]);

  const today = new Date();

  const nowLine = useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < CALENDAR_HOUR_START || h >= CALENDAR_HOUR_END) return null;
    const totalMin = CALENDAR_HOUR_COUNT * 60;
    const offset = (h - CALENDAR_HOUR_START) * 60 + m;
    return { topPct: (offset / totalMin) * 100, label: formatTimeHm(now) };
  }, [now]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <section className="grid shrink-0 grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] border-b border-slate-100 bg-slate-50/80">
        <span className="border-r border-slate-100" />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <header
              key={dayKeyLocal(d)}
              className="border-r border-slate-100 px-0.5 py-1 text-center last:border-r-0"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {WEEKDAY_LABELS[i]}
              </p>
              <p
                className={`mx-auto mt-px flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                  isToday
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm"
                    : "text-slate-800"
                }`}
              >
                {d.getDate()}
              </p>
            </header>
          );
        })}
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] overflow-hidden">
        <section className="grid min-h-0 border-r border-slate-100 bg-slate-50/40" style={{ gridTemplateRows: HOUR_ROWS }}>
          {hours.map((h) => (
            <span
              key={h}
              className="flex items-start justify-end border-b border-slate-100/90 pr-1 pt-0.5 text-[8px] font-medium tabular-nums leading-none text-slate-400"
            >
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </section>

        {weekDays.map((d) => {
          const key = dayKeyLocal(d);
          const dayEvents = byDayKey.get(key) ?? [];
          const showNow = nowLine && isSameDay(d, today);

          return (
            <section key={key} className="relative min-h-0 border-r border-slate-100 last:border-r-0">
              <section
                className="absolute inset-0 grid"
                style={{ gridTemplateRows: HOUR_ROWS }}
                aria-hidden
              >
                {hours.map((h) => (
                  <span key={h} className="border-b border-slate-100/90" />
                ))}
              </section>
              <section className="absolute inset-0">
                {dayEvents.map((p) => (
                  <section
                    key={`${p.event.id}-${key}`}
                    className="absolute left-0 right-0 z-10 px-px"
                    style={{ top: `${p.topPct}%`, height: `${p.heightPct}%` }}
                  >
                    <CalendarEventCard event={p.event} compact onClick={() => onEventClick(p.event)} />
                  </section>
                ))}
              </section>
              {showNow && nowLine ? (
                <section
                  className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                  style={{ top: `${nowLine.topPct}%` }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 -translate-x-1/2 rounded-full bg-rose-500 ring-2 ring-white" />
                  <span className="h-px flex-1 bg-rose-500" />
                  <span className="shrink-0 rounded bg-rose-500 px-0.5 py-px text-[7px] font-bold leading-none text-white">
                    {nowLine.label}
                  </span>
                </section>
              ) : null}
            </section>
          );
        })}
      </section>
    </section>
  );
}
