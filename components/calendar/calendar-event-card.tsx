"use client";

import {
  EVENT_TYPE_STYLES,
  eventPractitionerLabel,
  eventRoomLabel,
  formatTimeHm,
} from "@/lib/calendar-ui";
import type { CalendarEventItem } from "@/types/domain";

export function CalendarEventCard({
  event,
  compact = false,
  minimal = false,
  onClick,
}: {
  event: CalendarEventItem;
  compact?: boolean;
  minimal?: boolean;
  onClick?: () => void;
}) {
  const style = EVENT_TYPE_STYLES[event.type];
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const practitioner = eventPractitionerLabel(event);
  const room = eventRoomLabel(event);

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex h-full w-full flex-col overflow-hidden rounded-lg border px-2 py-1.5 text-left text-[11px] leading-tight shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.card} ${style.accent} border-l-[3px]`}
      >
        <p className="font-bold tabular-nums">{formatTimeHm(start)}</p>
        <p className="truncate font-semibold">{event.title}</p>
        {!minimal ? (
          <>
            <p className={`truncate ${style.muted}`}>{practitioner}</p>
            <p className={`mt-auto truncate text-[10px] ${style.muted}`}>{room}</p>
          </>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border border-l-[3px] px-3 py-2.5 text-left shadow-sm transition hover:shadow-md ${style.card} ${style.accent}`}
    >
      <section className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{event.title}</p>
        <span className={`shrink-0 text-[10px] font-medium ${style.muted}`}>{event.typeLabel}</span>
      </section>
      <p className={`mt-0.5 text-xs font-medium tabular-nums ${style.muted}`}>
        {formatTimeHm(start)} – {formatTimeHm(end)}
      </p>
      <p className={`mt-1 text-xs ${style.muted}`}>
        {practitioner} · {room}
      </p>
    </button>
  );
}
