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
      .slice(0, 6);
  }, [events]);

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-900">Prochains événements</h3>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-[10px] text-slate-500">Aucun événement à venir sur cette période.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {upcoming.map((ev) => {
            const s = EVENT_TYPE_STYLES[ev.type];
            const start = new Date(ev.startAt);
            return (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onEventClick(ev)}
                  className="flex w-full items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1.5 text-left transition hover:border-slate-200 hover:bg-white"
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                  <span className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-900">
                      {ev.typeLabel} — {ev.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {relativeDayLabel(start)} à {formatTimeHm(start)}
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
