"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import type { PatientFormPayload, PatientListItem, PatientsListResponse } from "@/types/domain";

const PAGE_SIZE = 10;

const defaultCreate: PatientFormPayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  legalGuardian: "",
  mutuelle: "",
};

export function PatientsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<PatientsListResponse | null>(null);
  const [createForm, setCreateForm] = useState<PatientFormPayload>(defaultCreate);
  const [hasMutuelle, setHasMutuelle] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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
      sort: "name_asc",
    });
    if (debouncedSearch) qs.set("search", debouncedSearch);

    const response = await fetch(`/api/patients?${qs.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Echec du chargement des patients.");
    const payload: PatientsListResponse = await response.json();
    setData(payload);
  }, [page, debouncedSearch]);

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

  async function fetchAllPatients(): Promise<PatientListItem[]> {
    const all: PatientListItem[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const qs = new URLSearchParams({
        page: String(currentPage),
        pageSize: "50",
        sort: "name_asc",
      });
      if (debouncedSearch) qs.set("search", debouncedSearch);
      const response = await fetch(`/api/patients?${qs.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Échec de l’export des patients.");
      const payload: PatientsListResponse = await response.json();
      all.push(...payload.items);
      totalPages = payload.totalPages;
      currentPage += 1;
    } while (currentPage <= totalPages);
    return all;
  }

  async function handleExport() {
    try {
      setExporting(true);
      setError(null);
      const patients = await fetchAllPatients();
      const header = [
        "Nom",
        "Prénom",
        "Email",
        "Téléphone",
        "Mutuelle",
        "Nom de la mutuelle",
        "Responsable légal",
        "Statut",
      ];
      const lines = patients.map((p) =>
        [
          p.lastName,
          p.firstName,
          p.email ?? "",
          p.phone ?? "",
          p.mutuelle ? "Oui" : "Non",
          p.mutuelle ?? "",
          p.legalGuardian ?? "",
          p.hubStatus,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(";"),
      );
      const csv = `\uFEFF${[header.join(";"), ...lines].join("\r\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patients_orthopilot_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`Export prêt : ${patients.length} patient(s).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur export.");
    } finally {
      setExporting(false);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    try {
      setCreating(true);
      setSuccess(null);
      setError(null);
      const mutuelleName = (createForm.mutuelle ?? "").trim();
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email === "" ? null : createForm.email,
          phone: createForm.phone === "" ? null : createForm.phone,
          legalGuardian:
            createForm.legalGuardian === "" || createForm.legalGuardian == null
              ? null
              : createForm.legalGuardian,
          mutuelle: hasMutuelle && mutuelleName ? mutuelleName : null,
        }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      setCreateForm(defaultCreate);
      setHasMutuelle(false);
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
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              {exporting ? "Export…" : "Exporter"}
            </span>
          </button>
        </div>
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
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {patient.hubStatus}
                </span>
                <Link
                  href={`/patients/${patient.id}`}
                  prefetch
                  className="ml-auto rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white"
                >
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

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Nouveau patient</h4>
              <button type="button" onClick={() => setCreateOpen(false)} className="text-xs text-slate-500">
                Fermer
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
              <input
                value={createForm.firstName}
                onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Prénom"
                required
              />
              <input
                value={createForm.lastName}
                onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Nom"
                required
              />
              <input
                value={createForm.email ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Email"
              />
              <input
                value={createForm.phone ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Téléphone"
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 md:col-span-2">
                <p className="text-xs font-medium text-slate-700">Mutuelle</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-700">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasMutuelle}
                      onChange={(e) => {
                        setHasMutuelle(e.target.checked);
                        if (!e.target.checked) setCreateForm((f) => ({ ...f, mutuelle: "" }));
                      }}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    Oui
                  </label>
                  <span className="text-xs text-slate-500">
                    {hasMutuelle ? "Indiquez le nom de la mutuelle ci-dessous." : "Non — aucune mutuelle renseignée."}
                  </span>
                </div>
                {hasMutuelle ? (
                  <input
                    value={createForm.mutuelle ?? ""}
                    onChange={(e) => setCreateForm((f) => ({ ...f, mutuelle: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="Nom de la mutuelle"
                  />
                ) : null}
              </div>

              <input
                value={createForm.legalGuardian ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, legalGuardian: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Responsable légal (optionnel)"
              />

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
