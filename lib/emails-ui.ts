import type { PriorityEmail } from "@/types/domain";

/** Hauteur topbar compacte — alignée avec Messages */
export const EMAILS_TOPBAR_PX = 52;

export type EmailFilterTab =
  | "all"
  | "untreated"
  | "urgent"
  | "devis"
  | "documents"
  | "rdv"
  | "mutuelle"
  | "administratif"
  | "treated";

export const EMAIL_FILTER_TABS: { id: EmailFilterTab; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "untreated", label: "Non traités" },
  { id: "urgent", label: "Urgents" },
  { id: "devis", label: "Devis" },
  { id: "documents", label: "Documents" },
  { id: "rdv", label: "RDV" },
  { id: "mutuelle", label: "Mutuelle" },
  { id: "administratif", label: "Administratif" },
  { id: "treated", label: "Traités" },
];

export const emailFilterBadgeClass: Record<EmailFilterTab, string> = {
  all: "bg-violet-100 text-violet-700",
  untreated: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
  devis: "bg-orange-100 text-orange-700",
  documents: "bg-emerald-100 text-emerald-700",
  rdv: "bg-blue-100 text-blue-700",
  mutuelle: "bg-purple-100 text-purple-700",
  administratif: "bg-slate-100 text-slate-600",
  treated: "bg-emerald-100 text-emerald-700",
};

export type EmailAccentType = "urgent" | "devis" | "document" | "mutuelle" | "rdv" | "default";

export const emailAccentBarClass: Record<EmailAccentType, string> = {
  urgent: "bg-red-500",
  devis: "bg-orange-500",
  document: "bg-emerald-500",
  mutuelle: "bg-violet-500",
  rdv: "bg-blue-500",
  default: "bg-slate-300",
};

export const emailCategoryBadgeClass: Record<PriorityEmail["category"], string> = {
  Urgent: "bg-red-50 text-red-700 border-red-100",
  Administratif: "bg-orange-50 text-orange-700 border-orange-100",
  "Suivi clinique": "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export const emailStatusBadgeClass: Record<PriorityEmail["status"], string> = {
  "A traiter": "bg-amber-50 text-amber-900 border-amber-100",
  "En cours": "bg-blue-50 text-blue-800 border-blue-100",
  Traite: "bg-slate-100 text-slate-600 border-slate-200",
  Archive: "bg-slate-50 text-slate-500 border-slate-100",
};

function emailSearchText(email: PriorityEmail): string {
  return `${email.subject} ${email.comment ?? ""} ${email.bodyText ?? ""} ${email.snippet ?? ""} ${email.from} ${email.patientName ?? ""}`.toLowerCase();
}

export function getEmailAccentType(email: PriorityEmail): EmailAccentType {
  if (email.category === "Urgent") return "urgent";
  const text = emailSearchText(email);
  if (text.includes("devis")) return "devis";
  if (text.includes("mutuelle")) return "mutuelle";
  if (text.includes("rdv") || text.includes("rendez")) return "rdv";
  if (text.includes("document") || text.includes("pièce") || text.includes("piece")) return "document";
  if (email.category === "Suivi clinique") return "document";
  return "default";
}

export function matchesEmailFilter(email: PriorityEmail, tab: EmailFilterTab): boolean {
  const text = emailSearchText(email);
  switch (tab) {
    case "all":
      return true;
    case "untreated":
      return email.status === "A traiter" || email.status === "En cours";
    case "urgent":
      return email.category === "Urgent";
    case "devis":
      return text.includes("devis");
    case "documents":
      return text.includes("document") || text.includes("pièce") || text.includes("piece");
    case "rdv":
      return text.includes("rdv") || text.includes("rendez");
    case "mutuelle":
      return text.includes("mutuelle");
    case "administratif":
      return email.category === "Administratif";
    case "treated":
      return email.status === "Traite";
    default:
      return true;
  }
}

export function countEmailsForFilter(emails: PriorityEmail[], tab: EmailFilterTab): number {
  return emails.filter((e) => matchesEmailFilter(e, tab)).length;
}

export function initialsFromEmail(from: string): string {
  const namePart = from.includes("@") ? from.split("@")[0] ?? from : from;
  const words = namePart.replace(/[._-]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
  }
  return (namePart.slice(0, 2) || "?").toUpperCase();
}

export function displaySenderName(from: string): string {
  if (!from.includes("@")) return from;
  const local = from.split("@")[0] ?? from;
  return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatEmailListTime(receivedDate: string, receivedAt: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (receivedDate === today) return receivedAt;
  const d = new Date(`${receivedDate}T12:00:00`);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function emailPreviewText(email: PriorityEmail): string {
  if (email.snippet?.trim()) return email.snippet.trim();
  if (email.bodyText?.trim()) return email.bodyText.trim().slice(0, 120);
  if (email.comment?.trim()) return email.comment.trim();
  return email.subject;
}

export function isEmailTreated(email: PriorityEmail): boolean {
  return email.status === "Traite" || email.status === "Archive";
}

/** Résumé IA heuristique côté client (pas de backend IA) */
export function generateAiSummary(email: PriorityEmail): string {
  const parts: string[] = [];
  const text = emailSearchText(email);

  if (email.category === "Urgent") {
    parts.push("Demande urgente nécessitant une attention rapide");
  } else if (email.category === "Suivi clinique") {
    parts.push("Suivi clinique signalé par l'expéditeur");
  } else {
    parts.push("Demande administrative du cabinet");
  }

  if (text.includes("douleur") || text.includes("appareil")) {
    parts.push("avec mention d'une gêne ou douleur post-appareil");
  }
  if (text.includes("rdv") || text.includes("rendez")) {
    parts.push("et demande de rendez-vous");
  }
  if (text.includes("devis")) {
    parts.push("relatif à un devis");
  }
  if (text.includes("mutuelle")) {
    parts.push("concernant la mutuelle");
  }
  if (email.patientName) {
    parts.push(`pour le patient ${email.patientName}`);
  }

  const base = parts.join(", ").replace(/,\s*et /, " et ");
  return `${base.charAt(0).toUpperCase()}${base.slice(1)}.`;
}

export interface EmailHistoryEvent {
  id: string;
  label: string;
  detail?: string;
  tone: "violet" | "blue" | "emerald" | "slate";
}

export function buildEmailHistory(email: PriorityEmail): EmailHistoryEvent[] {
  const events: EmailHistoryEvent[] = [
    {
      id: "imported",
      label: "Email importé",
      detail: `${email.receivedDate} à ${email.receivedAt}`,
      tone: "slate",
    },
    {
      id: "categorized",
      label: "Catégorisé",
      detail: email.category,
      tone: "violet",
    },
  ];

  if (email.assignee && email.assignee !== "Non assignee") {
    events.push({
      id: "assigned",
      label: "Assigné",
      detail: email.assignee,
      tone: "blue",
    });
  }

  if (email.patientName) {
    events.push({
      id: "patient",
      label: "Patient lié",
      detail: email.patientName,
      tone: "emerald",
    });
  }

  events.push({
    id: "status",
    label: "Statut actuel",
    detail: email.status,
    tone: email.status === "Traite" ? "emerald" : "slate",
  });

  return events;
}

export function emailPriorityLabel(email: PriorityEmail): string {
  if (email.category === "Urgent") return "Haute";
  if (email.status === "A traiter") return "Normale";
  if (email.status === "En cours") return "En cours";
  return "Basse";
}
