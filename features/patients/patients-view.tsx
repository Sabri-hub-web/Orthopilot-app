"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Filter, Plus, Upload } from "lucide-react";
import type { PatientListSort } from "@/lib/validation/patients";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import type { PatientCsvImportResponse, PatientFormPayload, PatientsListResponse } from "@/types/domain";

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

interface PatientsViewProps {
  canImportCsv?: boolean;
}

export function PatientsView({ canImportCsv = false }: PatientsViewProps) {
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
  const [importingCsv, setImportingCsv] = useState(false);
  const [importReport, setImportReport] = useState<PatientCsvImportResponse | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
        const message = fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [loadPatients]);

  async function handleImportCsv(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("csv") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError("Choisissez un fichier CSV.");
      return;
    }
    try {
      setImportingCsv(true);
      setError(null);
      setImportReport(null);
      setSuccess(null);
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/patients/import", { method: "POST", body });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      const report: PatientCsvImportResponse = await response.json();
      setImportReport(report);
      setSuccess(
        `Import terminé : ${report.created} créés, ${report.updated} mis à jour, ${report.skipped} ignorés, ${report.errors} erreurs.`,
      );
      await loadPatients();
      form.reset();
      setImportOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur import CSV.");
    } finally {
      setImportingCsv(false);
    }
  }

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
      setSuccess("Patient créé avec succès.");
      setCreateOpen(false);
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

  const quickChips = [
    {
      id: "all",
      label: "Tous",
      active:
        !filters.rdvSoon &&
        !filters.reglementRetard &&
        !filters.reglementOrange &&
        !filters.missingEmail &&
        !filters.missingPhone,
      count: data?.total ?? 0,
      onClick: () => resetFilters(),
    },
    {
      id: "admin",
      label: "Suivi admin",
      active: filters.reglementOrange,
      count: data?.items.filter((p) => p.hubStatus === "Suivi admin").length ?? 0,
      onClick: () => patchFilters({ reglementOrange: !filters.reglementOrange }),
    },
    {
      id: "rdv",
      label: "RDV proche",
      active: filters.rdvSoon,
      count: data?.items.filter((p) => Boolean(p.nextAppointmentAt)).length ?? 0,
      onClick: () => patchFilters({ rdvSoon: !filters.rdvSoon }),
    },
    {
      id: "retard",
      label: "Règlement en retard",
      active: filters.reglementRetard,
      count: data?.items.filter((p) => p.reglementsCount > 0).length ?? 0,
      onClick: () => patchFilters({ reglementRetard: !filters.reglementRetard }),
    },
    {
      id: "noemail",
      label: "Sans email",
      active: filters.missingEmail,
      count: data?.items.filter((p) => !p.email).length ?? 0,
      onClick: () => patchFilters({ missingEmail: !filters.missingEmail }),
    },
    {
      id: "nophone",
      label: "Sans téléphone",
      active: filters.missingPhone,
      count: data?.items.filter((p) => !p.phone).length ?? 0,
      onClick: () => patchFilters({ missingPhone: !filters.missingPhone }),
    },
  ];

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-[#0F172A]">Patients</h3>
          <p className="mt-0.5 text-sm text-slate-500">Recherchez et gérez les informations de vos patients.</p>
        </div>
        <p className="text-xs text-slate-500">Page {data?.page ?? page}</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300"
          placeholder="Rechercher un patient, email, téléphone…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-10 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-4 text-sm font-semibold text-white shadow-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Nouveau patient
            </span>
          </button>
          {canImportCsv ? (
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
            >
              <span className="inline-flex items-center gap-1.5">
                <Upload className="h-4 w-4" />
                Importer CSV
              </span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
          >
            <span className="inline-flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              Filtres
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {quickChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={chip.onClick}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
              chip.active
                ? "border-violet-200 bg-violet-50 text-violet-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {chip.label}
            <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px]">{chip.count}</span>
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-slate-500">Chargement des patients...</p> : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <div className="space-y-2">
            {data.items.map((patient) => (
              <article
                key={patient.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-violet-200 hover:bg-slate-50/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                  {`${patient.firstName[0] ?? ""}${patient.lastName[0] ?? ""}`.toUpperCase()}
                </span>
                <div className="min-w-[180px] flex-1">
                  <p className="text-sm font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="text-xs text-slate-500">{patient.email ?? "Email non renseigné"}</p>
                </div>
                <div className="min-w-[140px] text-xs text-slate-600">{patient.phone ?? "Téléphone non renseigné"}</div>
                <div className="min-w-[150px] text-xs text-slate-600">{patient.nextAppointmentAt ?? "Aucun RDV"}</div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {patient.hubStatus}
                </span>
                <div className="flex items-center gap-1">
                  <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Règl. {patient.reglementsCount}</span>
                  <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">Tâches {patient.tasksCount}</span>
                  <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">Emails {patient.emailsCount}</span>
                </div>
                <Link href={`/patients/${patient.id}`} className="ml-auto rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white">
                  Ouvrir
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {data.total} element(s) - page {data.page} / {data.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((prev) => prev - 1)} disabled={!canGoPrev} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Precedent</button>
              <button type="button" onClick={() => setPage((prev) => prev + 1)} disabled={!canGoNext} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Suivant</button>
            </div>
          </div>
        </>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Nouveau patient</h4>
              <button type="button" onClick={() => setCreateOpen(false)} className="text-xs text-slate-500">Fermer</button>
            </div>
            <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-2">
              <input value={createForm.firstName} onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Prénom" required />
              <input value={createForm.lastName} onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Nom" required />
              <input value={createForm.email ?? ""} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Email" />
              <input value={createForm.phone ?? ""} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Téléphone" />
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" disabled={creating} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">{creating ? "Création..." : "Créer"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {canImportCsv && importOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Importer CSV</h4>
              <button type="button" onClick={() => setImportOpen(false)} className="text-xs text-slate-500">Fermer</button>
            </div>
            <p className="mb-2 text-xs text-slate-600">
              En-têtes minimum : <code className="rounded bg-slate-100 px-1">firstName</code>, <code className="rounded bg-slate-100 px-1">lastName</code>.
            </p>
            <form onSubmit={handleImportCsv} className="flex flex-wrap items-end gap-2">
              <input name="csv" type="file" accept=".csv,text/csv" className="max-w-full text-xs text-slate-700 file:mr-2 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-2 file:py-1" />
              <button type="submit" disabled={importingCsv} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{importingCsv ? "Import..." : "Importer"}</button>
            </form>
            {importReport && importReport.lines.some((l) => l.status === "error" || l.status === "skipped") ? (
              <ul className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-600">
                {importReport.lines.filter((l) => l.status === "error" || l.status === "skipped").map((l) => (
                  <li key={`imp-${l.line}-${l.status}`}>Ligne {l.line} ({l.status}) {l.message ? `— ${l.message}` : ""}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      {filtersOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Filtres avancés</h4>
              <button type="button" onClick={() => setFiltersOpen(false)} className="text-xs text-slate-500">Fermer</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-700">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300" checked={filters.rdvSoon} onChange={(e) => patchFilters({ rdvSoon: e.target.checked })} />
                <span>
                  RDV proche (delai :{" "}
                  <input type="number" min={1} max={30} disabled={!filters.rdvSoon} value={filters.rdvSoonDays} onChange={(e) => setFilters((prev) => ({ ...prev, rdvSoonDays: Math.min(30, Math.max(1, Number.parseInt(e.target.value, 10) || 7)) }))} className="w-12 rounded border border-slate-200 px-1 py-0.5 text-xs disabled:opacity-50" />{" "}
                  jours)
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.noNextRdv} onChange={(e) => patchFilters({ noNextRdv: e.target.checked })} />Sans prochain RDV</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.reglementRetard} onChange={(e) => patchFilters({ reglementRetard: e.target.checked })} />Règlement en retard</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.reglementOrange} onChange={(e) => patchFilters({ reglementOrange: e.target.checked })} />Règlement à surveiller</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.openTask} onChange={(e) => patchFilters({ openTask: e.target.checked })} />Tâche ouverte liée</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.urgentEmail} onChange={(e) => patchFilters({ urgentEmail: e.target.checked })} />Email urgent lié</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.missingEmail} onChange={(e) => patchFilters({ missingEmail: e.target.checked })} />Sans email patient</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.missingPhone} onChange={(e) => patchFilters({ missingPhone: e.target.checked })} />Sans téléphone patient</label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="rounded border-slate-300" checked={filters.hasMutuelle} onChange={(e) => patchFilters({ hasMutuelle: e.target.checked })} />Mutuelle renseignée</label>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <button type="button" onClick={resetFilters} className="text-xs font-medium text-slate-600 underline decoration-slate-300 hover:text-slate-900">Réinitialiser</button>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">Tri</label>
                <select value={sort} onChange={(e) => { setSort(e.target.value as PatientListSort); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800">
                  <option value="name_asc">Nom (A → Z)</option>
                  <option value="name_desc">Nom (Z → A)</option>
                  <option value="next_rdv_asc">Prochain RDV (plus proche)</option>
                  <option value="next_rdv_desc">Prochain RDV (plus éloigné)</option>
                  <option value="created_desc">Création (plus récent)</option>
                  <option value="created_asc">Création (plus ancien)</option>
                </select>
                <button type="button" onClick={() => setFiltersOpen(false)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">Appliquer</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
