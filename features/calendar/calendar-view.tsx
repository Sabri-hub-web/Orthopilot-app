"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  CALENDAR_EVENT_TYPES,
  calendarEventTypeLabelMap,
} from "@/lib/calendar";
import type {
  CalendarEventItem,
  CalendarEventTypeApi,
  CalendarFeedResponse,
  InternalTask,
  PatientsListResponse,
} from "@/types/domain";

type ViewMode = "day" | "week" | "month";

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekSunday(fromMonday: Date): Date {
  const x = new Date(fromMonday);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startEndForView(anchor: Date, mode: ViewMode): { from: Date; to: Date } {
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

function dayKeyLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [feed, setFeed] = useState<CalendarFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignees, setAssignees] = useState<{ id: string; fullName: string }[]>([]);
  const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
  const [editing, setEditing] = useState<CalendarEventItem | null>(null);

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
    if (!res.ok) throw new Error("Echec chargement calendrier.");
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
    if (!canManage) return;
    let cancelled = false;
    (async () => {
      const [uRes, pRes] = await Promise.all([
        fetch("/api/calendar/assignees", { cache: "no-store" }),
        fetch("/api/patients?page=1&pageSize=50", { cache: "no-store" }),
      ]);
      if (cancelled) return;
      if (uRes.ok) {
        const uJson = (await uRes.json()) as { items: { id: string; fullName: string }[] };
        setAssignees(uJson.items ?? []);
      }
      if (pRes.ok) {
        const pJson = (await pRes.json()) as PatientsListResponse;
        setPatients(pJson.items.map((p) => ({ id: p.id, fullName: p.fullName })));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage]);

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

  function openEdit(ev: CalendarEventItem) {
    setEditing(ev);
    setFormTitle(ev.title);
    setFormDescription(ev.description ?? "");
    setFormStart(formatDatetimeLocal(new Date(ev.startAt)));
    setFormEnd(formatDatetimeLocal(new Date(ev.endAt)));
    setFormType(ev.type);
    setFormAssigneeId(ev.assigneeId ?? "");
    setFormPatientId(ev.patientId ?? "");
  }

  function cancelEdit() {
    setEditing(null);
    resetFormToNew();
  }

  function shiftAnchor(delta: number) {
    setAnchor((prev) => {
      const n = new Date(prev);
      if (viewMode === "day") n.setDate(n.getDate() + delta);
      else if (viewMode === "week") n.setDate(n.getDate() + 7 * delta);
      else n.setMonth(n.getMonth() + delta);
      return n;
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
      setEditing(null);
      resetFormToNew();
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
    if (editing?.id === ev.id) setEditing(null);
    await loadFeed();
  }

  const days = useMemo(() => eachDayInRange(range.from, range.to), [range.from, range.to]);

  const byDay = useMemo(() => {
    const map = new Map<string, { events: CalendarEventItem[]; tasks: InternalTask[] }>();
    for (const d of days) {
      map.set(dayKeyLocal(d), { events: [], tasks: [] });
    }
    if (!feed) return map;
    for (const ev of feed.events) {
      for (const k of eventDayKeys(ev)) {
        const bucket = map.get(k);
        if (bucket && !bucket.events.find((x) => x.id === ev.id)) bucket.events.push(ev);
      }
    }
    for (const t of feed.tasks) {
      const k = t.dueDate.slice(0, 10);
      const bucket = map.get(k);
      if (bucket) bucket.tasks.push(t);
    }
    for (const [, b] of map) {
      b.events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
    return map;
  }, [feed, days]);

  const titleRange = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    if (viewMode === "day") return anchor.toLocaleDateString("fr-FR", opts);
    if (viewMode === "week") {
      return `Semaine du ${range.from.toLocaleDateString("fr-FR", opts)} au ${range.to.toLocaleDateString("fr-FR", opts)}`;
    }
    return anchor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, [anchor, range.from, range.to, viewMode]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Calendrier</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
            {(["day", "week", "month"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`rounded-md px-2 py-1 capitalize ${
                  viewMode === m ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {m === "day" ? "Jour" : m === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => shiftAnchor(-1)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
          >
            precedent
          </button>
          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
          >
            Aujourd hui
          </button>
          <button
            type="button"
            onClick={() => shiftAnchor(1)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
          >
            suivant
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-600">{titleRange}</p>

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {!loading && feed ? (
        <div className="mt-4 space-y-6">
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
                <div key={key} className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-400">
                  <p className="font-medium capitalize text-slate-500">{label}</p>
                  <p className="text-xs">Rien de prevu.</p>
                </div>
              );
            }
            return (
              <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3">
                <p className="font-semibold capitalize text-slate-900">{label}</p>
                <ul className="mt-2 space-y-2">
                  {bucket.events.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <div>
                        <span className="font-medium text-slate-900">{ev.title}</span>
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                          {ev.typeLabel}
                        </span>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {new Date(ev.startAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          –{" "}
                          {new Date(ev.endAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {ev.assigneeName ? ` · ${ev.assigneeName}` : ""}
                          {ev.patientName ? ` · Patient: ${ev.patientName}` : ""}
                        </p>
                        {ev.description ? (
                          <p className="mt-1 text-xs text-slate-600">{ev.description}</p>
                        ) : null}
                      </div>
                      {canManage ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-emerald-700 hover:underline"
                            onClick={() => openEdit(ev)}
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:underline"
                            onClick={() => deleteEvent(ev)}
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                  {bucket.tasks.map((t) => (
                    <li
                      key={`task-${t.id}`}
                      className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950"
                    >
                      <span className="font-medium">Tache : {t.title}</span>
                      <span className="ml-2 text-xs text-amber-800">{t.status}</span>
                      <p className="text-xs text-amber-900/90">
                        Echeance {t.dueDate} · {t.assignee}
                        {t.patientName ? ` · ${t.patientName}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      {canManage ? (
        <form onSubmit={submitForm} className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-900">
            {editing ? "Modifier l evenement" : "Nouvel evenement"}
          </h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs">
              Titre
              <input
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Type
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as CalendarEventTypeApi)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                {CALENDAR_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {calendarEventTypeLabelMap[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs sm:col-span-2">
              Description (optionnel)
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Debut
              <input
                type="datetime-local"
                required
                value={formStart}
                onChange={(e) => setFormStart(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Fin
              <input
                type="datetime-local"
                required
                value={formEnd}
                onChange={(e) => setFormEnd(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Assigne a
              <select
                value={formAssigneeId}
                onChange={(e) => setFormAssigneeId(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="">—</option>
                {assignees.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              Patient (optionnel)
              <select
                value={formPatientId}
                onChange={(e) => setFormPatientId(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="">—</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {saving ? "..." : editing ? "Enregistrer" : "Creer"}
            </button>
            {editing ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="mt-4 text-xs text-slate-500">
          Lecture seule : vous voyez les evenements et les taches a echéance ; la creation est reservee aux profils habilites.
        </p>
      )}
    </section>
  );
}
