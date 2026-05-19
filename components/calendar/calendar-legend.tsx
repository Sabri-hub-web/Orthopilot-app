import { EVENT_TYPE_STYLES } from "@/lib/calendar-ui";
import { CALENDAR_EVENT_TYPES } from "@/lib/calendar";

export function CalendarLegend() {
  return (
    <section className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-1 py-1">
      {CALENDAR_EVENT_TYPES.map((type) => {
        const s = EVENT_TYPE_STYLES[type];
        return (
          <span key={type} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
            {s.legend}
          </span>
        );
      })}
    </section>
  );
}
