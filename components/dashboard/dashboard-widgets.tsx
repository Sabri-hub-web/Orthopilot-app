import Link from "next/link";
import {
  buildActivityFeed,
  computePaymentDistribution,
} from "@/lib/dashboard-ui";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardQuickAccess } from "@/components/dashboard/dashboard-quick-access";
import { PaymentsDonut } from "@/components/dashboard/payments-donut";
import type { DashboardPatientsSummary, InternalTask, PaymentFollowUp, PriorityEmail } from "@/types/domain";

interface DashboardWidgetsProps {
  payments: PaymentFollowUp[];
  emails: PriorityEmail[];
  tasks: InternalTask[];
  patientsSummary: DashboardPatientsSummary;
}

function SectionPanel({
  title,
  href,
  children,
  className = "",
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5 ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">{title}</h3>
        <Link
          href={href}
          className="text-[10px] font-semibold text-sky-600 transition hover:text-sky-700"
        >
          Voir tout
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-2.5 py-2">{children}</div>
    </section>
  );
}

const emailCategoryStyles = {
  Urgent: "bg-rose-50 text-rose-700 ring-rose-100/80",
  Administratif: "bg-orange-50 text-orange-800 ring-orange-100/80",
  "Suivi clinique": "bg-emerald-50 text-emerald-800 ring-emerald-100/80",
};

const emailStatusStyles = {
  "A traiter": "bg-amber-50 text-amber-900 ring-amber-100/80",
  "En cours": "bg-sky-50 text-sky-800 ring-sky-100/80",
  Traite: "bg-slate-100 text-slate-600 ring-slate-200/80",
  Archive: "bg-slate-50 text-slate-500 ring-slate-100/80",
};

const taskStatusStyles = {
  "A faire": "bg-orange-50 text-orange-800 ring-orange-100/80",
  "En cours": "bg-emerald-50 text-emerald-800 ring-emerald-100/80",
  "En attente": "bg-slate-50 text-slate-700 ring-slate-200/80",
  Terminee: "bg-sky-50 text-sky-800 ring-sky-100/80",
};

const taskPriorityStyles: Record<string, string> = {
  urgente: "bg-rose-50 text-rose-700 ring-rose-100/80",
  importante: "bg-orange-50 text-orange-800 ring-orange-100/80",
  normale: "bg-slate-50 text-slate-700 ring-slate-200/80",
  faible: "bg-sky-50 text-sky-800 ring-sky-100/80",
};

export function DashboardWidgets({ payments, emails, tasks, patientsSummary }: DashboardWidgetsProps) {
  const visiblePayments = payments.slice(0, 6);
  const prioritizedEmails = [...emails].sort((a, b) => {
    if (a.category === "Urgent" && b.category !== "Urgent") return -1;
    if (a.category !== "Urgent" && b.category === "Urgent") return 1;
    return 0;
  });
  const topEmails = prioritizedEmails.slice(0, 6);
  const topTasks = tasks.slice(0, 6);

  const summaryPayload = { payments, emails, tasks, patientsSummary };
  const distribution = computePaymentDistribution(payments);
  const distributionTotal = distribution.reduce((s, x) => s + x.amount, 0);
  const activity = buildActivityFeed(summaryPayload, 6);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden lg:gap-2">
      <section className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm shadow-slate-900/5">
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <span>
            Patients :{" "}
            <strong className="font-semibold text-slate-900 tabular-nums">{patientsSummary.total}</strong>
          </span>
          <span>
            Attention admin :{" "}
            <strong className="font-semibold text-amber-700 tabular-nums">
              {patientsSummary.attentionAdminCount}
            </strong>
          </span>
        </div>
        <Link
          href="/patients"
          className="inline-flex shrink-0 items-center rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Hub patients
        </Link>
      </section>

      {/* Milieu : 3 colonnes — règlements | tâches | emails */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 overflow-hidden lg:grid-cols-3 lg:gap-2">
        <SectionPanel title="Suivi des règlements" href="/reglements" className="min-h-0">
          <div className="h-full min-h-0 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[280px] text-left text-[11px] leading-tight">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="pb-1 pr-1 font-medium">Patient</th>
                  <th className="pb-1 pr-1 font-medium">Mont.</th>
                  <th className="pb-1 pr-1 font-medium">Éch.</th>
                  <th className="pb-1 pr-1 font-medium">Ret.</th>
                  <th className="pb-1 pr-1 font-medium max-w-[4rem] truncate">St.</th>
                  <th className="pb-1 text-right font-medium"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePayments.map((payment) => (
                  <tr key={payment.id} className="text-slate-700">
                    <td className="py-1 pr-1 font-medium text-slate-900">
                      <Link
                        href={`/patients/${payment.patientId}`}
                        className="line-clamp-1 text-sky-700 hover:underline"
                      >
                        {payment.patientName}
                      </Link>
                    </td>
                    <td className="py-1 pr-1 tabular-nums font-semibold text-slate-900">{payment.amountDue}</td>
                    <td className="py-1 pr-1 tabular-nums text-slate-600">{payment.dueDate.slice(5)}</td>
                    <td className="py-1 pr-1">
                      {payment.daysLate > 0 ? (
                        <span className="font-medium text-rose-600">{payment.daysLate}j</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="max-w-[3.5rem] truncate py-1 pr-1 text-slate-600" title={payment.status}>
                      {payment.status}
                    </td>
                    <td className="py-1 text-right">
                      <Link
                        href="/reglements"
                        className="inline-flex rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                      >
                        Relancer
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionPanel>

        <SectionPanel title="Tâches à traiter" href="/tasks" className="min-h-0">
          <ul className="flex min-h-0 flex-col gap-1 overflow-hidden">
            {topTasks.map((task) => (
              <li
                key={task.id}
                className="shrink-0 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-1.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="min-w-0 flex-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-900">
                    {task.title}
                  </p>
                  <span
                    className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold capitalize leading-none ring-1 ${taskPriorityStyles[task.priority] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] text-slate-500">
                  <span className="truncate">{task.assignee}</span>
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums">{task.dueDate}</span>
                  <span
                    className={`ml-auto rounded px-1 py-0.5 text-[8px] font-medium ring-1 ${taskStatusStyles[task.status]}`}
                  >
                    {task.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </SectionPanel>

        <SectionPanel title="Emails non traités" href="/emails" className="min-h-0">
          <ul className="flex min-h-0 flex-col gap-1 overflow-hidden">
            {topEmails.map((email) => (
              <li key={email.id} className="shrink-0 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-1.5">
                <p className="line-clamp-1 text-[11px] font-medium text-slate-900">{email.subject}</p>
                <p className="mt-0.5 truncate text-[9px] text-slate-500">
                  {email.from} · {email.assignee}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
                  <span
                    className={`rounded px-1 py-0.5 text-[8px] font-semibold ring-1 ${emailCategoryStyles[email.category]}`}
                  >
                    {email.category}
                  </span>
                  <span
                    className={`rounded px-1 py-0.5 text-[8px] font-medium ring-1 ${emailStatusStyles[email.status]}`}
                  >
                    {email.status}
                  </span>
                  <span className="ml-auto text-[9px] tabular-nums text-slate-400">
                    {email.receivedDate.slice(5)} {email.receivedAt}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </SectionPanel>
      </div>

      {/* Bas : activité | donut | accès rapides */}
      <div className="grid min-h-0 shrink-0 grid-cols-1 gap-1.5 overflow-hidden lg:h-[9.5rem] lg:grid-cols-3 lg:gap-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="shrink-0 border-b border-slate-100 px-3 py-1.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Activité récente</h3>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden px-1 py-1">
            <DashboardActivityFeed items={activity} compact />
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-1.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Répartition</h3>
            <Link href="/reglements" className="text-[10px] font-semibold text-sky-600 hover:text-sky-700">
              Détails
            </Link>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-1 py-0.5">
            <PaymentsDonut compact slices={distribution} total={distributionTotal} />
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <div className="shrink-0 border-b border-slate-100 px-3 py-1.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">Accès rapides</h3>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-1.5">
            <DashboardQuickAccess compact />
          </div>
        </section>
      </div>
    </div>
  );
}
