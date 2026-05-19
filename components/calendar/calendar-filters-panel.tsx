"use client";

import { ChevronDown } from "lucide-react";
import { CALENDAR_EVENT_TYPES, calendarEventTypeLabelMap } from "@/lib/calendar";
import { EVENT_TYPE_STYLES } from "@/lib/calendar-ui";
import type { CalendarEventTypeApi } from "@/types/domain";

interface CalendarFiltersPanelProps {
  assignees: { id: string; fullName: string }[];
  filterAssigneeId: string;
  onAssigneeChange: (id: string) => void;
  filterTypes: Set<CalendarEventTypeApi>;
  onToggleType: (type: CalendarEventTypeApi) => void;
  showTasks: boolean;
  onShowTasksChange: (v: boolean) => void;
  highlighted?: boolean;
}

export function CalendarFiltersPanel({
  assignees,
  filterAssigneeId,
  onAssigneeChange,
  filterTypes,
  onToggleType,
  showTasks,
  onShowTasksChange,
  highlighted = false,
}: CalendarFiltersPanelProps) {
  return (
    <article
      className={`shrink-0 rounded-xl border bg-white p-2.5 shadow-sm ${
        highlighted ? "border-violet-300 ring-2 ring-violet-100" : "border-slate-200"
      }`}
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Filtres d&apos;affichage
      </h3>
      <section className="mt-2 space-y-2">
        <label className="block">
          <span className="text-[10px] font-medium text-slate-500">Utilisateurs</span>
          <span className="relative mt-0.5 block">
            <select
              value={filterAssigneeId}
              onChange={(e) => onAssigneeChange(e.target.value)}
              className="h-8 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50/50 pl-2 pr-7 text-[11px] text-slate-800"
            >
              <option value="">Tous</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </span>
        </label>

        <fieldset>
          <legend className="text-[10px] font-medium text-slate-500">Types</legend>
          <section className="mt-1 flex flex-wrap gap-1">
            {CALENDAR_EVENT_TYPES.map((type) => {
              const active = filterTypes.size === 0 || filterTypes.has(type);
              const s = EVENT_TYPE_STYLES[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleType(type)}
                  className={`inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[9px] font-semibold ${
                    active ? s.card : "border-slate-200 bg-white text-slate-400 opacity-60"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {calendarEventTypeLabelMap[type].split(" ")[0]}
                </button>
              );
            })}
          </section>
        </fieldset>

        <label className="block">
          <span className="text-[10px] font-medium text-slate-500">Salles</span>
          <span className="relative mt-0.5 block">
            <select
              disabled
              className="h-8 w-full cursor-not-allowed appearance-none rounded-lg border border-slate-200 bg-slate-100 pl-2 pr-7 text-[11px] text-slate-500"
            >
              <option>Toutes les salles</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </span>
        </label>

        <label className="flex h-8 items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2">
          <span className="text-[11px] font-medium text-slate-700">Afficher les tâches</span>
          <input
            type="checkbox"
            checked={showTasks}
            onChange={(e) => onShowTasksChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-violet-600"
          />
        </label>
      </section>
    </article>
  );
}
