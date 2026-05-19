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
        className={`flex h-full w-full flex-col overflow-hidden rounded-[14px] px-1.5 py-1 text-left shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.1)] ${style.card}`}
      >
        <p className={`text-[10px] font-medium tabular-nums leading-none ${style.muted}`}>
          {formatTimeHm(start)}
        </p>
        <p className={`mt-0.5 truncate text-[11px] font-bold leading-snug ${style.text}`}>
          {event.title}
        </p>
        {!minimal ? (
          <>
            <p className={`truncate text-[10px] leading-tight ${style.muted}`}>{practitioner}</p>
            <p className={`mt-auto truncate text-[9px] leading-none ${style.muted}`}>{room}</p>
          </>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[14px] px-3 py-2 text-left shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition hover:shadow-md ${style.card}`}
    >
      <section className="flex items-start justify-between gap-2">
        <p className={`text-sm font-semibold ${style.text}`}>{event.title}</p>
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
