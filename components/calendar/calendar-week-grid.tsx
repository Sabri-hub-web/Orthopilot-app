"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarEventCard } from "@/components/calendar/calendar-event-card";
import {
  CALENDAR_DAY_HEADER_PX,
  CALENDAR_GRID_HEIGHT_PX,
  CALENDAR_HOUR_END,
  CALENDAR_HOUR_HEIGHT_PX,
  CALENDAR_HOUR_START,
  CALENDAR_TIME_GUTTER_PX,
  calendarHourLabels,
  currentTimeLine,
  dayKeyLocal,
  isSameDay,
  isWeekday,
  layoutOverlappingEvents,
  lunchBreakLayout,
  placeEventsForWeek,
} from "@/lib/calendar-ui";
import type { CalendarEventItem } from "@/types/domain";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function gridTemplateColumns(dayCount: number) {
  return `${CALENDAR_TIME_GUTTER_PX}px repeat(${dayCount}, minmax(0, 1fr))`;
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

  const hourLabels = useMemo(() => calendarHourLabels(), []);
  const lunch = useMemo(() => lunchBreakLayout(), []);

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
  const colTemplate = gridTemplateColumns(weekDays.length);
  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)]">
      {/* Header jours */}
      <section
        className="grid shrink-0 border-b border-[#eef2f7] bg-gradient-to-b from-slate-50 to-white"
        style={{ gridTemplateColumns: colTemplate, height: CALENDAR_DAY_HEADER_PX, maxHeight: CALENDAR_DAY_HEADER_PX }}
      >
        <span className="border-r border-[#eef2f7]" aria-hidden />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <header
              key={dayKeyLocal(d)}
              className={`flex flex-col items-center justify-center border-r border-[#eef2f7] last:border-r-0 ${
                isToday ? "bg-violet-50/60" : ""
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {WEEKDAY_LABELS[i]}
              </p>
              <p
                className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                  isToday
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30"
                    : "text-slate-800"
                }`}
              >
                {d.getDate()}
              </p>
            </header>
          );
        })}
      </section>

      {/* Corps grille — hauteur fixe pixels */}
      <section className="relative min-h-0 flex-1 overflow-hidden">
        <section
          className="relative grid"
          style={{
            gridTemplateColumns: colTemplate,
            height: CALENDAR_GRID_HEIGHT_PX,
            minHeight: CALENDAR_GRID_HEIGHT_PX,
          }}
        >
          {/* Gutter heures */}
          <section
            className="relative border-r border-[#eef2f7] bg-slate-50/50"
            style={{ height: CALENDAR_GRID_HEIGHT_PX }}
          >
            {hourLabels.slice(0, -1).map((h) => {
              const top = (h - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT_PX;
              return (
                <span
                  key={h}
                  className="absolute right-0 flex w-full items-start justify-end pr-1 text-[9px] font-medium tabular-nums text-slate-400"
                  style={{ top, height: CALENDAR_HOUR_HEIGHT_PX }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              );
            })}
            <span
              className="absolute bottom-0 right-0 flex w-full items-start justify-end pr-1.5 text-[10px] font-medium tabular-nums text-slate-400"
              style={{ height: CALENDAR_HOUR_HEIGHT_PX }}
            >
              {String(CALENDAR_HOUR_END).padStart(2, "0")}:00
            </span>
          </section>

          {/* Colonnes jours */}
          {weekDays.map((d) => {
            const key = dayKeyLocal(d);
            const dayEvents = byDayKey.get(key) ?? [];
            const isToday = isSameDay(d, today);
            const showLunch = isWeekday(d);

            return (
              <section
                key={key}
                className={`relative border-r border-[#eef2f7] last:border-r-0 ${
                  isToday ? "bg-violet-50/15" : "bg-white"
                }`}
                style={{ height: CALENDAR_GRID_HEIGHT_PX }}
              >
                {/* Lignes horaires */}
                {hourLabels.slice(0, -1).map((h) => (
                  <span
                    key={h}
                    className="pointer-events-none absolute left-0 right-0 border-b border-[#eef2f7]"
                    style={{
                      top: (h - CALENDAR_HOUR_START) * CALENDAR_HOUR_HEIGHT_PX,
                      height: CALENDAR_HOUR_HEIGHT_PX,
                    }}
                    aria-hidden
                  />
                ))}

                {/* Pause déjeuner (lun–ven) */}
                {showLunch ? (
                  <div
                    className="pointer-events-none absolute left-1.5 right-1.5 z-[1] overflow-hidden rounded-[10px] border border-amber-100/80 bg-amber-50/70 px-1.5 py-0.5 opacity-75"
                    style={{ top: lunch.topPx, height: lunch.heightPx }}
                  >
                    <p className="text-[9px] font-semibold leading-tight text-amber-900/80 opacity-80">
                      Pause déjeuner
                    </p>
                    <p className="text-[8px] leading-tight text-amber-800/60">13:00</p>
                  </div>
                ) : null}

                {/* Événements */}
                {dayEvents.map((p) => {
                  const widthPct = 100 / p.columnCount;
                  const leftPct = p.column * widthPct;
                  const isTask = p.event.id.startsWith("task-");

                  return (
                    <div
                      key={`${p.event.id}-${key}-${p.column}`}
                      className="absolute z-10"
                      style={{
                        top: p.topPx,
                        height: p.heightPx,
                        left: `calc(${leftPct}% + 6px)`,
                        width: `calc(${widthPct}% - 12px)`,
                      }}
                    >
                      <CalendarEventCard
                        event={p.event}
                        compact
                        minimal={p.heightPx < 48}
                        onClick={() => {
                          if (!isTask) onEventClick(p.event);
                        }}
                      />
                    </div>
                  );
                })}
              </section>
            );
          })}

          {/* Ligne heure actuelle */}
          {showNowLine && nowLine ? (
            <section
              className="pointer-events-none absolute inset-0 z-30 grid"
              style={{ gridTemplateColumns: colTemplate, height: CALENDAR_GRID_HEIGHT_PX }}
            >
              <span className="relative">
                <span
                  className="absolute rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none text-white shadow-sm"
                  style={{ top: nowLine.topPx, transform: "translateY(-50%)", right: 4 }}
                >
                  {nowLine.label}
                </span>
              </span>
              {weekDays.map((d) => {
                if (!isSameDay(d, today)) return <span key={dayKeyLocal(d)} />;
                return (
                  <section key={dayKeyLocal(d)} className="relative">
                    <div
                      className="absolute left-0 right-0 h-[1px] bg-rose-400/80"
                      style={{ top: nowLine.topPx }}
                    >
                      <span className="absolute -left-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                    </div>
                  </section>
                );
              })}
            </section>
          ) : null}
        </section>
      </section>
    </section>
  );
}
