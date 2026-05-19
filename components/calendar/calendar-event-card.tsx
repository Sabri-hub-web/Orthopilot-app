"use client";

import {
  EVENT_TYPE_STYLES,
  eventRoomLabel,
  eventSubtitle,
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
  const timeLabel = `${formatTimeHm(start)} – ${formatTimeHm(end)}`;
  const subtitle = eventSubtitle(event);
  const room = eventRoomLabel();

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group flex h-full min-h-[1.75rem] w-full flex-col overflow-hidden rounded-xl border border-l-[3px] px-1.5 py-0.5 text-left shadow-sm transition duration-150 hover:z-20 hover:shadow-md ${style.bg} ${style.border} ${style.accent} ${style.text}`}
      >
        <p className="truncate text-[10px] font-bold leading-tight tabular-nums">{formatTimeHm(start)}</p>
        <p className="truncate text-[10px] font-semibold leading-snug">{event.title}</p>
        {!minimal ? (
          <>
            <p className={`truncate text-[9px] leading-tight ${style.muted}`}>{subtitle}</p>
            <p className={`mt-auto truncate text-[8px] leading-none ${style.muted}`}>Salle {room}</p>
          </>
        ) : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border border-l-[3px] px-3 py-2.5 text-left shadow-sm transition hover:shadow-md ${style.bg} ${style.border} ${style.accent} ${style.text}`}
    >
      <section className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{event.title}</p>
        <span className={`shrink-0 text-[10px] font-medium ${style.muted}`}>{event.typeLabel}</span>
      </section>
      <p className={`mt-0.5 text-xs font-medium tabular-nums ${style.muted}`}>{timeLabel}</p>
      <p className={`mt-1 text-xs ${style.muted}`}>
        {subtitle} · Salle {room}
      </p>
    </button>
  );
}
