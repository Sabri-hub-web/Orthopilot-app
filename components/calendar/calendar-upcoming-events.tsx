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
    <article className="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="text-[11px] font-semibold text-slate-900">Prochains événements</h3>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-[10px] text-slate-500">Aucun événement à venir.</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {upcoming.map((ev) => {
            const s = EVENT_TYPE_STYLES[ev.type];
            const start = new Date(ev.startAt);
            return (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-100/90 bg-slate-50/50 px-2 py-1.5 text-left transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-900">{ev.title}</p>
                    <p className="truncate text-[10px] text-slate-500">
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
