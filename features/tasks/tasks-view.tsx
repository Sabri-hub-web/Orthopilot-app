"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import { PatientListItem, TaskFormPayload, TasksListResponse, UsersListItem } from "@/types/domain";

const PAGE_SIZE = 10;

const taskStatusStyles = {
  "A faire": "bg-orange-50 text-orange-700 border-orange-100",
  "En cours": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "En attente": "bg-slate-100 text-slate-700 border-slate-200",
  Terminee: "bg-blue-50 text-blue-700 border-blue-100",
};

const statusOptions = [
  { value: "A_FAIRE", label: "A faire" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "TERMINEE", label: "Terminee" },
] as const;

const priorityOptions = [
  { value: "FAIBLE", label: "Faible" },
  { value: "NORMALE", label: "Normale" },
  { value: "IMPORTANTE", label: "Importante" },
  { value: "URGENTE", label: "Urgente" },
] as const;

const defaultForm: TaskFormPayload = {
  title: "",
  comment: "",
  dueDate: "",
  priority: "NORMALE",
  status: "A_FAIRE",
  assigneeId: null,
  patientId: null,
};

export function TasksView() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TasksListResponse | null>(null);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormPayload>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadTasks = useCallback(async () => {
    const response = await fetch(`/api/tasks?page=${page}&pageSize=${PAGE_SIZE}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Echec du chargement des taches.");
    const payload: TasksListResponse = await response.json();
    setData(payload);
  }, [page]);

  useEffect(() => {
    async function loadTasksData() {
      try {
        setLoading(true);
        await loadTasks();
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadTasksData();
  }, [loadTasks]);

  useEffect(() => {
    async function loadOptions() {
      const patientsUrl = "/api/patients?page=1&pageSize=50";
      const usersUrl = "/api/users";

      try {
        const patientsRes = await fetch(patientsUrl, { cache: "no-store" });
        if (patientsRes.ok) {
          const patientsPayload = await patientsRes.json();
          setPatients(patientsPayload.items ?? []);
        }
      } catch {
        setPatients([]);
      }

      try {
        const usersRes = await fetch(usersUrl, { cache: "no-store" });
        if (usersRes.ok) {
          const usersPayload = await usersRes.json();
          setUsers(usersPayload.items ?? []);
        }
      } catch {
        setUsers([]);
      }
    }

    void loadOptions();
  }, []);

  function resetForm() {
    setEditingTaskId(null);
    setForm(defaultForm);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setSuccess(null);
      setError(null);
      const url = editingTaskId ? `/api/tasks/${editingTaskId}` : "/api/tasks";
      const method = editingTaskId ? "PATCH" : "POST";

      const body = {
        ...form,
        comment: form.comment === "" ? null : form.comment,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }

      await loadTasks();
      resetForm();
      setSuccess(editingTaskId ? "Tache mise a jour." : "Tache creee.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!window.confirm("Supprimer cette tache ? Cette action est definitive.")) return;
    try {
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadTasks();
      if (editingTaskId === taskId) resetForm();
      setSuccess("Tache supprimee.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  function startEdit(task: TasksListResponse["items"][number]) {
    const statusValue = statusOptions.find((item) => item.label === task.status)?.value ?? "A_FAIRE";
    const priorityValue =
      priorityOptions.find((item) => item.label.toLowerCase() === task.priority)?.value ?? "NORMALE";
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      comment: task.comment ?? "",
      dueDate: task.dueDate,
      priority: priorityValue,
      status: statusValue,
      assigneeId: task.assigneeId,
      patientId: task.patientId,
    });
  }

  async function quickStatusUpdate(taskId: string, status: TaskFormPayload["status"]) {
    try {
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadTasks();
      setSuccess("Statut mis a jour.");
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  async function quickAssignUpdate(taskId: string, assigneeId: string | null) {
    try {
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadTasks();
      setSuccess("Assignation mise a jour.");
    } catch (assignError) {
      const message = assignError instanceof Error ? assignError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  const canGoPrev = page > 1;
  const canGoNext = data ? page < data.totalPages : false;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Taches internes</h3>
        <p className="text-xs text-slate-500">Page {data?.page ?? page}</p>
      </div>

      {success ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
        <input
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="Titre de la tache"
          required
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          required
        />
        <select
          value={form.priority}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, priority: event.target.value as TaskFormPayload["priority"] }))
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {priorityOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={form.status}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, status: event.target.value as TaskFormPayload["status"] }))
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {statusOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={form.assigneeId ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value || null }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Non assignee</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName}
            </option>
          ))}
        </select>
        <select
          value={form.patientId ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value || null }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Sans patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.fullName}
            </option>
          ))}
        </select>
        <textarea
          value={form.comment ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2"
          rows={2}
          placeholder="Commentaire simple"
        />
        <div className="flex items-center gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {editingTaskId ? "Modifier" : "Nouvelle tache"}
          </button>
          {editingTaskId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
            >
              Annuler edition
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement des taches...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Tache</th>
                  <th className="pb-2 font-medium">Responsable</th>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Echeance</th>
                  <th className="pb-2 font-medium">Priorite</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((task) => (
                  <tr key={task.id} className="border-t border-slate-100">
                    <td className="max-w-72 py-2 text-slate-800">
                      <span className="block truncate">{task.title}</span>
                      {task.comment ? <span className="block truncate text-xs text-slate-500">{task.comment}</span> : null}
                    </td>
                    <td className="py-2 text-slate-700">
                      <select
                        value={task.assigneeId ?? ""}
                        onChange={(event) => quickAssignUpdate(task.id, event.target.value || null)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        <option value="">Non assignee</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 text-slate-700">{task.patientName ?? "-"}</td>
                    <td className="py-2 text-slate-700">{task.dueDate}</td>
                    <td className="py-2 capitalize text-slate-600">{task.priority}</td>
                    <td className="py-2">
                      <select
                        value={statusOptions.find((item) => item.label === task.status)?.value ?? "A_FAIRE"}
                        onChange={(event) => quickStatusUpdate(task.id, event.target.value as TaskFormPayload["status"])}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        {statusOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(task.id)}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                        >
                          Supprimer
                        </button>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${taskStatusStyles[task.status]}`}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {data.total} element(s) - page {data.page} / {data.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={!canGoPrev}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedent
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!canGoNext}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
