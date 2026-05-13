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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300/90 hover:shadow-md motion-reduce:transform-none"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-slate-600">{title}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent} text-white shadow-sm transition group-hover:scale-105 motion-reduce:transform-none`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
      <MiniSparkline
        seedKey={sparkKey}
        className="mt-4 h-9 w-full text-slate-400 transition group-hover:text-slate-500"
      />
    </Link>
  );
}

export function DashboardKpiRow({ kpis }: { kpis: DashboardKpis }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
