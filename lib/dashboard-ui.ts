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

export type ActivityFeedKind = "email" | "task" | "payment" | "relance" | "patient";

export interface ActivityFeedItem {
  id: string;
  kind: ActivityFeedKind;
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

function formatTimeHm(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return "—";
}

function formatShortDate(dueDate: string): string {
  if (dueDate.length >= 10) {
    const [, m, day] = dueDate.split("-");
    if (m && day) return `${day}/${m}`;
  }
  return dueDate;
}

function emailTimeLabel(email: PriorityEmail): string {
  if (email.receivedAt.length >= 5 && email.receivedAt.includes(":")) {
    return email.receivedAt.slice(0, 5);
  }
  return formatShortDate(email.receivedDate);
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

const PAYE_COLOR = "#22c55e";
const RETARD_COLOR = "#f97316";
const PARTIEL_COLOR = "#eab308";
const AVENIR_COLOR = "#94a3b8";

/** Regroupe les statuts API en 4 segments : Payés, En retard, Partiels, À venir. */
export function computePaymentDistribution(
  payments: PaymentFollowUp[],
): PaymentDistributionSlice[] {
  let payes = 0;
  let retard = 0;
  let partiels = 0;
  let aVenir = 0;
  for (const p of payments) {
    const a = p.amountDue;
    if (p.status === "Regle") payes += a;
    else if (p.status === "En retard") retard += a;
    else if (p.status === "Partiel") partiels += a;
    else aVenir += a;
  }
  const out: PaymentDistributionSlice[] = [];
  if (payes > 0) out.push({ status: "Payés", amount: payes, color: PAYE_COLOR });
  if (retard > 0) out.push({ status: "En retard", amount: retard, color: RETARD_COLOR });
  if (partiels > 0) out.push({ status: "Partiels", amount: partiels, color: PARTIEL_COLOR });
  if (aVenir > 0) out.push({ status: "À venir", amount: aVenir, color: AVENIR_COLOR });
  return out;
}

export function buildActivityFeed(data: DashboardSummaryResponse, limit = 5): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];

  for (const email of data.emails) {
    const ts = parseEmailTimestamp(email);
    const timeLabel = emailTimeLabel(email);
    if (email.status === "Traite") {
      items.push({
        id: `email-trait-${email.id}`,
        kind: "email",
        title: `Email marqué comme traité : ${email.subject}`,
        subtitle: email.from,
        timeLabel,
        ts,
      });
    } else {
      items.push({
        id: `email-${email.id}`,
        kind: "email",
        title: `Email : ${email.subject}`,
        subtitle: email.from,
        timeLabel,
        ts,
      });
    }
  }

  for (const task of data.tasks) {
    const ts = new Date(task.dueDate).getTime() || 0;
    const timeLabel = formatShortDate(task.dueDate);
    if (task.status === "Terminee") {
      items.push({
        id: `task-done-${task.id}`,
        kind: "task",
        title: `Tâche terminée : ${task.title}`,
        subtitle: task.assignee,
        timeLabel,
        ts,
      });
    } else {
      items.push({
        id: `task-${task.id}`,
        kind: "task",
        title: `Tâche ${task.status.toLowerCase()} : ${task.title}`,
        subtitle: task.assignee,
        timeLabel,
        ts,
      });
    }
  }

  for (const p of data.payments) {
    const tsDue = new Date(p.dueDate).getTime() || 0;
    const tsRel = p.lastRelanceAt ? new Date(p.lastRelanceAt).getTime() : NaN;
    const hasRelance = (p.relanceCount ?? 0) > 0 && Boolean(p.lastRelanceAt);

    if (p.status === "Partiel") {
      items.push({
        id: `payp-${p.id}`,
        kind: "payment",
        title: `Règlement partiel reçu de ${p.patientName}`,
        subtitle: `${p.amountDue} EUR`,
        timeLabel: hasRelance && Number.isFinite(tsRel) ? formatTimeHm(p.lastRelanceAt) : formatShortDate(p.dueDate),
        ts: hasRelance && Number.isFinite(tsRel) ? tsRel : tsDue,
      });
      continue;
    }
    if (hasRelance && p.status !== "Regle") {
      items.push({
        id: `rel-${p.id}`,
        kind: "relance",
        title: `Relance envoyée à ${p.patientName}`,
        subtitle: `${p.relanceCount} relance(s)`,
        timeLabel: formatTimeHm(p.lastRelanceAt),
        ts: Number.isFinite(tsRel) ? tsRel : tsDue,
      });
      continue;
    }
    if (p.status === "Regle") {
      items.push({
        id: `payok-${p.id}`,
        kind: "payment",
        title: `Règlement reçu : ${p.patientName}`,
        subtitle: `${p.amountDue} EUR`,
        timeLabel: formatShortDate(p.dueDate),
        ts: tsDue,
      });
      continue;
    }
    if (p.status === "En retard" || p.daysLate > 0) {
      items.push({
        id: `paylate-${p.id}`,
        kind: "payment",
        title: `Échéance dépassée — ${p.patientName}`,
        subtitle: `${p.amountDue} EUR`,
        timeLabel: formatShortDate(p.dueDate),
        ts: tsDue,
      });
      continue;
    }
    items.push({
      id: `pay-${p.id}`,
      kind: "payment",
      title: `Règlement ${p.status.toLowerCase()} — ${p.patientName}`,
      subtitle: `${p.amountDue} EUR`,
      timeLabel: formatShortDate(p.dueDate),
      ts: tsDue,
    });
  }

  const { attentionAdminCount, total } = data.patientsSummary;
  if (attentionAdminCount > 0) {
    items.push({
      id: "patient-attention",
      kind: "patient",
      title:
        attentionAdminCount === 1
          ? "Dossier patient à contrôler (admin.)"
          : `${attentionAdminCount} dossiers à contrôler (admin.)`,
      subtitle: `${total} patients en base`,
      timeLabel: "—",
      ts: Date.now() - 3_600_000,
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
