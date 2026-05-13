import type { DashboardSummaryResponse, PaymentFollowUp, PriorityEmail } from "@/types/domain";

export interface DashboardKpis {
  latePayments: { count: number; totalEur: number };
  reminders: { count: number; totalEur: number };
  tasks: { count: number; urgent: number };
  emails: { count: number; urgent: number };
}

export interface PaymentDistributionSlice {
  status: string;
  amount: number;
  color: string;
}

export interface ActivityFeedItem {
  id: string;
  kind: "email" | "task" | "payment";
  title: string;
  subtitle: string;
  timeLabel: string;
  ts: number;
}

function parseEmailTimestamp(email: PriorityEmail): number {
  const time = email.receivedAt.length >= 5 ? email.receivedAt : `${email.receivedAt}:00`;
  const normalized = time.length === 5 ? `${time}:00` : time;
  return new Date(`${email.receivedDate}T${normalized}`).getTime();
}

export function computeDashboardKpis(data: DashboardSummaryResponse): DashboardKpis {
  const latePayments = data.payments.filter(
    (p) => p.daysLate > 0 && p.status !== "Regle",
  );
  const lateTotal = latePayments.reduce((sum, p) => sum + p.amountDue, 0);

  const reminders = data.payments.filter(
    (p) =>
      p.status !== "Regle" &&
      p.daysLate > 0 &&
      (p.relanceCount < 2 || !p.lastRelanceAt),
  );
  const remindersTotal = reminders.reduce((sum, p) => sum + p.amountDue, 0);

  const tasksActive = data.tasks.filter((t) => t.status === "A faire" || t.status === "En cours");
  const tasksUrgent = tasksActive.filter((t) => t.priority === "urgente").length;

  const emailsTodo = data.emails.filter(
    (e) => e.status === "A traiter" || e.status === "En cours",
  );
  const emailsUrgent = emailsTodo.filter((e) => e.category === "Urgent").length;

  return {
    latePayments: { count: latePayments.length, totalEur: lateTotal },
    reminders: { count: reminders.length, totalEur: remindersTotal },
    tasks: { count: tasksActive.length, urgent: tasksUrgent },
    emails: { count: emailsTodo.length, urgent: emailsUrgent },
  };
}

const STATUS_DONUT_COLORS: Record<string, string> = {
  Regle: "#22c55e",
  "En retard": "#f97316",
  Partiel: "#eab308",
  "En attente": "#94a3b8",
  "Relance envoyee": "#38bdf8",
};

export function computePaymentDistribution(
  payments: PaymentFollowUp[],
): PaymentDistributionSlice[] {
  const map = new Map<string, number>();
  for (const p of payments) {
    map.set(p.status, (map.get(p.status) ?? 0) + p.amountDue);
  }
  return [...map.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([status, amount]) => ({
      status,
      amount,
      color: STATUS_DONUT_COLORS[status] ?? "#64748b",
    }));
}

export function buildActivityFeed(data: DashboardSummaryResponse, limit = 8): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];

  for (const email of data.emails) {
    items.push({
      id: `email-${email.id}`,
      kind: "email",
      title: `Email — ${email.subject}`,
      subtitle: `De ${email.from} · ${email.assignee}`,
      timeLabel: `${email.receivedDate} · ${email.receivedAt}`,
      ts: parseEmailTimestamp(email),
    });
  }

  for (const task of data.tasks) {
    items.push({
      id: `task-${task.id}`,
      kind: "task",
      title:
        task.status === "Terminee"
          ? `Tâche terminée — ${task.title}`
          : `Tâche ${task.status.toLowerCase()} — ${task.title}`,
      subtitle: `${task.assignee}${task.patientName ? ` · ${task.patientName}` : ""}`,
      timeLabel: `Échéance ${task.dueDate}`,
      ts: new Date(task.dueDate).getTime(),
    });
  }

  for (const p of data.payments) {
    items.push({
      id: `pay-${p.id}`,
      kind: "payment",
      title: `Règlement — ${p.patientName}`,
      subtitle: `${p.amountDue} EUR · ${p.status}`,
      timeLabel: p.dueDate,
      ts: new Date(p.dueDate).getTime(),
    });
  }

  items.sort((a, b) => b.ts - a.ts);
  return items.slice(0, limit);
}

export function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
