"use client";

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
      className={`rounded-2xl border bg-white p-3 shadow-sm transition ${
        highlighted ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200/90"
      }`}
    >
      <h3 className="text-xs font-semibold text-slate-900">Filtres d&apos;affichage</h3>
      <section className="mt-2 space-y-2.5">
        <label className="flex flex-col gap-1 text-[10px] font-medium text-slate-600">
          Utilisateurs
          <select
            value={filterAssigneeId}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-xs text-slate-800"
          >
            <option value="">Tous</option>
            {assignees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-1">
          <legend className="text-[10px] font-medium text-slate-600">Types d&apos;événements</legend>
          <section className="flex flex-wrap gap-1">
            {CALENDAR_EVENT_TYPES.map((type) => {
              const active = filterTypes.size === 0 || filterTypes.has(type);
              const s = EVENT_TYPE_STYLES[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleType(type)}
                  className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition ${
                    active
                      ? `${s.bg} ${s.border} ${s.text}`
                      : "border-slate-200 bg-white text-slate-400 opacity-60"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {calendarEventTypeLabelMap[type]}
                </button>
              );
            })}
          </section>
        </fieldset>

        <label className="flex flex-col gap-1 text-[10px] font-medium text-slate-600">
          Salles
          <select
            disabled
            className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-500"
            title="Bientôt disponible"
          >
            <option>Toutes les salles</option>
          </select>
        </label>

        <label className="flex items-center justify-between gap-2 text-xs text-slate-700">
          <span className="font-medium">Afficher les tâches</span>
          <input
            type="checkbox"
            checked={showTasks}
            onChange={(e) => onShowTasksChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </label>
      </section>
    </article>
  );
}
