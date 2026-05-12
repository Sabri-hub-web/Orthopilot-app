import Link from "next/link";
import { DashboardPatientsSummary, InternalTask, PaymentFollowUp, PriorityEmail } from "@/types/domain";

interface DashboardWidgetsProps {
  payments: PaymentFollowUp[];
  emails: PriorityEmail[];
  tasks: InternalTask[];
  patientsSummary: DashboardPatientsSummary;
}

function SectionCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 h-[calc(100%-32px)]">{children}</div>
    </Link>
  );
}

const emailCategoryStyles = {
  Urgent: "bg-red-50 text-red-700 border-red-100",
  Administratif: "bg-orange-50 text-orange-700 border-orange-100",
  "Suivi clinique": "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const emailStatusStyles = {
  "A traiter": "bg-amber-50 text-amber-900 border-amber-100",
  "En cours": "bg-blue-50 text-blue-800 border-blue-100",
  Traite: "bg-slate-100 text-slate-600 border-slate-200",
  Archive: "bg-slate-50 text-slate-500 border-slate-100",
};

const taskStatusStyles = {
  "A faire": "bg-orange-50 text-orange-700 border-orange-100",
  "En cours": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "En attente": "bg-slate-100 text-slate-700 border-slate-200",
  Terminee: "bg-blue-50 text-blue-700 border-blue-100",
};

export function DashboardWidgets({ payments, emails, tasks, patientsSummary }: DashboardWidgetsProps) {
  const visiblePayments = payments.slice(0, 4);
  const prioritizedEmails = [...emails].sort((a, b) => {
    if (a.category === "Urgent" && b.category !== "Urgent") return -1;
    if (a.category !== "Urgent" && b.category === "Urgent") return 1;
    return 0;
  });

  return (
    <div className="h-full min-h-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        <div className="flex flex-wrap gap-4 text-slate-700">
          <span>
            Patients: <strong className="text-slate-900">{patientsSummary.total}</strong>
          </span>
          <span>
            Suivi admin:{" "}
            <strong className="text-amber-800">{patientsSummary.attentionAdminCount}</strong>
          </span>
        </div>
        <Link href="/patients" className="text-xs font-medium text-emerald-700 hover:underline">
          Hub patients
        </Link>
      </div>
      <div className="min-h-0 gap-4 lg:grid lg:grid-cols-2">
      <div className="min-h-0 space-y-4 lg:grid lg:grid-rows-2 lg:space-y-0 lg:gap-4">
        <SectionCard title="Taches a faire / en cours" href="/tasks">
          <div className="max-h-52 overflow-y-auto overflow-x-auto pr-1">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Tache</th>
                  <th className="pb-2 font-medium">Responsable</th>
                  <th className="pb-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-t border-slate-100">
                    <td className="max-w-52 py-2 text-slate-800">
                      <span className="block truncate">{task.title}</span>
                    </td>
                    <td className="py-2 text-slate-700">{task.assignee}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${taskStatusStyles[task.status]}`}
                      >
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Emails prioritaires (urgent d'abord)" href="/emails">
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {prioritizedEmails.map((email) => (
              <article
                key={email.id}
                className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-medium text-slate-900">
                    <span className="block truncate">{email.subject}</span>
                  </p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${emailCategoryStyles[email.category]}`}
                    >
                      {email.category}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${emailStatusStyles[email.status]}`}
                    >
                      {email.status}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  <span className="inline-block max-w-64 truncate align-bottom">De: {email.from}</span>
                  <span className="mt-0.5 block truncate text-slate-500">Responsable: {email.assignee}</span>
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Recu le {email.receivedDate} a {email.receivedAt}
                </p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 min-h-0 lg:mt-0">
        <SectionCard title="Suivi des reglements" href="/reglements">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Patient</th>
                  <th className="pb-2 font-medium">Montant</th>
                  <th className="pb-2 font-medium">Echeance</th>
                  <th className="pb-2 font-medium">Retard</th>
                  <th className="pb-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {visiblePayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-slate-100">
                    <td className="py-2 text-slate-800">{payment.patientName}</td>
                    <td className="py-2 font-medium text-slate-900">{payment.amountDue} EUR</td>
                    <td className="py-2 text-slate-700">{payment.dueDate}</td>
                    <td className="py-2 text-red-600">{payment.daysLate} jours</td>
                    <td className="py-2 text-slate-600">{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
      </div>
    </div>
  );
}
