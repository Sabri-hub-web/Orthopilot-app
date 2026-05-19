"use client";

import { useMemo } from "react";
import { EVENT_TYPE_STYLES, formatTimeHm, relativeDayLabel } from "@/lib/calendar-ui";
import type { CalendarEventItem } from "@/types/domain";

interface CalendarUpcomingEventsProps {
  events: CalendarEventItem[];
  onEventClick: (ev: CalendarEventItem) => void;
}

export function CalendarUpcomingEvents({ events, onEventClick }: CalendarUpcomingEventsProps) {
  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.endAt).getTime() >= now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 4);
  }, [events]);

  return (
    <article className="shrink-0 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Prochains événements
      </h3>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-[11px] text-slate-500">Aucun événement à venir.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {upcoming.map((ev) => {
            const s = EVENT_TYPE_STYLES[ev.type];
            const start = new Date(ev.startAt);
            const dayPart = relativeDayLabel(start);
            return (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className="flex w-full items-start gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-slate-50"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-900">{ev.title}</p>
                    <p className="truncate text-[10px] text-slate-500">
                      {ev.typeLabel}
                      {ev.patientName ? ` — ${ev.patientName}` : ""}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {dayPart} à {formatTimeHm(start)}
                    </p>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-600">
                    {formatTimeHm(start)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
