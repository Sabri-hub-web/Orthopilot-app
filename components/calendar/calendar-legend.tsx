import { EVENT_TYPE_STYLES } from "@/lib/calendar-ui";
import { CALENDAR_EVENT_TYPES } from "@/lib/calendar";

export function CalendarLegend() {
  return (
    <section className="mt-1 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-1">
      {CALENDAR_EVENT_TYPES.map((type) => {
        const s = EVENT_TYPE_STYLES[type];
        return (
          <span key={type} className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600">
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
            {s.legend}
          </span>
        );
      })}
    </section>
  );
}
