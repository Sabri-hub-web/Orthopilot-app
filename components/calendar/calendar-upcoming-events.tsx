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
      .slice(0, 3);
  }, [events]);

  return (
    <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm">
      <h3 className="shrink-0 text-[10px] font-semibold text-slate-900">Prochains événements</h3>
      {upcoming.length === 0 ? (
        <p className="mt-1 text-[9px] text-slate-500">Aucun événement à venir.</p>
      ) : (
        <ul className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-hidden">
          {upcoming.map((ev) => {
            const s = EVENT_TYPE_STYLES[ev.type];
            const start = new Date(ev.startAt);
            return (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className="flex w-full items-start gap-1.5 rounded-md border border-slate-100 bg-slate-50/60 px-1.5 py-1 text-left hover:bg-white"
                >
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold leading-tight text-slate-900">
                      {ev.title}
                    </p>
                    <p className="truncate text-[9px] text-slate-500">
                      {relativeDayLabel(start)} · {formatTimeHm(start)}
                    </p>
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
