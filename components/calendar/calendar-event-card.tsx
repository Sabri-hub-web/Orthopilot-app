"use client";

import { EVENT_TYPE_STYLES, formatTimeHm } from "@/lib/calendar-ui";
import type { CalendarEventItem } from "@/types/domain";

export function CalendarEventCard({
  event,
  compact = false,
  onClick,
}: {
  event: CalendarEventItem;
  compact?: boolean;
  onClick?: () => void;
}) {
  const style = EVENT_TYPE_STYLES[event.type];
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const detail = [event.patientName, event.assigneeName].filter(Boolean).join(" · ");

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`h-full w-full overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-sm transition hover:brightness-[0.98] hover:shadow-md ${style.bg} ${style.border} ${style.text}`}
      >
        <p className="truncate text-[10px] font-semibold leading-tight">{event.title}</p>
        <p className="truncate text-[9px] opacity-80">
          {formatTimeHm(start)} – {formatTimeHm(end)}
        </p>
        {detail ? <p className="mt-0.5 truncate text-[8px] opacity-70">{detail}</p> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-3 py-2 text-left shadow-sm transition hover:shadow-md ${style.bg} ${style.border} ${style.text}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold">{event.title}</p>
        <span className="shrink-0 text-[10px] font-medium opacity-80">{event.typeLabel}</span>
      </div>
      <p className="mt-0.5 text-xs opacity-80">
        {formatTimeHm(start)} – {formatTimeHm(end)}
      </p>
      {detail ? <p className="mt-1 text-xs opacity-70">{detail}</p> : null}
    </button>
  );
}
