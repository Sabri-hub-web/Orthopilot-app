"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarEventCard } from "@/components/calendar/calendar-event-card";
import {
  CALENDAR_HOUR_COUNT,
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_START,
  CALENDAR_ROW_PX,
  dayKeyLocal,
  formatTimeHm,
  isSameDay,
  placeEventsForWeek,
  type PlacedEvent,
} from "@/lib/calendar-ui";
import type { CalendarEventItem } from "@/types/domain";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

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

  const gridHeight = CALENDAR_ROW_PX * CALENDAR_HOUR_COUNT;
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
    <section className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <section className="min-w-[720px]">
        <section className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] border-b border-slate-100 bg-slate-50/80">
          <span className="border-r border-slate-100" />
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, today);
            return (
              <header
                key={dayKeyLocal(d)}
                className="border-r border-slate-100 px-1 py-2 text-center last:border-r-0"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {WEEKDAY_LABELS[i]}
                </p>
                <p
                  className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
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

        <section className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]">
          <section className="relative border-r border-slate-100 bg-slate-50/40">
            {hours.map((h) => (
              <p
                key={h}
                className="border-b border-slate-100 pr-1.5 text-right text-[9px] font-medium tabular-nums text-slate-400"
                style={{ height: CALENDAR_ROW_PX }}
              >
                {String(h).padStart(2, "0")}:00
              </p>
            ))}
          </section>

          {weekDays.map((d) => {
            const key = dayKeyLocal(d);
            const dayEvents = byDayKey.get(key) ?? [];
            const showNow = nowLine && isSameDay(d, today);

            return (
              <section
                key={key}
                className="relative border-r border-slate-100 last:border-r-0"
                style={{ height: gridHeight }}
              >
                {hours.map((h) => (
                  <span
                    key={h}
                    className="block border-b border-slate-100/90"
                    style={{ height: CALENDAR_ROW_PX }}
                  />
                ))}
                {dayEvents.map((p) => (
                  <section
                    key={`${p.event.id}-${key}`}
                    className="absolute left-0 right-0 z-10 px-0.5"
                    style={{ top: `${p.topPct}%`, height: `${p.heightPct}%` }}
                  >
                    <CalendarEventCard
                      event={p.event}
                      compact
                      onClick={() => onEventClick(p.event)}
                    />
                  </section>
                ))}
                {showNow && nowLine ? (
                  <section
                    className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                    style={{ top: `${nowLine.topPct}%` }}
                  >
                    <span className="h-2 w-2 shrink-0 -translate-x-1/2 rounded-full bg-rose-500 ring-2 ring-white" />
                    <span className="h-px flex-1 bg-rose-500" />
                    <span className="shrink-0 rounded bg-rose-500 px-1 py-px text-[8px] font-bold text-white">
                      {nowLine.label}
                    </span>
                  </section>
                ) : null}
              </section>
            );
          })}
        </section>
      </section>
    </section>
  );
}
