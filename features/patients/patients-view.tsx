"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PatientListSort } from "@/lib/validation/patients";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import { PatientFormPayload, PatientsListResponse } from "@/types/domain";

const PAGE_SIZE = 10;

const defaultCreate: PatientFormPayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

type ListFilters = {
  rdvSoon: boolean;
  rdvSoonDays: number;
  noNextRdv: boolean;
  reglementRetard: boolean;
  reglementOrange: boolean;
  openTask: boolean;
  urgentEmail: boolean;
  missingEmail: boolean;
  missingPhone: boolean;
  hasMutuelle: boolean;
};

const defaultFilters: ListFilters = {
  rdvSoon: false,
  rdvSoonDays: 7,
  noNextRdv: false,
  reglementRetard: false,
  reglementOrange: false,
  openTask: false,
  urgentEmail: false,
  missingEmail: false,
  missingPhone: false,
  hasMutuelle: false,
};

export function PatientsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<ListFilters>(defaultFilters);
  const [sort, setSort] = useState<PatientListSort>("name_asc");
  const [data, setData] = useState<PatientsListResponse | null>(null);
  const [createForm, setCreateForm] = useState<PatientFormPayload>(defaultCreate);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadPatients = useCallback(async () => {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sort,
    });
    if (debouncedSearch) qs.set("search", debouncedSearch);
    if (filters.rdvSoon) {
      qs.set("rdvSoon", "true");
      qs.set("rdvSoonDays", String(filters.rdvSoonDays));
    }
    if (filters.noNextRdv) qs.set("noNextRdv", "true");
    if (filters.reglementRetard) qs.set("reglementRetard", "true");
    if (filters.reglementOrange) qs.set("reglementOrange", "true");
    if (filters.openTask) qs.set("openTask", "true");
    if (filters.urgentEmail) qs.set("urgentEmail", "true");
    if (filters.missingEmail) qs.set("missingEmail", "true");
    if (filters.missingPhone) qs.set("missingPhone", "true");
    if (filters.hasMutuelle) qs.set("hasMutuelle", "true");

    const response = await fetch(`/api/patients?${qs.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Echec du chargement des patients.");
    const payload: PatientsListResponse = await response.json();
    setData(payload);
  }, [page, debouncedSearch, filters, sort]);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadPatients();
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [loadPatients]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    try {
      setCreating(true);
      setSuccess(null);
      setError(null);
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email === "" ? null : createForm.email,
          phone: createForm.phone === "" ? null : createForm.phone,
        }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      setCreateForm(defaultCreate);
      await loadPatients();
      setSuccess("Patient cree avec succes.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setCreating(false);
    }
  }

  const canGoPrev = page > 1;
  const canGoNext = data ? page < data.totalPages : false;

  function patchFilters(patch: Partial<ListFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(defaultFilters);
    setSort("name_asc");
    setPage(1);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Patients</h3>
        <p className="text-xs text-slate-500">Page {data?.page ?? page}</p>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
      >
        <div className="flex min-w-[8rem] flex-1 flex-col gap-1">
          <label className="text-xs text-slate-500">Prenom</label>
          <input
            value={createForm.firstName}
            onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
            required
          />
        </div>
        <div className="flex min-w-[8rem] flex-1 flex-col gap-1">
          <label className="text-xs text-slate-500">Nom</label>
          <input
            value={createForm.lastName}
            onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
            required
          />
        </div>
        <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
          <label className="text-xs text-slate-500">Email</label>
          <input
            value={createForm.email ?? ""}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex min-w-[8rem] flex-1 flex-col gap-1">
          <label className="text-xs text-slate-500">Telephone</label>
          <input
            value={createForm.phone ?? ""}
            onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          Nouveau patient
        </button>
      </form>

      <div className="mt-4">
        <label className="block text-xs font-medium text-slate-600">Recherche (nom, prenom, email, tel.)</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Tapez pour filtrer..."
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">Filtres avances</p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-slate-600 underline decoration-slate-300 hover:text-slate-900"
          >
            Reinitialiser
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-slate-300"
              checked={filters.rdvSoon}
              onChange={(e) => patchFilters({ rdvSoon: e.target.checked })}
            />
            <span>
              RDV proche (delai&nbsp;:{" "}
              <input
                type="number"
                min={1}
                max={30}
                disabled={!filters.rdvSoon}
                value={filters.rdvSoonDays}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    rdvSoonDays: Math.min(30, Math.max(1, Number.parseInt(e.target.value, 10) || 7)),
                  }))
                }
                className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs disabled:opacity-50"
              />{" "}
              jours)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.noNextRdv}
              onChange={(e) => patchFilters({ noNextRdv: e.target.checked })}
            />
            Sans prochain RDV
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.reglementRetard}
              onChange={(e) => patchFilters({ reglementRetard: e.target.checked })}
            />
            Reglement en retard
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.reglementOrange}
              onChange={(e) => patchFilters({ reglementOrange: e.target.checked })}
            />
            Reglement a surveiller (partiel / relance)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.openTask}
              onChange={(e) => patchFilters({ openTask: e.target.checked })}
            />
            Tache ouverte liee
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.urgentEmail}
              onChange={(e) => patchFilters({ urgentEmail: e.target.checked })}
            />
            Email urgent lie
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.missingEmail}
              onChange={(e) => patchFilters({ missingEmail: e.target.checked })}
            />
            Sans email patient
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.missingPhone}
              onChange={(e) => patchFilters({ missingPhone: e.target.checked })}
            />
            Sans telephone patient
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={filters.hasMutuelle}
              onChange={(e) => patchFilters({ hasMutuelle: e.target.checked })}
            />
            Mutuelle renseignee
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Tri</label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as PatientListSort);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
          >
            <option value="name_asc">Nom (A → Z)</option>
            <option value="name_desc">Nom (Z → A)</option>
            <option value="next_rdv_asc">Prochain RDV (plus proche)</option>
            <option value="next_rdv_desc">Prochain RDV (plus eloigne)</option>
            <option value="created_desc">Creation (plus recent)</option>
            <option value="created_asc">Creation (plus ancien)</option>
          </select>
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement des patients...</p> : null}
      {success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Telephone</th>
                  <th className="pb-2 font-medium">Prochain RDV</th>
                  <th className="pb-2 font-medium">Statut hub</th>
                  <th className="pb-2 font-medium">Regl.</th>
                  <th className="pb-2 font-medium">Taches</th>
                  <th className="pb-2 font-medium">Emails</th>
                  <th className="pb-2 font-medium">Fiche</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((patient) => (
                  <tr key={patient.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium text-slate-900">{patient.fullName}</td>
                    <td className="py-2 text-slate-700">{patient.email ?? "-"}</td>
                    <td className="py-2 text-slate-700">{patient.phone ?? "-"}</td>
                    <td className="py-2 text-slate-700">{patient.nextAppointmentAt ?? "—"}</td>
                    <td className="py-2 text-slate-600">{patient.hubStatus}</td>
                    <td className="py-2 text-slate-700">{patient.reglementsCount}</td>
                    <td className="py-2 text-slate-700">{patient.tasksCount}</td>
                    <td className="py-2 text-slate-700">{patient.emailsCount}</td>
                    <td className="py-2">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="text-xs font-medium text-emerald-700 hover:underline"
                      >
                        Ouvrir
                      </Link>
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
