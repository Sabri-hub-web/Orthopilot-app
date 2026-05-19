import { EVENT_TYPE_STYLES } from "@/lib/calendar-ui";
import { CALENDAR_EVENT_TYPES } from "@/lib/calendar";

export function CalendarLegend() {
  return (
    <section className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-100/90 bg-white/80 px-2.5 py-1.5">
      {CALENDAR_EVENT_TYPES.map((type) => {
        const s = EVENT_TYPE_STYLES[type];
        return (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-600"
          >
            <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
            {s.legend}
          </span>
        );
      })}
    </section>
  );
}
