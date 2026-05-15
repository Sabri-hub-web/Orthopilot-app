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
      className={`shrink-0 rounded-xl border bg-white p-2 shadow-sm ${
        highlighted ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200/90"
      }`}
    >
      <h3 className="text-[10px] font-semibold text-slate-900">Filtres d&apos;affichage</h3>
      <section className="mt-1.5 space-y-1.5">
        <label className="flex flex-col gap-0.5 text-[9px] font-medium text-slate-600">
          Utilisateurs
          <select
            value={filterAssigneeId}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="rounded-md border border-slate-200 bg-slate-50/50 px-1.5 py-1 text-[10px] text-slate-800"
          >
            <option value="">Tous</option>
            {assignees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-[9px] font-medium text-slate-600">Types</legend>
          <section className="mt-0.5 flex flex-wrap gap-0.5">
            {CALENDAR_EVENT_TYPES.map((type) => {
              const active = filterTypes.size === 0 || filterTypes.has(type);
              const s = EVENT_TYPE_STYLES[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleType(type)}
                  className={`inline-flex items-center gap-0.5 rounded border px-1 py-px text-[8px] font-medium ${
                    active ? `${s.bg} ${s.border} ${s.text}` : "border-slate-200 text-slate-400 opacity-50"
                  }`}
                >
                  <span className={`h-1 w-1 rounded-full ${s.dot}`} />
                  {calendarEventTypeLabelMap[type].split(" ")[0]}
                </button>
              );
            })}
          </section>
        </fieldset>

        <label className="flex flex-col gap-0.5 text-[9px] font-medium text-slate-600">
          Salles
          <select disabled className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-1.5 py-1 text-[10px] text-slate-500">
            <option>Toutes les salles</option>
          </select>
        </label>

        <label className="flex items-center justify-between gap-2 text-[10px] text-slate-700">
          <span className="font-medium">Afficher les tâches</span>
          <input
            type="checkbox"
            checked={showTasks}
            onChange={(e) => onShowTasksChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
          />
        </label>
      </section>
    </article>
  );
}
