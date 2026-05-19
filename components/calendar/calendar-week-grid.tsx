"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarEventCard } from "@/components/calendar/calendar-event-card";
import {
  CALENDAR_HOUR_COUNT,
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_START,
  currentTimeLine,
  dayKeyLocal,
  isSameDay,
  layoutOverlappingEvents,
  placeEventsForWeek,
} from "@/lib/calendar-ui";
import type { CalendarEventItem } from "@/types/domain";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOUR_ROWS = `repeat(${CALENDAR_HOUR_COUNT}, minmax(0, 1fr))`;
const TIME_GUTTER = "2.75rem";

function gridColumns(dayCount: number) {
  return `${TIME_GUTTER} repeat(${dayCount}, minmax(0, 1fr))`;
}

interface CalendarWeekGridProps {
  weekDays: Date[];
  events: CalendarEventItem[];
  onEventClick: (ev: CalendarEventItem) => void;
}

export function CalendarWeekGrid({ weekDays, events, onEventClick }: CalendarWeekGridProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = CALENDAR_HOUR_START; h < CALENDAR_HOUR_END; h += 1) list.push(h);
    return list;
  }, []);

  const placed = useMemo(() => {
    const raw = placeEventsForWeek(events, weekDays);
    return layoutOverlappingEvents(raw);
  }, [events, weekDays]);

  const byDayKey = useMemo(() => {
    const map = new Map<string, typeof placed>();
    for (const p of placed) {
      const arr = map.get(p.dayKey) ?? [];
      arr.push(p);
      map.set(p.dayKey, arr);
    }
    return map;
  }, [placed]);

  const today = new Date();
  const nowLine = useMemo(() => currentTimeLine(now), [now]);
  const showNowLine = weekDays.some((d) => isSameDay(d, today));
  const colTemplate = gridColumns(weekDays.length);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      {/* En-têtes jours */}
      <section
        className="grid shrink-0 border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white"
        style={{ gridTemplateColumns: colTemplate }}
      >
        <span className="border-r border-slate-100/80" aria-hidden />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <header
              key={dayKeyLocal(d)}
              className={`border-r border-slate-100/80 px-1 py-1.5 text-center last:border-r-0 ${
                isToday ? "bg-violet-50/50" : ""
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {WEEKDAY_LABELS[i]}
              </p>
              <p
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                  isToday
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25"
                    : "text-slate-800"
                }`}
              >
                {d.getDate()}
              </p>
            </header>
          );
        })}
      </section>

      {/* Grille horaire */}
      <section
        className="relative grid min-h-0 flex-1 overflow-hidden"
        style={{ gridTemplateColumns: colTemplate }}
      >
        {/* Colonne heures */}
        <section
          className="relative z-10 grid min-h-0 border-r border-slate-100 bg-slate-50/40"
          style={{ gridTemplateRows: HOUR_ROWS }}
        >
          {hours.map((h) => (
            <span
              key={h}
              className="relative flex items-start justify-end border-b border-slate-100/90 pr-1.5 pt-0.5 text-[9px] font-medium tabular-nums leading-none text-slate-400"
            >
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </section>

        {/* Colonnes jours */}
        {weekDays.map((d) => {
          const key = dayKeyLocal(d);
          const dayEvents = byDayKey.get(key) ?? [];
          const isToday = isSameDay(d, today);

          return (
            <section
              key={key}
              className={`relative min-h-0 border-r border-slate-100/90 last:border-r-0 ${
                isToday ? "bg-violet-50/20" : "bg-white"
              }`}
            >
              <section
                className="absolute inset-0 grid"
                style={{ gridTemplateRows: HOUR_ROWS }}
                aria-hidden
              >
                {hours.map((h) => (
                  <span key={h} className="border-b border-slate-100/80" />
                ))}
              </section>

              <section className="absolute inset-0">
                {dayEvents.map((p) => {
                  const widthPct = 100 / p.columnCount;
                  const leftPct = p.column * widthPct;
                  const isTask = p.event.id.startsWith("task-");

                  return (
                    <section
                      key={`${p.event.id}-${key}-${p.column}`}
                      className="absolute z-10 px-[2px]"
                      style={{
                        top: `${p.topPct}%`,
                        height: `${p.heightPct}%`,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                    >
                      <CalendarEventCard
                        event={p.event}
                        compact
                        minimal={p.heightPct < 5.5}
                        onClick={() => {
                          if (!isTask) onEventClick(p.event);
                        }}
                      />
                    </section>
                  );
                })}
              </section>
            </section>
          );
        })}

        {showNowLine && nowLine ? (
          <section
            className="pointer-events-none absolute inset-0 z-30 grid"
            style={{ gridTemplateColumns: colTemplate }}
            aria-hidden
          >
            <span />
            {weekDays.map((d) => {
              const isToday = isSameDay(d, today);
              if (!isToday) return <span key={dayKeyLocal(d)} />;
              return (
                <section key={dayKeyLocal(d)} className="relative">
                  <section
                    className="absolute left-0 right-0 flex items-center"
                    style={{ top: `${nowLine.topPct}%`, transform: "translateY(-50%)" }}
                  >
                    <span className="absolute -left-1 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-rose-500 ring-2 ring-white shadow-sm" />
                    <span className="h-[2px] flex-1 bg-rose-500" />
                  </section>
                </section>
              );
            })}
          </section>
        ) : null}

        {showNowLine && nowLine ? (
          <span
            className="pointer-events-none absolute z-40 rounded bg-rose-500 px-1 py-px text-[9px] font-bold tabular-nums leading-none text-white shadow-sm"
            style={{
              top: `${nowLine.topPct}%`,
              left: "0.35rem",
              transform: "translateY(-50%)",
            }}
          >
            {nowLine.label}
          </span>
        ) : null}
      </section>
    </section>
  );
}
