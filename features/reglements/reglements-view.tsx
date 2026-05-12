"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  PatientListItem,
  ReglementFormPayload,
  ReglementStatusApi,
  ReglementsListResponse,
} from "@/types/domain";
import { REGLEMENT_STATUS_VALUES, reglementStatusLabelMap } from "@/lib/reglements";

const PAGE_SIZE = 8;

const statusOptions = REGLEMENT_STATUS_VALUES.map((value) => ({
  value,
  label: reglementStatusLabelMap[value],
}));

const reglementStatusStyles: Record<
  (typeof statusOptions)[number]["label"],
  string
> = {
  "En attente": "bg-slate-100 text-slate-700 border-slate-200",
  "En retard": "bg-red-50 text-red-700 border-red-100",
  "Relance envoyee": "bg-orange-50 text-orange-700 border-orange-100",
  Partiel: "bg-amber-50 text-amber-800 border-amber-100",
  Regle: "bg-emerald-50 text-emerald-800 border-emerald-100",
};

const defaultForm: ReglementFormPayload = {
  patientId: "",
  amountDue: 0,
  dueDate: "",
  status: "EN_ATTENTE",
  comment: "",
};

function formatRelanceDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function ReglementsView() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReglementsListResponse | null>(null);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [editingReglementId, setEditingReglementId] = useState<string | null>(null);
  const [form, setForm] = useState<ReglementFormPayload>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadReglements = useCallback(async () => {
    const response = await fetch(`/api/reglements?page=${page}&pageSize=${PAGE_SIZE}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Echec du chargement des reglements.");
    const payload: ReglementsListResponse = await response.json();
    setData(payload);
  }, [page]);

  useEffect(() => {
    async function loadReglementsData() {
      try {
        setLoading(true);
        await loadReglements();
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadReglementsData();
  }, [loadReglements]);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("/api/patients?page=1&pageSize=50", { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        setPatients(payload.items ?? []);
      } catch {
        // formulaire reste utilisable sans liste patients
      }
    }

    loadPatients();
  }, []);

  function resetForm() {
    setEditingReglementId(null);
    setForm(defaultForm);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setSuccess(null);
      setError(null);
      const url = editingReglementId ? `/api/reglements/${editingReglementId}` : "/api/reglements";
      const method = editingReglementId ? "PATCH" : "POST";
      const body = {
        patientId: form.patientId,
        amountDue: form.amountDue,
        dueDate: form.dueDate,
        status: form.status,
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

      await loadReglements();
      resetForm();
      setSuccess(editingReglementId ? "Reglement mis a jour." : "Reglement cree.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(reglementId: string) {
    if (!window.confirm("Supprimer ce reglement ? Cette action est definitive.")) return;
    try {
      setError(null);
      const response = await fetch(`/api/reglements/${reglementId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadReglements();
      if (editingReglementId === reglementId) resetForm();
      setSuccess("Reglement supprime.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  function startEdit(item: ReglementsListResponse["items"][number]) {
    const statusValue =
      statusOptions.find((option) => option.label === item.status)?.value ?? ("EN_ATTENTE" as ReglementStatusApi);
    setEditingReglementId(item.id);
    setForm({
      patientId: item.patientId,
      amountDue: item.amountDue,
      dueDate: item.dueDate,
      status: statusValue,
      comment: item.comment ?? "",
    });
  }

  async function quickStatusUpdate(reglementId: string, status: ReglementStatusApi) {
    try {
      setError(null);
      const response = await fetch(`/api/reglements/${reglementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadReglements();
      setSuccess("Statut mis a jour.");
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  async function handleRelance(reglementId: string) {
    try {
      setError(null);
      const response = await fetch(`/api/reglements/${reglementId}/relance`, { method: "POST" });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadReglements();
      setSuccess("Relance enregistree.");
    } catch (relanceError) {
      const message = relanceError instanceof Error ? relanceError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  const canGoPrev = page > 1;
  const canGoNext = data ? page < data.totalPages : false;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Suivi des reglements</h3>
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
        <select
          value={form.patientId}
          onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          required
        >
          <option value="" disabled>
            Patient
          </option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.fullName}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={form.amountDue || ""}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, amountDue: Number.parseFloat(event.target.value) || 0 }))
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          placeholder="Montant (EUR)"
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
          value={form.status}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, status: event.target.value as ReglementStatusApi }))
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          {statusOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <textarea
          value={form.comment ?? ""}
          onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm lg:col-span-2"
          rows={2}
          placeholder="Commentaire interne"
        />
        <div className="flex flex-wrap items-center gap-2 lg:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {editingReglementId ? "Enregistrer les modifications" : "Nouveau reglement"}
          </button>
          {editingReglementId ? (
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

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement des reglements...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Montant</th>
                  <th className="pb-2 font-medium">Echeance</th>
                  <th className="pb-2 font-medium">Retard</th>
                  <th className="pb-2 font-medium">Relances</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="max-w-48 py-2 text-slate-800">
                      <span className="block truncate">{item.patientName}</span>
                      {item.comment ? (
                        <span className="mt-0.5 block truncate text-xs text-slate-500" title={item.comment}>
                          {item.comment}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 font-medium text-slate-900">{item.amountDue} EUR</td>
                    <td className="py-2 text-slate-700">{item.dueDate}</td>
                    <td className={`py-2 ${item.daysLate > 0 ? "text-red-600" : "text-slate-500"}`}>
                      {item.daysLate > 0 ? `${item.daysLate} j.` : "—"}
                    </td>
                    <td className="py-2 text-slate-700">
                      <span className="font-medium">{item.relanceCount}</span>
                      {item.lastRelanceAt ? (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {formatRelanceDate(item.lastRelanceAt)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2">
                      <select
                        value={statusOptions.find((option) => option.label === item.status)?.value ?? "EN_ATTENTE"}
                        onChange={(event) =>
                          quickStatusUpdate(item.id, event.target.value as ReglementStatusApi)
                        }
                        className="max-w-[9.5rem] rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRelance(item.id)}
                          disabled={item.status === "Regle"}
                          className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Relance
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                        >
                          Supprimer
                        </button>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${reglementStatusStyles[item.status]}`}
                        >
                          {item.status}
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
