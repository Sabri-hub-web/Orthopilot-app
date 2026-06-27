"use client";

import { CreditCard, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { computePaymentDistribution, type DashboardKpis } from "@/lib/dashboard-ui";
import { MiniSparkline } from "@/components/dashboard/mini-sparkline";
import { PaymentsDonut } from "@/components/dashboard/payments-donut";
import type { PaymentFollowUp } from "@/types/domain";

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

function KpiCard({
  title,
  value,
  subtitle,
  href,
  icon: Icon,
  accent,
  sparkKey,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  href: string;
  icon: typeof CreditCard;
  accent: string;
  sparkKey: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex h-[128px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-slate-300/90 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-[12px] font-medium leading-snug text-slate-600">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 tabular-nums leading-none">{value}</p>
          <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-500">{subtitle}</p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent} text-white shadow-sm ring-2 ring-white/50`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden />
        </span>
      </div>
      <MiniSparkline
        seedKey={sparkKey}
        variant="kpi"
        className="pointer-events-none absolute bottom-3 right-4 h-7 w-[6.75rem] text-slate-400 opacity-80 transition group-hover:text-slate-500 group-hover:opacity-100"
      />
    </Link>
  );
}

function KpiDonutCard({
  distribution,
  total,
}: {
  distribution: ReturnType<typeof computePaymentDistribution>;
  total: number;
}) {
  return (
    <Link
      href="/reglements"
      className="group flex h-[128px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-slate-300/90 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
    >
      <p className="shrink-0 text-[12px] font-medium leading-snug text-slate-600">Répartition règlements</p>
      <PaymentsDonut kpi slices={distribution} total={total} />
    </Link>
  );
}

export function DashboardKpiRow({
  kpis,
  payments,
}: {
  kpis: DashboardKpis;
  payments: PaymentFollowUp[];
}) {
  const distribution = useMemo(() => computePaymentDistribution(payments), [payments]);
  const distributionTotal = useMemo(
    () => distribution.reduce((sum, slice) => sum + slice.amount, 0),
    [distribution],
  );

  return (
    <section className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Règlements en retard"
        value={kpis.latePayments.count}
        subtitle={
          kpis.latePayments.totalEur > 0
            ? `${formatEur(kpis.latePayments.totalEur)} EUR cumulés`
            : "Aucun montant en retard"
        }
        href="/reglements"
        icon={CreditCard}
        accent="bg-gradient-to-br from-rose-400 to-red-500"
        sparkKey="late-payments"
      />
      <KpiCard
        title="Tâches en cours"
        value={kpis.tasks.count}
        subtitle={kpis.tasks.urgent > 0 ? `${kpis.tasks.urgent} urgentes` : "Priorité normale"}
        href="/tasks"
        icon={Stethoscope}
        accent="bg-gradient-to-br from-sky-400 to-blue-600"
        sparkKey="tasks"
      />
      <KpiDonutCard distribution={distribution} total={distributionTotal} />
    </section>
  );
}
