"use client";

import { AlertCircle, CreditCard, Mail, Stethoscope } from "lucide-react";
import Link from "next/link";
import type { DashboardKpis } from "@/lib/dashboard-ui";
import { MiniSparkline } from "@/components/dashboard/mini-sparkline";

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
      className="group relative flex h-[150px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-slate-300/90 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-[13px] font-medium leading-snug text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums leading-none">{value}</p>
          <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug text-slate-500">{subtitle}</p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent} text-white shadow-sm ring-2 ring-white/50`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.65} aria-hidden />
        </span>
      </div>
      <MiniSparkline
        seedKey={sparkKey}
        variant="kpi"
        className="pointer-events-none absolute bottom-4 right-5 h-9 w-[7.5rem] text-slate-400 opacity-80 transition group-hover:text-slate-500 group-hover:opacity-100"
      />
    </Link>
  );
}

export function DashboardKpiRow({ kpis }: { kpis: DashboardKpis }) {
  return (
    <section className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        title="Rappels à envoyer"
        value={kpis.reminders.count}
        subtitle={
          kpis.reminders.totalEur > 0
            ? `${formatEur(kpis.reminders.totalEur)} EUR concernés`
            : "Relances à planifier"
        }
        href="/reglements"
        icon={AlertCircle}
        accent="bg-gradient-to-br from-amber-400 to-orange-500"
        sparkKey="reminders"
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
      <KpiCard
        title="Emails non traités"
        value={kpis.emails.count}
        subtitle={kpis.emails.urgent > 0 ? `${kpis.emails.urgent} urgents` : "Boîte à jour"}
        href="/emails"
        icon={Mail}
        accent="bg-gradient-to-br from-violet-400 to-indigo-600"
        sparkKey="emails"
      />
    </section>
  );
}
