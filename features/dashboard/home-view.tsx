"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-row";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { PresenceTeamWidget } from "@/features/dashboard/presence-team-widget";
import { computeDashboardKpis } from "@/lib/dashboard-ui";
import type { DashboardSummaryResponse } from "@/types/domain";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-slate-200/60" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-slate-200/50" />
    </div>
  );
}

export function HomeView({
  showPresenceTeam,
  greetingName,
  currentDateLabel,
}: {
  showPresenceTeam: boolean;
  greetingName: string;
  currentDateLabel: string;
}) {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/summary", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Échec de chargement du dashboard");
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

  const kpis = useMemo(() => (data ? computeDashboardKpis(data) : null), [data]);

  return (
    <div className="space-y-8">
      <DashboardPageHeader greetingName={greetingName} currentDateLabel={currentDateLabel} />

      {loading ? <DashboardSkeleton /> : null}

      {error ? (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200/90 bg-rose-50/90 px-5 py-4 text-sm text-rose-900 shadow-sm"
        >
          Impossible de charger le dashboard : {error}
        </section>
      ) : null}

      {data && kpis ? (
        <div className="animate-dashboard-in space-y-8">
          {showPresenceTeam ? <PresenceTeamWidget /> : null}
          <DashboardKpiRow kpis={kpis} />
          <DashboardWidgets
            payments={data.payments}
            emails={data.emails}
            tasks={data.tasks}
            patientsSummary={data.patientsSummary}
          />
        </div>
      ) : null}
    </div>
  );
}
