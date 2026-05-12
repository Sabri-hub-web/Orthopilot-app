"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  EmailFormPayload,
  EmailCategoryApi,
  EmailStatusApi,
  EmailsListResponse,
  PatientListItem,
  UsersListItem,
} from "@/types/domain";
import { EMAIL_CATEGORY_VALUES, EMAIL_STATUS_VALUES, emailCategoryLabelMap, emailStatusLabelMap } from "@/lib/emails";

const PAGE_SIZE = 10;

function localDatetimeInputValue(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const categoryOptions = EMAIL_CATEGORY_VALUES.map((value) => ({
  value,
  label: emailCategoryLabelMap[value],
}));

const statusOptions = EMAIL_STATUS_VALUES.map((value) => ({
  value,
  label: emailStatusLabelMap[value],
}));

const emailCategoryStyles: Record<(typeof categoryOptions)[number]["label"], string> = {
  Urgent: "bg-red-50 text-red-700 border-red-100",
  Administratif: "bg-orange-50 text-orange-700 border-orange-100",
  "Suivi clinique": "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const emailStatusStyles: Record<(typeof statusOptions)[number]["label"], string> = {
  "A traiter": "bg-amber-50 text-amber-900 border-amber-100",
  "En cours": "bg-blue-50 text-blue-800 border-blue-100",
  Traite: "bg-slate-100 text-slate-700 border-slate-200",
  Archive: "bg-slate-50 text-slate-500 border-slate-100",
};

const defaultForm: EmailFormPayload = {
  sender: "",
  subject: "",
  receivedAt: localDatetimeInputValue(),
  category: "ADMINISTRATIF",
  status: "A_TRAITER",
  comment: "",
  patientId: null,
  assigneeId: null,
};

export function EmailsView() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EmailsListResponse | null>(null);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [form, setForm] = useState<EmailFormPayload>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadEmails = useCallback(async () => {
    const response = await fetch(`/api/emails?page=${page}&pageSize=${PAGE_SIZE}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Echec du chargement des emails.");
    const payload: EmailsListResponse = await response.json();
    setData(payload);
  }, [page]);

  useEffect(() => {
    async function loadEmailsData() {
      try {
        setLoading(true);
        await loadEmails();
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadEmailsData();
  }, [loadEmails]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [patientsRes, usersRes] = await Promise.all([
          fetch("/api/patients?page=1&pageSize=50", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ]);
        if (!patientsRes.ok || !usersRes.ok) return;
        const patientsPayload = await patientsRes.json();
        const usersPayload = await usersRes.json();
        setPatients(patientsPayload.items ?? []);
        setUsers(usersPayload.items ?? []);
      } catch {
        // options facultatives
      }
    }

    loadOptions();
  }, []);

  function resetForm() {
    setEditingEmailId(null);
    setForm({ ...defaultForm, receivedAt: localDatetimeInputValue() });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setSuccess(null);
      setError(null);
      const url = editingEmailId ? `/api/emails/${editingEmailId}` : "/api/emails";
      const method = editingEmailId ? "PATCH" : "POST";
      const body = {
        sender: form.sender,
        subject: form.subject,
        receivedAt: form.receivedAt,
        category: form.category,
        status: form.status,
        comment: form.comment === "" ? null : form.comment,
        patientId: form.patientId || null,
        assigneeId: form.assigneeId || null,
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

      await loadEmails();
      resetForm();
      setSuccess(editingEmailId ? "Email mis a jour." : "Email enregistre.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(emailId: string) {
    if (!window.confirm("Supprimer cet email ? Cette action est definitive.")) return;
    try {
      setError(null);
      const response = await fetch(`/api/emails/${emailId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
      if (editingEmailId === emailId) resetForm();
      setSuccess("Email supprime.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  function startEdit(item: EmailsListResponse["items"][number]) {
    const categoryValue =
      categoryOptions.find((o) => o.label === item.category)?.value ?? ("ADMINISTRATIF" as EmailCategoryApi);
    const statusValue =
      statusOptions.find((o) => o.label === item.status)?.value ?? ("A_TRAITER" as EmailStatusApi);
    setEditingEmailId(item.id);
    setForm({
      sender: item.from,
      subject: item.subject,
      receivedAt: `${item.receivedDate}T${item.receivedAt}`,
      category: categoryValue,
      status: statusValue,
      comment: item.comment ?? "",
      patientId: item.patientId,
      assigneeId: item.assigneeId,
    });
  }

  async function quickStatusUpdate(emailId: string, status: EmailStatusApi) {
    try {
      setError(null);
      const response = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
      setSuccess("Statut mis a jour.");
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  async function quickAssignUpdate(emailId: string, assigneeId: string | null) {
    try {
      setError(null);
      const response = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
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
        <h3 className="text-lg font-semibold text-slate-900">Emails du cabinet</h3>
        <p className="text-xs text-slate-500">Page {data?.page ?? page}</p>
      </div>

      {success ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 lg:grid-cols-3"
      >
        <input
          value={form.sender}
          onChange={(event) => setForm((prev) => ({ ...prev, sender: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="Expediteur (email ou nom)"
          required
        />
        <input
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm lg:col-span-2"
          placeholder="Objet"
          required
        />
        <input
          type="datetime-local"
          value={form.receivedAt}
          onChange={(event) => setForm((prev) => ({ ...prev, receivedAt: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          required
        />
        <select
          value={form.category}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, category: event.target.value as EmailCategoryApi }))
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {categoryOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={form.status ?? "A_TRAITER"}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, status: event.target.value as EmailStatusApi }))
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
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm lg:col-span-2"
        >
          <option value="">Sans patient lie</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.fullName}
            </option>
          ))}
        </select>
        <textarea
          value={form.comment ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm lg:col-span-3"
          rows={2}
          placeholder="Commentaire interne"
        />
        <div className="flex flex-wrap items-center gap-2 lg:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {editingEmailId ? "Enregistrer les modifications" : "Enregistrer un email"}
          </button>
          {editingEmailId ? (
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

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement des emails...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <div className="mt-4 space-y-3">
            {data.items.map((email) => (
              <article key={email.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                    <span className="block truncate">{email.subject}</span>
                    {email.comment ? (
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">{email.comment}</span>
                    ) : null}
                  </p>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${emailCategoryStyles[email.category]}`}
                    >
                      {email.category}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${emailStatusStyles[email.status]}`}
                    >
                      {email.status}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  <span className="inline-block max-w-full truncate align-bottom">De: {email.from}</span>
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Recu le {email.receivedDate} a {email.receivedAt}
                  {email.patientName ? (
                    <span className="ml-2 text-slate-500">— Patient: {email.patientName}</span>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 text-slate-600">
                    <span>Statut</span>
                    <select
                      value={statusOptions.find((o) => o.label === email.status)?.value ?? "A_TRAITER"}
                      onChange={(event) =>
                        quickStatusUpdate(email.id, event.target.value as EmailStatusApi)
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1"
                    >
                      {statusOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1 text-slate-600">
                    <span>Assignee</span>
                    <select
                      value={email.assigneeId ?? ""}
                      onChange={(event) => quickAssignUpdate(email.id, event.target.value || null)}
                      className="max-w-[10rem] rounded-md border border-slate-200 bg-white px-2 py-1"
                    >
                      <option value="">Non assignee</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => startEdit(email)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(email.id)}
                    className="rounded border border-red-200 bg-white px-2 py-1 text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
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
