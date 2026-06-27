"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardKpiRow } from "@/components/dashboard/dashboard-kpi-row";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { computeDashboardKpis } from "@/lib/dashboard-ui";
import type { DashboardSummaryResponse } from "@/types/domain";

function DashboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden animate-pulse">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[128px] rounded-2xl bg-slate-200/60" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-2">
        <div className="rounded-2xl bg-slate-200/50" />
        <div className="rounded-2xl bg-slate-200/50" />
      </div>
    </div>
  );
}

export function HomeView({
  greetingName,
  currentDateLabel,
}: {
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
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-1.5 overflow-hidden px-0">
      <DashboardPageHeader greetingName={greetingName} currentDateLabel={currentDateLabel} />

      {loading ? <DashboardSkeleton /> : null}

      {error ? (
        <section
          role="alert"
          className="shrink-0 rounded-2xl border border-rose-200/90 bg-rose-50/90 px-3 py-2 text-xs text-rose-900 shadow-sm"
        >
          Impossible de charger le dashboard : {error}
        </section>
      ) : null}

      {data && kpis ? (
        <div className="animate-dashboard-in flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden lg:gap-2">
          <DashboardKpiRow kpis={kpis} payments={data.payments} />
          <DashboardWidgets payments={data.payments} tasks={data.tasks} />
        </div>
      ) : null}
    </div>
  );
}
