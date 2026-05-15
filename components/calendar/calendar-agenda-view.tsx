"use client";

import { CalendarEventCard } from "@/components/calendar/calendar-event-card";
import { dayKeyLocal } from "@/lib/calendar-ui";
import type { CalendarEventItem, InternalTask } from "@/types/domain";

interface CalendarAgendaViewProps {
  days: Date[];
  byDay: Map<string, { events: CalendarEventItem[]; tasks: InternalTask[] }>;
  onEventClick: (ev: CalendarEventItem) => void;
  canManage: boolean;
  onDeleteEvent: (ev: CalendarEventItem) => void;
}

export function CalendarAgendaView({
  days,
  byDay,
  onEventClick,
  canManage,
  onDeleteEvent,
}: CalendarAgendaViewProps) {
  return (
    <section className="space-y-3">
      {days.map((d) => {
        const key = dayKeyLocal(d);
        const bucket = byDay.get(key) ?? { events: [], tasks: [] };
        const label = d.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        if (bucket.events.length === 0 && bucket.tasks.length === 0) {
          return (
            <article
              key={key}
              className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-400"
            >
              <p className="font-medium capitalize text-slate-500">{label}</p>
              <p className="text-xs">Rien de prévu.</p>
            </article>
          );
        }
        return (
          <article key={key} className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
            <p className="font-semibold capitalize text-slate-900">{label}</p>
            <ul className="mt-2 space-y-2">
              {bucket.events.map((ev) => (
                <li key={ev.id} className="flex flex-wrap items-start justify-between gap-2">
                  <section className="min-w-0 flex-1">
                    <CalendarEventCard event={ev} onClick={() => onEventClick(ev)} />
                  </section>
                  {canManage ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-rose-600 hover:underline"
                      onClick={() => onDeleteEvent(ev)}
                    >
                      Supprimer
                    </button>
                  ) : null}
                </li>
              ))}
              {bucket.tasks.map((t) => (
                <li
                  key={`task-${t.id}`}
                  className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950"
                >
                  <span className="font-medium">Tâche : {t.title}</span>
                  <span className="ml-2 text-xs text-amber-800">{t.status}</span>
                  <p className="text-xs text-amber-900/90">
                    Échéance {t.dueDate} · {t.assignee}
                    {t.patientName ? ` · ${t.patientName}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
