"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  PauseCircle,
  Pencil,
  PlayCircle,
  Trash2,
  X,
} from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import type {
  InternalTask,
  PatientListItem,
  TaskFormPayload,
  UsersListItem,
} from "@/types/domain";

type StatusValue = TaskFormPayload["status"];

const statusOptions: { value: StatusValue; label: InternalTask["status"]; ui: string }[] = [
  { value: "A_FAIRE", label: "A faire", ui: "À faire" },
  { value: "EN_COURS", label: "En cours", ui: "En cours" },
  { value: "EN_ATTENTE", label: "En attente", ui: "En attente" },
  { value: "TERMINEE", label: "Terminee", ui: "Terminée" },
];

const priorityOptions: { value: TaskFormPayload["priority"]; label: string }[] = [
  { value: "URGENTE", label: "Urgent" },
  { value: "IMPORTANTE", label: "Important" },
  { value: "NORMALE", label: "Normal" },
  { value: "FAIBLE", label: "Faible" },
];

const PRIORITY_TO_API: Record<InternalTask["priority"], TaskFormPayload["priority"]> = {
  urgente: "URGENTE",
  importante: "IMPORTANTE",
  normale: "NORMALE",
  faible: "FAIBLE",
};

function frDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

function frDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function statusUi(status: InternalTask["status"]): string {
  return statusOptions.find((o) => o.label === status)?.ui ?? status;
}

export function TaskDetailView({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<InternalTask | null>(null);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormPayload | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadTask = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
    if (res.status === 404) throw new Error("Tâche introuvable.");
    if (!res.ok) throw new Error("Échec du chargement de la tâche.");
    const payload: InternalTask = await res.json();
    setTask(payload);
  }, [taskId]);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadTask();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
        setTask(null);
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, [loadTask]);

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

  async function quickStatusUpdate(status: StatusValue) {
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
      await loadTask();
      setSuccess("Statut mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  function openEdit() {
    if (!task) return;
    setForm({
      title: task.title,
      comment: task.comment ?? "",
      dueDate: task.dueDate,
      priority: PRIORITY_TO_API[task.priority],
      status: statusOptions.find((o) => o.label === task.status)?.value ?? "A_FAIRE",
      assigneeId: task.assigneeId,
      patientId: task.patientId,
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, comment: form.comment === "" ? null : form.comment }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadTask();
      setModalOpen(false);
      setSuccess("Tâche mise à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer cette tâche ? Cette action est définitive.")) return;
    try {
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      router.push("/tasks");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement de la tâche…</p>;
  }

  if (error && !task) {
    return (
      <div className="space-y-3">
        <Link
          href="/tasks"
          prefetch
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux tâches
        </Link>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-4 overflow-y-auto pb-4">
      <div>
        <Link
          href="/tasks"
          prefetch
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour aux tâches
        </Link>
      </div>

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-600">Tâche interne</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{task.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {task.comment?.trim() ? task.comment : "Aucune description."}
        </p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { label: "Patient lié", value: task.patientName ?? "—" },
            { label: "Assigné à", value: task.assigneeId ? task.assignee : "Non assignée" },
            { label: "Échéance", value: frDate(task.dueDate) },
            { label: "Statut actuel", value: statusUi(task.status) },
            { label: "Date de création", value: frDateTime(task.createdAt) },
          ].map((row) => (
            <div key={row.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <dt className="text-[11px] font-medium text-slate-500">{row.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => void quickStatusUpdate("EN_ATTENTE")}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <PauseCircle className="h-4 w-4" />
          Marquer En attente
        </button>
        <button
          type="button"
          onClick={() => void quickStatusUpdate("EN_COURS")}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
        >
          <PlayCircle className="h-4 w-4" />
          Marquer En cours
        </button>
        <button
          type="button"
          onClick={() => void quickStatusUpdate("TERMINEE")}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          <CheckCircle2 className="h-4 w-4" />
          Marquer Terminé
        </button>
        <button
          type="button"
          onClick={openEdit}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </section>

      {modalOpen && form ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ListTodo className="h-4 w-4 text-violet-600" />
                Modifier la tâche
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
                  onChange={(e) => setForm((p) => (p ? { ...p, title: e.target.value } : p))}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                Description
                <textarea
                  value={form.comment ?? ""}
                  onChange={(e) => setForm((p) => (p ? { ...p, comment: e.target.value } : p))}
                  rows={3}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Priorité
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((p) =>
                      p ? { ...p, priority: e.target.value as TaskFormPayload["priority"] } : p,
                    )
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
                  onChange={(e) =>
                    setForm((p) => (p ? { ...p, status: e.target.value as StatusValue } : p))
                  }
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.ui}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Assigné à
                <select
                  value={form.assigneeId ?? ""}
                  onChange={(e) =>
                    setForm((p) => (p ? { ...p, assigneeId: e.target.value || null } : p))
                  }
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
                  onChange={(e) =>
                    setForm((p) => (p ? { ...p, patientId: e.target.value || null } : p))
                  }
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
                  onChange={(e) => setForm((p) => (p ? { ...p, dueDate: e.target.value } : p))}
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
                  {submitting ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
