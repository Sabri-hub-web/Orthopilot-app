"use client";

import { useEffect, useState } from "react";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { PresenceTeamWidget } from "@/features/dashboard/presence-team-widget";
import { DashboardSummaryResponse } from "@/types/domain";

export function HomeView({ showPresenceTeam }: { showPresenceTeam: boolean }) {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/summary", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Echec de chargement du dashboard");
        }

        const payload: DashboardSummaryResponse = await response.json();
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

    loadDashboard();
  }, []);

  return (
    <>
      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Chargement des donnees dashboard...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          Impossible de charger le dashboard: {error}
        </section>
      ) : null}

      {data ? (
        <div className="space-y-4">
          {showPresenceTeam ? <PresenceTeamWidget /> : null}
          <DashboardWidgets
            payments={data.payments}
            emails={data.emails}
            tasks={data.tasks}
            patientsSummary={data.patientsSummary}
          />
        </div>
      ) : null}
    </>
  );
}
