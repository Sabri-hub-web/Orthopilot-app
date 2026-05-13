import Link from "next/link";
import { computePaymentDistribution } from "@/lib/dashboard-ui";
import { DashboardQuickAccess } from "@/components/dashboard/dashboard-quick-access";
import { DashboardTeamPresence } from "@/components/dashboard/dashboard-team-presence";
import { PaymentsDonut } from "@/components/dashboard/payments-donut";
import type { InternalTask, PaymentFollowUp, PriorityEmail } from "@/types/domain";

interface DashboardWidgetsProps {
  payments: PaymentFollowUp[];
  emails: PriorityEmail[];
  tasks: InternalTask[];
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
      className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <h3 className="text-[13px] font-semibold tracking-tight text-slate-900">{title}</h3>
        <Link
          href={href}
          className="text-[11px] font-semibold text-sky-600 transition hover:text-sky-700"
        >
          Voir tout
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-2.5 py-1.5">{children}</div>
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

function isLatePayment(p: PaymentFollowUp) {
  if (p.status === "Regle") return false;
  return p.daysLate > 0 || p.status === "En retard";
}

function EmptyHint({ message }: { message: string }) {
  return (
    <p className="flex h-full min-h-[3rem] items-center justify-center px-2 text-center text-[11px] leading-snug text-slate-500">
      {message}
    </p>
  );
}

export function DashboardWidgets({ payments, emails, tasks }: DashboardWidgetsProps) {
  const latePayments = payments.filter(isLatePayment).slice(0, 5);

  const openTasks = tasks.filter((t) =>
    ["A faire", "En cours", "En attente"].includes(t.status),
  );
  const topTasks = openTasks.slice(0, 5);

  const prioritizedEmails = [...emails].sort((a, b) => {
    if (a.category === "Urgent" && b.category !== "Urgent") return -1;
    if (a.category !== "Urgent" && b.category === "Urgent") return 1;
    return 0;
  });
  const openEmails = prioritizedEmails.filter((e) => ["A traiter", "En cours"].includes(e.status));
  const topEmails = openEmails.slice(0, 5);

  const distribution = computePaymentDistribution(payments);
  const distributionTotal = distribution.reduce((s, x) => s + x.amount, 0);

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,3.15fr)_minmax(0,2.55fr)] gap-1.5 overflow-hidden lg:gap-2">
      {/* Milieu : 3 colonnes — règlements en retard | tâches | emails */}
      <div className="grid min-h-0 grid-cols-1 gap-1.5 overflow-hidden lg:grid-cols-3 lg:gap-2">
        <SectionPanel title="Règlements en retard" href="/reglements" className="min-h-0">
          {latePayments.length ? (
            <ul className="flex h-full min-h-0 flex-col justify-start gap-1 overflow-hidden">
              {latePayments.map((payment) => (
                <li
                  key={payment.id}
                  className="shrink-0 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/patients/${payment.patientId}`}
                        className="line-clamp-1 text-[11px] font-semibold text-sky-700 hover:underline"
                      >
                        {payment.patientName}
                      </Link>
                      <p className="mt-0.5 text-[10px] tabular-nums text-slate-600">
                        <span className="font-semibold text-slate-900">{payment.amountDue}</span> EUR · éch.{" "}
                        {payment.dueDate.slice(5)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-rose-50 px-1 py-0.5 text-[9px] font-semibold tabular-nums text-rose-700 ring-1 ring-rose-100">
                      {payment.daysLate > 0 ? `+${payment.daysLate}j` : "Retard"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="truncate text-[9px] text-slate-500">{payment.status}</span>
                    <Link
                      href="/reglements"
                      className="shrink-0 rounded border border-slate-200 bg-white px-1.5 py-px text-[9px] font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                    >
                      Relancer
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint message="Aucun règlement en retard. Bonne nouvelle." />
          )}
        </SectionPanel>

        <SectionPanel title="Tâches à traiter" href="/tasks" className="min-h-0">
          {topTasks.length ? (
            <ul className="flex h-full min-h-0 flex-col gap-1 overflow-hidden">
              {topTasks.map((task) => (
                <li
                  key={task.id}
                  className="shrink-0 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="min-w-0 flex-1 line-clamp-2 text-[11px] font-medium leading-snug text-slate-900">
                      {task.title}
                    </p>
                    <span
                      className={`shrink-0 rounded px-1 py-px text-[8px] font-semibold capitalize leading-none ring-1 ${taskPriorityStyles[task.priority] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] text-slate-500">
                    <span className="truncate">{task.assignee}</span>
                    <span className="text-slate-300">·</span>
                    <span className="tabular-nums">{task.dueDate}</span>
                    <span
                      className={`ml-auto rounded px-1 py-px text-[8px] font-medium ring-1 ${taskStatusStyles[task.status]}`}
                    >
                      {task.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint message="Aucune tâche ouverte pour le moment." />
          )}
        </SectionPanel>

        <SectionPanel title="Emails non traités" href="/emails" className="min-h-0">
          {topEmails.length ? (
            <ul className="flex h-full min-h-0 flex-col gap-1 overflow-hidden">
              {topEmails.map((email) => (
                <li
                  key={email.id}
                  className="shrink-0 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5"
                >
                  <p className="line-clamp-1 text-[11px] font-medium text-slate-900">{email.subject}</p>
                  <p className="mt-0.5 truncate text-[9px] text-slate-500">
                    {email.from} · {email.assignee}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
                    <span
                      className={`rounded px-1 py-px text-[8px] font-semibold ring-1 ${emailCategoryStyles[email.category]}`}
                    >
                      {email.category}
                    </span>
                    <span
                      className={`rounded px-1 py-px text-[8px] font-medium ring-1 ${emailStatusStyles[email.status]}`}
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
          ) : (
            <EmptyHint message="Aucun email en attente de traitement." />
          )}
        </SectionPanel>
      </div>

      {/* Bas : présence équipe | donut | accès rapides */}
      <div className="grid min-h-0 grid-cols-1 gap-1.5 overflow-hidden lg:grid-cols-3 lg:gap-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2">
            <h3 className="text-[13px] font-semibold tracking-tight text-slate-900">Présence équipe</h3>
            <Link href="/settings" className="text-[11px] font-semibold text-sky-600 hover:text-sky-700">
              Voir tout
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <DashboardTeamPresence />
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2">
            <h3 className="text-[13px] font-semibold tracking-tight text-slate-900">Répartition règlements</h3>
            <Link href="/reglements" className="text-[11px] font-semibold text-sky-600 hover:text-sky-700">
              Voir tout
            </Link>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-1.5 py-0.5">
            <PaymentsDonut compact slices={distribution} total={distributionTotal} />
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="shrink-0 border-b border-slate-100 px-3 py-2">
            <h3 className="text-[13px] font-semibold tracking-tight text-slate-900">Accès rapides</h3>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-1.5">
            <DashboardQuickAccess compact />
          </div>
        </section>
      </div>
    </div>
  );
}
