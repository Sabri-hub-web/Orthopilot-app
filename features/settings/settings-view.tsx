"use client";

import { useEffect, useState } from "react";
import { SettingsOverviewResponse } from "@/types/domain";

const statusStyles = {
  Actif: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "En preparation": "bg-orange-50 text-orange-700 border-orange-100",
};

export function SettingsView() {
  const [data, setData] = useState<SettingsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) throw new Error("Echec du chargement des parametres.");
        const payload: SettingsOverviewResponse = await response.json();
        setData(payload);
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Parametres (lecture seule)</h3>

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement des parametres...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Application</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{data.appName}</p>
              <p className="mt-1 text-xs text-slate-600">v{data.appVersion}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Environnement</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{data.environment}</p>
              <p className="mt-1 text-xs text-slate-600">Base: {data.databaseProvider}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Patients</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{data.counts.patients}</p>
              <p className="mt-1 text-xs text-slate-600">enregistrements</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Activite</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{data.counts.logs}</p>
              <p className="mt-1 text-xs text-slate-600">logs traces</p>
            </article>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1.4fr_0.7fr_2fr] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <span>Module</span>
              <span>Etat</span>
              <span>Detail</span>
            </div>
            <div className="divide-y divide-slate-100">
              {data.modules.map((module) => (
                <div key={module.name} className="grid grid-cols-[1.4fr_0.7fr_2fr] items-center px-3 py-2.5 text-sm">
                  <span className="font-medium text-slate-900">{module.name}</span>
                  <span
                    className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[module.status]}`}
                  >
                    {module.status}
                  </span>
                  <span className="text-slate-600">{module.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
