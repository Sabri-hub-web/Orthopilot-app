"use client";

import { ChevronLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { CALENDAR_VIEW_MODES, type CalendarViewMode } from "@/lib/calendar-ui";

interface CalendarToolbarProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent: () => void;
  canManage: boolean;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}

export function CalendarToolbar({
  viewMode,
  onViewModeChange,
  periodLabel,
  onPrev,
  onNext,
  onToday,
  onNewEvent,
  canManage,
  filtersOpen,
  onToggleFilters,
}: CalendarToolbarProps) {
  return (
    <section className="mb-1 flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-2 py-1.5 shadow-sm">
      <section className="flex flex-wrap gap-0.5 rounded-lg border border-slate-100 bg-slate-50/80 p-px">
        {CALENDAR_VIEW_MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewModeChange(id)}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${
              viewMode === id
                ? "bg-gradient-to-r from-violet-500/15 to-indigo-500/15 text-indigo-700 ring-1 ring-indigo-200/60"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="flex flex-1 flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Période précédente"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <p className="min-w-[8.5rem] px-0.5 text-center text-xs font-semibold capitalize text-slate-900">
          {periodLabel}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Période suivante"
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-md border border-slate-200/90 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Aujourd&apos;hui
        </button>
      </section>

      <section className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onToggleFilters}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
            filtersOpen
              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
              : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Filter className="h-3 w-3" strokeWidth={1.75} />
          Filtrer
        </button>
        {canManage ? (
          <button
            type="button"
            onClick={onNewEvent}
            className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-sky-500 to-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-700"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
            Nouvel événement
          </button>
        ) : null}
      </section>
    </section>
  );
}
