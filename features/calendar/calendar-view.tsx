"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarAgendaView } from "@/components/calendar/calendar-agenda-view";
import { CalendarEventFormModal } from "@/components/calendar/calendar-event-form-modal";
import { CalendarFiltersPanel } from "@/components/calendar/calendar-filters-panel";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarMiniMonth } from "@/components/calendar/calendar-mini-month";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarPageHeader } from "@/components/calendar/calendar-page-header";
import { CalendarTeamPresence } from "@/components/calendar/calendar-team-presence";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarUpcomingEvents } from "@/components/calendar/calendar-upcoming-events";
import { CalendarWeekGrid } from "@/components/calendar/calendar-week-grid";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  dayKeyLocal,
  endOfWeekSunday,
  filterEvents,
  formatWeekRangeLabel,
  startOfWeekMonday,
  taskToCalendarEvent,
  type CalendarViewMode,
} from "@/lib/calendar-ui";
import type {
  CalendarEventItem,
  CalendarEventTypeApi,
  CalendarFeedResponse,
  InternalTask,
  PatientsListResponse,
} from "@/types/domain";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startEndForView(anchor: Date, mode: CalendarViewMode): { from: Date; to: Date } {
  if (mode === "day") {
    const from = new Date(anchor);
    from.setHours(0, 0, 0, 0);
    const to = new Date(anchor);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }
  if (mode === "week") {
    const from = startOfWeekMonday(anchor);
    const to = endOfWeekSunday(from);
    return { from, to };
  }
  if (mode === "agenda") {
    const from = startOfWeekMonday(anchor);
    const to = endOfWeekSunday(from);
    return { from, to };
  }
  const from = startOfMonth(anchor);
  const to = endOfMonth(anchor);
  return { from, to };
}

function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function eachDayInRange(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function eventDayKeys(ev: CalendarEventItem): string[] {
  const start = new Date(ev.startAt);
  const end = new Date(ev.endAt);
  const keys = new Set<string>();
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cur <= last) {
    keys.add(dayKeyLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return [...keys];
}

interface CalendarViewProps {
  canManage: boolean;
}

export function CalendarView({ canManage }: CalendarViewProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [feed, setFeed] = useState<CalendarFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<{ id: string; fullName: string }[]>([]);
  const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
  const [editing, setEditing] = useState<CalendarEventItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filterAssigneeId, setFilterAssigneeId] = useState("");
  const [filterTypes, setFilterTypes] = useState<Set<CalendarEventTypeApi>>(new Set());
  const [showTasks, setShowTasks] = useState(true);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStart, setFormStart] = useState(() => formatDatetimeLocal(new Date()));
  const [formEnd, setFormEnd] = useState(() =>
    formatDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
  );
  const [formType, setFormType] = useState<CalendarEventTypeApi>("AUTRE");
  const [formAssigneeId, setFormAssigneeId] = useState<string>("");
  const [formPatientId, setFormPatientId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const range = useMemo(() => startEndForView(anchor, viewMode), [anchor, viewMode]);

  const loadFeed = useCallback(async () => {
    const { from, to } = startEndForView(anchor, viewMode);
    const qs = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    const res = await fetch(`/api/calendar/feed?${qs}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Échec de chargement du calendrier.");
    const data: CalendarFeedResponse = await res.json();
    setFeed(data);
  }, [anchor, viewMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadFeed();
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFeed]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const uRes = await fetch("/api/calendar/assignees", { cache: "no-store" });
      if (cancelled) return;
      if (uRes.ok) {
        const uJson = (await uRes.json()) as { items: { id: string; fullName: string }[] };
        setAssignees(uJson.items ?? []);
      }
      if (canManage) {
        const pRes = await fetch("/api/patients?page=1&pageSize=50", { cache: "no-store" });
        if (!cancelled && pRes.ok) {
          const pJson = (await pRes.json()) as PatientsListResponse;
          setPatients(pJson.items.map((p) => ({ id: p.id, fullName: p.fullName })));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  const filteredEvents = useMemo(() => {
    if (!feed) return [];
    return filterEvents(feed.events, {
      assigneeId: filterAssigneeId,
      types: filterTypes,
    });
  }, [feed, filterAssigneeId, filterTypes]);

  const filteredTasks = useMemo(() => {
    if (!feed || !showTasks) return [];
    if (!filterAssigneeId) return feed.tasks;
    return feed.tasks.filter((t) => t.assigneeId === filterAssigneeId);
  }, [feed, showTasks, filterAssigneeId]);

  const gridEvents = useMemo(() => {
    const taskEvents = filteredTasks.map(taskToCalendarEvent);
    if (filterTypes.size > 0 && !filterTypes.has("TACHE")) {
      return filteredEvents;
    }
    return [...filteredEvents, ...taskEvents];
  }, [filteredEvents, filteredTasks, filterTypes]);

  const eventDayKeysSet = useMemo(() => {
    const set = new Set<string>();
    for (const ev of filteredEvents) {
      for (const k of eventDayKeys(ev)) set.add(k);
    }
    return set;
  }, [filteredEvents]);

  function resetFormToNew() {
    setFormTitle("");
    setFormDescription("");
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setFormStart(formatDatetimeLocal(now));
    setFormEnd(formatDatetimeLocal(end));
    setFormType("AUTRE");
    setFormAssigneeId("");
    setFormPatientId("");
  }

  function openNewEvent() {
    setEditing(null);
    resetFormToNew();
    setFormOpen(true);
  }

  function openEdit(ev: CalendarEventItem) {
    setEditing(ev);
    setFormTitle(ev.title);
    setFormDescription(ev.description ?? "");
    setFormStart(formatDatetimeLocal(new Date(ev.startAt)));
    setFormEnd(formatDatetimeLocal(new Date(ev.endAt)));
    setFormType(ev.type);
    setFormAssigneeId(ev.assigneeId ?? "");
    setFormPatientId(ev.patientId ?? "");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    resetFormToNew();
  }

  function shiftAnchor(delta: number) {
    setAnchor((prev) => {
      const n = new Date(prev);
      if (viewMode === "day") n.setDate(n.getDate() + delta);
      else if (viewMode === "week" || viewMode === "agenda") n.setDate(n.getDate() + 7 * delta);
      else n.setMonth(n.getMonth() + delta);
      return n;
    });
  }

  function toggleFilterType(type: CalendarEventTypeApi) {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        startAt: new Date(formStart).toISOString(),
        endAt: new Date(formEnd).toISOString(),
        type: formType,
        assigneeId: formAssigneeId || null,
        patientId: formPatientId || null,
      };
      if (editing) {
        const res = await fetch(`/api/calendar/events/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setError(await errorMessageFromResponse(res));
          return;
        }
      } else {
        const res = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setError(await errorMessageFromResponse(res));
          return;
        }
      }
      closeForm();
      await loadFeed();
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(ev: CalendarEventItem) {
    if (!canManage) return;
    if (!window.confirm(`Supprimer « ${ev.title} » ?`)) return;
    const res = await fetch(`/api/calendar/events/${ev.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(await errorMessageFromResponse(res));
      return;
    }
    if (editing?.id === ev.id) closeForm();
    await loadFeed();
  }

  const weekDays = useMemo(() => {
    if (viewMode === "day") return [new Date(anchor)];
    const from = startOfWeekMonday(anchor);
    const days: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      days.push(d);
    }
    return days;
  }, [anchor, viewMode]);

  const days = useMemo(() => eachDayInRange(range.from, range.to), [range.from, range.to]);

  const byDay = useMemo(() => {
    const map = new Map<string, { events: CalendarEventItem[]; tasks: InternalTask[] }>();
    for (const d of days) {
      map.set(dayKeyLocal(d), { events: [], tasks: [] });
    }
    for (const ev of filteredEvents) {
      for (const k of eventDayKeys(ev)) {
        const bucket = map.get(k);
        if (bucket && !bucket.events.find((x) => x.id === ev.id)) bucket.events.push(ev);
      }
    }
    for (const t of filteredTasks) {
      const k = t.dueDate.slice(0, 10);
      const bucket = map.get(k);
      if (bucket) bucket.tasks.push(t);
    }
    for (const [, b] of map) {
      b.events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
    return map;
  }, [filteredEvents, filteredTasks, days]);

  const periodLabel = useMemo(() => {
    if (viewMode === "day") {
      return anchor.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    }
    if (viewMode === "month") {
      return anchor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    }
    return formatWeekRangeLabel(range.from, range.to);
  }, [anchor, range.from, range.to, viewMode]);

  return (
    <section className="animate-dashboard-in flex h-full min-h-0 flex-col overflow-hidden">
      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_340px] xl:h-[calc(100vh-120px)]">
        <section className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
          <section className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
            <CalendarPageHeader />
          </section>

          <CalendarToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            periodLabel={periodLabel}
            onPrev={() => shiftAnchor(-1)}
            onNext={() => shiftAnchor(1)}
            onToday={() => setAnchor(new Date())}
            onNewEvent={openNewEvent}
            canManage={canManage}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((v) => !v)}
          />

          {error ? (
            <p
              className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {loading ? (
            <section className="flex flex-1 flex-col gap-2 animate-pulse">
              <div className="h-10 rounded-2xl bg-slate-200/60" />
              <div className="min-h-0 flex-1 rounded-2xl bg-slate-200/50" />
            </section>
          ) : null}

          {!loading && feed ? (
            <section className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
              {viewMode === "week" || viewMode === "day" ? (
                <section className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                  <CalendarWeekGrid weekDays={weekDays} events={gridEvents} onEventClick={openEdit} />
                  <CalendarLegend />
                </section>
              ) : null}
              {viewMode === "month" ? (
                <section className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200/70 bg-white shadow-sm">
                  <CalendarMonthView
                    anchor={anchor}
                    events={filteredEvents}
                    tasks={filteredTasks}
                    onDayClick={(d) => {
                      setAnchor(d);
                      setViewMode("day");
                    }}
                    onEventClick={openEdit}
                  />
                </section>
              ) : null}
              {viewMode === "agenda" ? (
                <section className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm">
                  <CalendarAgendaView
                    days={days}
                    byDay={byDay}
                    onEventClick={openEdit}
                    canManage={canManage}
                    onDeleteEvent={deleteEvent}
                  />
                </section>
              ) : null}
            </section>
          ) : null}
        </section>

        <aside className="flex min-h-0 w-full shrink-0 flex-col gap-3 overflow-y-auto xl:w-[340px] xl:overflow-hidden">
          <CalendarMiniMonth
            anchor={anchor}
            selected={anchor}
            onSelectDay={(d) => setAnchor(d)}
            onPrevMonth={() =>
              setAnchor((p) => new Date(p.getFullYear(), p.getMonth() - 1, p.getDate()))
            }
            onNextMonth={() =>
              setAnchor((p) => new Date(p.getFullYear(), p.getMonth() + 1, p.getDate()))
            }
            eventDayKeys={eventDayKeysSet}
          />
          <CalendarFiltersPanel
            assignees={assignees}
            filterAssigneeId={filterAssigneeId}
            onAssigneeChange={setFilterAssigneeId}
            filterTypes={filterTypes}
            onToggleType={toggleFilterType}
            showTasks={showTasks}
            onShowTasksChange={setShowTasks}
            highlighted={filtersOpen}
          />
          <CalendarUpcomingEvents events={filteredEvents} onEventClick={openEdit} />
          <CalendarTeamPresence />
        </aside>
      </section>

      <CalendarEventFormModal
        open={formOpen}
        editing={editing}
        canManage={canManage}
        saving={saving}
        formTitle={formTitle}
        formDescription={formDescription}
        formStart={formStart}
        formEnd={formEnd}
        formType={formType}
        formAssigneeId={formAssigneeId}
        formPatientId={formPatientId}
        assignees={assignees}
        patients={patients}
        onClose={closeForm}
        onSubmit={submitForm}
        onTitleChange={setFormTitle}
        onDescriptionChange={setFormDescription}
        onStartChange={setFormStart}
        onEndChange={setFormEnd}
        onTypeChange={setFormType}
        onAssigneeChange={setFormAssigneeId}
        onPatientChange={setFormPatientId}
      />
    </section>
  );
}
