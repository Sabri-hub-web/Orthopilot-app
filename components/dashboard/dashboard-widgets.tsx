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
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5 transition hover:shadow-md">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
        <Link
          href={href}
          className="text-xs font-semibold text-sky-600 transition hover:text-sky-700"
        >
          Voir tout
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
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
  const visiblePayments = payments.slice(0, 5);
  const prioritizedEmails = [...emails].sort((a, b) => {
    if (a.category === "Urgent" && b.category !== "Urgent") return -1;
    if (a.category !== "Urgent" && b.category === "Urgent") return 1;
    return 0;
  });
  const topEmails = prioritizedEmails.slice(0, 5);
  const topTasks = tasks.slice(0, 6);

  const summaryPayload = { payments, emails, tasks, patientsSummary };
  const distribution = computePaymentDistribution(payments);
  const distributionTotal = distribution.reduce((s, x) => s + x.amount, 0);
  const activity = buildActivityFeed(summaryPayload, 8);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-slate-600">
          <span>
            Patients suivis :{" "}
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
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Hub patients
        </Link>
      </section>

      <div className="grid min-h-0 gap-5 xl:grid-cols-3">
        <div className="flex min-h-0 flex-col gap-5 xl:col-span-2">
          <div className="grid min-h-[280px] gap-5 lg:grid-cols-2">
            <SectionPanel title="Tâches à traiter" href="/tasks">
              <ul className="space-y-2">
                {topTasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:border-slate-200 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-900">
                        {task.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${taskPriorityStyles[task.priority] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{task.assignee}</span>
                      <span className="text-slate-300">·</span>
                      <span>Échéance {task.dueDate}</span>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${taskStatusStyles[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionPanel>

            <SectionPanel title="Emails non traités" href="/emails">
              <ul className="space-y-2">
                {topEmails.map((email) => (
                  <li
                    key={email.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:border-slate-200 hover:bg-white"
                  >
                    <p className="text-sm font-medium leading-snug text-slate-900">{email.subject}</p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {email.from} · {email.assignee}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${emailCategoryStyles[email.category]}`}
                      >
                        {email.category}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${emailStatusStyles[email.status]}`}
                      >
                        {email.status}
                      </span>
                      <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                        {email.receivedDate} {email.receivedAt}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionPanel>
          </div>

          <SectionPanel title="Suivi des règlements" href="/reglements">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3 font-medium">Patient</th>
                    <th className="pb-2 pr-3 font-medium">Montant</th>
                    <th className="pb-2 pr-3 font-medium">Échéance</th>
                    <th className="pb-2 pr-3 font-medium">Retard</th>
                    <th className="pb-2 pr-3 font-medium">Statut</th>
                    <th className="pb-2 text-right font-medium"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePayments.map((payment) => (
                    <tr key={payment.id} className="text-slate-700 transition hover:bg-slate-50/80">
                      <td className="py-2.5 pr-3 font-medium text-slate-900">
                        <Link
                          href={`/patients/${payment.patientId}`}
                          className="text-sky-700 hover:underline"
                        >
                          {payment.patientName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums font-semibold text-slate-900">
                        {payment.amountDue} EUR
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-slate-600">{payment.dueDate}</td>
                      <td className="py-2.5 pr-3">
                        {payment.daysLate > 0 ? (
                          <span className="font-medium text-rose-600">{payment.daysLate} j</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600">{payment.status}</td>
                      <td className="py-2.5 text-right">
                        <Link
                          href="/reglements"
                          className="inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
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
        </div>

        <div className="flex min-h-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">Répartition règlements</h3>
              <Link href="/reglements" className="text-xs font-semibold text-sky-600 hover:text-sky-700">
                Détails
              </Link>
            </div>
            <PaymentsDonut slices={distribution} total={distributionTotal} />
          </section>

          <section className="min-h-0 flex-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-slate-900">Activité récente</h3>
            </div>
            <DashboardActivityFeed items={activity} />
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">Accès rapides</h3>
        </div>
        <DashboardQuickAccess />
      </section>
    </div>
  );
}
