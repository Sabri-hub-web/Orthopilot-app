"use client";

import { useMemo } from "react";
import { EVENT_TYPE_STYLES, dayKeyLocal } from "@/lib/calendar-ui";
import type { CalendarEventItem, InternalTask } from "@/types/domain";

interface CalendarMonthViewProps {
  anchor: Date;
  events: CalendarEventItem[];
  tasks: InternalTask[];
  onDayClick: (d: Date) => void;
  onEventClick: (ev: CalendarEventItem) => void;
}

export function CalendarMonthView({
  anchor,
  events,
  tasks,
  onDayClick,
  onEventClick,
}: CalendarMonthViewProps) {
  const cells = useMemo(() => {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const start = new Date(year, month, 1 - startPad);
    const out: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [anchor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of events) {
      const k = dayKeyLocal(new Date(ev.startAt));
      const arr = map.get(k) ?? [];
      arr.push(ev);
      map.set(k, arr);
    }
    return map;
  }, [events]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      const k = t.dueDate.slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const todayKey = dayKeyLocal(new Date());
  const month = anchor.getMonth();

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <section className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </section>
      <section className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const key = dayKeyLocal(d);
          const inMonth = d.getMonth() === month;
          const dayEvents = eventsByDay.get(key) ?? [];
          const taskCount = tasksByDay.get(key) ?? 0;
          const isToday = key === todayKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(d)}
              className={`min-h-[4.5rem] rounded-lg border p-1 text-left transition hover:border-slate-300 hover:bg-slate-50/80 ${
                inMonth ? "border-slate-100 bg-white" : "border-transparent bg-slate-50/50 opacity-60"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                  isToday ? "bg-indigo-600 text-white" : "text-slate-700"
                }`}
              >
                {d.getDate()}
              </span>
              <section className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    className={`block w-full truncate rounded px-1 py-px text-left text-[8px] font-medium ${EVENT_TYPE_STYLES[ev.type].bg} ${EVENT_TYPE_STYLES[ev.type].text}`}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 2 ? (
                  <p className="text-[8px] text-slate-500">+{dayEvents.length - 2}</p>
                ) : null}
                {taskCount > 0 ? (
                  <p className="text-[8px] font-medium text-amber-700">{taskCount} tâche(s)</p>
                ) : null}
              </section>
            </button>
          );
        })}
      </section>
    </section>
  );
}
