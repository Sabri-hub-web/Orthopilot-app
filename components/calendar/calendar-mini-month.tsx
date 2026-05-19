"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { dayKeyLocal, isSameDay } from "@/lib/calendar-ui";

interface CalendarMiniMonthProps {
  anchor: Date;
  selected: Date;
  onSelectDay: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  eventDayKeys: Set<string>;
}

export function CalendarMiniMonth({
  anchor,
  selected,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  eventDayKeys,
}: CalendarMiniMonthProps) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const start = new Date(year, month, 1 - startPad);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }

  const title = anchor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const today = new Date();

  return (
    <article className="w-full max-w-full shrink-0 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <p className="text-[10px] font-semibold capitalize text-slate-900">{title}</p>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </header>
      <section className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold text-slate-400">
        {["L", "M", "M", "J", "V", "S", "D"].map((l, i) => (
          <span key={`${l}-${i}`}>{l}</span>
        ))}
      </section>
      <section className="mt-1 grid grid-cols-7 gap-0.5">
        {cells.map((d) => {
          const key = dayKeyLocal(d);
          const inMonth = d.getMonth() === month;
          const selectedDay = isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          const hasEvent = eventDayKeys.has(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(d)}
              className={`relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium tabular-nums transition ${
                !inMonth ? "text-slate-300" : "text-slate-700 hover:bg-slate-100"
              } ${selectedDay ? "bg-violet-600 text-white shadow-sm" : ""} ${
                isToday && !selectedDay ? "font-bold text-violet-700 ring-1 ring-violet-400" : ""
              }`}
            >
              {d.getDate()}
              {hasEvent && !selectedDay ? (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-violet-500" />
              ) : null}
            </button>
          );
        })}
      </section>
    </article>
  );
}
