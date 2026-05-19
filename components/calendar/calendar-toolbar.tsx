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
    <section className="flex max-h-[52px] min-h-[44px] shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
      <section className="inline-flex rounded-lg border border-slate-100 bg-slate-50/80 p-0.5">
        {CALENDAR_VIEW_MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewModeChange(id)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
              viewMode === id
                ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200/80"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="flex min-w-0 flex-1 items-center justify-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Période précédente"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <p className="min-w-[9rem] truncate px-1 text-center text-xs font-semibold capitalize text-slate-900">
          {periodLabel}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          aria-label="Période suivante"
        >
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Aujourd&apos;hui
        </button>
      </section>

      <section className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleFilters}
          className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold ${
            filtersOpen
              ? "border-violet-200 bg-violet-50 text-violet-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Filter className="h-3 w-3" strokeWidth={1.75} />
          Filtrer
        </button>
        {canManage ? (
          <button
            type="button"
            onClick={onNewEvent}
            className="inline-flex h-7 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <Plus className="h-3 w-3" strokeWidth={2.25} />
            Nouvel événement
          </button>
        ) : null}
      </section>
    </section>
  );
}
