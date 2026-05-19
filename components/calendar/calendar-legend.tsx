import { EVENT_TYPE_STYLES } from "@/lib/calendar-ui";
import { CALENDAR_EVENT_TYPES } from "@/lib/calendar";

interface CalendarLegendProps {
  variant?: "inline" | "card";
}

export function CalendarLegend({ variant = "inline" }: CalendarLegendProps) {
  const items = CALENDAR_EVENT_TYPES.map((type) => {
    const s = EVENT_TYPE_STYLES[type];
    return (
      <span key={type} className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-700">
        <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden />
        {s.legend}
      </span>
    );
  });

  if (variant === "card") {
    return (
      <article className="shrink-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Légende
        </h3>
        <div className="flex flex-col gap-1.5">{items}</div>
      </article>
    );
  }

  return (
    <section className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 px-0.5 py-0.5">
      {items}
    </section>
  );
}

