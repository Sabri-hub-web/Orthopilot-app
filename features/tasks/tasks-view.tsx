"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  ListTodo,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  InternalTask,
  PatientListItem,
  PriorityLevel,
  TaskFormPayload,
  TasksListResponse,
  UsersListItem,
} from "@/types/domain";

type StatusValue = TaskFormPayload["status"];
type StatusApiLabel = InternalTask["status"];

const COLUMNS: { value: StatusValue; apiLabel: StatusApiLabel; label: string; accent: string }[] = [
  { value: "A_FAIRE", apiLabel: "A faire", label: "À faire", accent: "bg-orange-400" },
  { value: "EN_COURS", apiLabel: "En cours", label: "En cours", accent: "bg-emerald-400" },
  { value: "EN_ATTENTE", apiLabel: "En attente", label: "En attente", accent: "bg-slate-400" },
  { value: "TERMINEE", apiLabel: "Terminee", label: "Terminées", accent: "bg-blue-400" },
];

const priorityOptions: { value: TaskFormPayload["priority"]; label: string }[] = [
  { value: "URGENTE", label: "Urgent" },
  { value: "IMPORTANTE", label: "Important" },
  { value: "NORMALE", label: "Normal" },
  { value: "FAIBLE", label: "Faible" },
];

const PRIORITY_META: Record<
  PriorityLevel,
  { label: string; bar: string; badge: string; value: TaskFormPayload["priority"] }
> = {
  urgente: { label: "Urgent", bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200", value: "URGENTE" },
  importante: {
    label: "Important",
    bar: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    value: "IMPORTANTE",
  },
  normale: { label: "Normal", bar: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200", value: "NORMALE" },
  faible: { label: "Faible", bar: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", value: "FAIBLE" },
};

const defaultForm: TaskFormPayload = {
  title: "",
  comment: "",
  dueDate: "",
  priority: "NORMALE",
  status: "A_FAIRE",
  assigneeId: null,
  patientId: null,
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function frDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function isOverdue(task: InternalTask): boolean {
  return task.status !== "Terminee" && task.dueDate < todayStr();
}

export function TasksView() {
  const router = useRouter();
  const [tasks, setTasks] = useState<InternalTask[]>([]);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<StatusValue | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormPayload>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadTasks = useCallback(async () => {
    const collected: InternalTask[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const res = await fetch(`/api/tasks?page=${currentPage}&pageSize=100`, { cache: "no-store" });
      if (!res.ok) throw new Error("Echec du chargement des tâches.");
      const payload: TasksListResponse = await res.json();
      collected.push(...payload.items);
      totalPages = payload.totalPages;
      currentPage += 1;
    } while (currentPage <= totalPages);
    setTasks(collected);
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadTasks();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue de chargement.");
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, [loadTasks]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [patientsRes, usersRes] = await Promise.all([
          fetch("/api/patients?page=1&pageSize=100", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ]);
        if (patientsRes.ok) {
          const payload = await patientsRes.json();
          setPatients(payload.items ?? []);
        }
        if (usersRes.ok) {
          const payload = await usersRes.json();
          setUsers(payload.items ?? []);
        }
      } catch {
        // optionnel
      }
    }
    void loadOptions();
  }, []);

  const q = search.trim().toLowerCase();
  const visibleTasks = q
    ? tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(q) ||
          (task.patientName?.toLowerCase().includes(q) ?? false) ||
          (task.comment?.toLowerCase().includes(q) ?? false),
      )
    : tasks;

  function openCreate(prefillStatus?: StatusValue) {
    setForm({ ...defaultForm, status: prefillStatus ?? "A_FAIRE", dueDate: todayStr() });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, comment: form.comment === "" ? null : form.comment }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadTasks();
      setModalOpen(false);
      setSuccess("Tâche créée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function quickStatusUpdate(taskId: string, status: StatusValue) {
    try {
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  function handleDrop(status: StatusValue, apiLabel: StatusApiLabel) {
    setDragOverCol(null);
    if (!draggedId) return;
    const task = tasks.find((t) => t.id === draggedId);
    setDraggedId(null);
    if (!task || task.status === apiLabel) return;
    void quickStatusUpdate(draggedId, status);
  }

  function openTask(taskId: string) {
    router.push(`/tasks/${taskId}`);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tâches internes</h2>
          <p className="text-sm text-slate-500">Organisez et suivez les tâches du cabinet.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="h-9 w-56 rounded-xl border border-slate-200 bg-white pl-8 pr-2 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
            />
          </div>
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {success ? (
        <p className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
          Chargement des tâches…
        </p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTasks = visibleTasks.filter((t) => t.status === col.apiLabel);
            return (
              <div
                key={col.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.value);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.value ? null : c))}
                onDrop={() => handleDrop(col.value, col.apiLabel)}
                className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-slate-50/70 transition ${
                  dragOverCol === col.value ? "border-violet-300 bg-violet-50/60" : "border-slate-200"
                }`}
              >
                <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                    <span className="text-sm font-semibold text-slate-800">{col.label}</span>
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreate(col.value)}
                    title="Ajouter une tâche"
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-violet-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                  {colTasks.map((task) => {
                    const meta = PRIORITY_META[task.priority];
                    const overdue = isOverdue(task);
                    return (
                      <div
                        key={task.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={() => setDraggedId(task.id)}
                        onDragEnd={() => setDraggedId(null)}
                        onClick={() => openTask(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openTask(task.id);
                          }
                        }}
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pl-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                      >
                        <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} />
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug text-slate-900">{task.title}</p>
                          <span
                            className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        {task.patientName ? (
                          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <User className="h-3 w-3" />
                            {task.patientName}
                          </p>
                        ) : null}
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] ${
                              overdue ? "font-medium text-red-600" : "text-slate-500"
                            }`}
                          >
                            <CalendarClock className="h-3.5 w-3.5" />
                            {frDate(task.dueDate)}
                          </span>
                          {task.assigneeId ? (
                            <span
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700"
                              title={task.assignee}
                            >
                              {initials(task.assignee)}
                            </span>
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <User className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-400">Aucune tâche</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ListTodo className="h-4 w-4 text-violet-600" />
                Nouvelle tâche
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <form onSubmit={handleSubmit} className="grid gap-3 p-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                Titre
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                  placeholder="Titre de la tâche"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                Description
                <textarea
                  value={form.comment ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={2}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  placeholder="Détails de la tâche"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Priorité
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priority: e.target.value as TaskFormPayload["priority"] }))
                  }
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  {priorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Statut
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as StatusValue }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Assigné à
                <select
                  value={form.assigneeId ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value || null }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  <option value="">Non assignée</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Patient lié
                <select
                  value={form.patientId ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value || null }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  <option value="">Sans patient</option>
                  {patients.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                Échéance
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                  required
                />
              </label>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Enregistrement…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
