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

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

const URGENT_KEYWORDS = [
  "urgent",
  "urgence",
  "douleur",
  "probleme",
  "problème",
  "impaye",
  "impayé",
  "relance",
  "retard",
  "plainte",
];
const DEVIS_KEYWORDS = ["devis", "estimation", "proposition", "tarif", "prix"];
const DOCUMENTS_KEYWORDS = [
  "document",
  "fichier",
  "pièce jointe",
  "piece jointe",
  "pièce",
  "piece",
  "pdf",
  "facture",
  "radio",
  "compte rendu",
  "ordonnance",
];
const RDV_KEYWORDS = ["rdv", "rendez-vous", "rendez vous", "rendez", "doctolib", "consultation", "appointment"];
const MUTUELLE_KEYWORDS = ["mutuelle", "remboursement", "prise en charge", "assurance", "santéclair", "santeclair"];

export function isUrgentEmail(email: PriorityEmail): boolean {
  return email.category === "Urgent" || matchesAny(emailSearchText(email), URGENT_KEYWORDS);
}

export function matchesEmailFilter(email: PriorityEmail, tab: EmailFilterTab): boolean {
  const text = emailSearchText(email);
  switch (tab) {
    case "all":
      return true;
    case "untreated":
      return email.status === "A traiter" || email.status === "En cours";
    case "urgent":
      return isUrgentEmail(email);
    case "devis":
      return matchesAny(text, DEVIS_KEYWORDS);
    case "documents":
      return Boolean(email.hasAttachments) || matchesAny(text, DOCUMENTS_KEYWORDS);
    case "rdv":
      return matchesAny(text, RDV_KEYWORDS);
    case "mutuelle":
      return matchesAny(text, MUTUELLE_KEYWORDS);
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

export type EmailSourceFilter = "all" | "gmail" | "manual";

export const EMAIL_SOURCE_FILTERS: { id: EmailSourceFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "gmail", label: "Gmail" },
  { id: "manual", label: "Manuel" },
];

export function isGmailEmail(email: PriorityEmail): boolean {
  return email.importedFrom === "GMAIL";
}

export function matchesEmailSource(email: PriorityEmail, source: EmailSourceFilter): boolean {
  if (source === "all") return true;
  if (source === "gmail") return isGmailEmail(email);
  return !isGmailEmail(email);
}

/** Lien d'ouverture du fil dans Gmail (nouvel onglet). */
export function gmailThreadUrl(email: PriorityEmail): string | null {
  if (!isGmailEmail(email)) return null;
  if (email.gmailThreadId) {
    return `https://mail.google.com/mail/u/0/#inbox/${email.gmailThreadId}`;
  }
  if (email.gmailMessageId) {
    return `https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(email.gmailMessageId)}`;
  }
  return "https://mail.google.com/mail/u/0/#inbox";
}

/** Lien de réponse dans Gmail (ouvre le fil, l'utilisateur répond dans Gmail). */
export function gmailReplyUrl(email: PriorityEmail): string | null {
  return gmailThreadUrl(email);
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

export function emailHasAttachments(email: PriorityEmail): boolean {
  return Boolean(email.hasAttachments) || (email.attachments?.length ?? 0) > 0;
}

export function formatAttachmentSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

export type EmailSortOption =
  | "recent"
  | "oldest"
  | "urgent"
  | "untreated"
  | "attachments"
  | "category";

export const EMAIL_SORT_OPTIONS: { id: EmailSortOption; label: string }[] = [
  { id: "recent", label: "Plus récents" },
  { id: "oldest", label: "Plus anciens" },
  { id: "urgent", label: "Urgents d'abord" },
  { id: "untreated", label: "Non traités d'abord" },
  { id: "attachments", label: "Avec pièces jointes" },
  { id: "category", label: "Par catégorie" },
];

function receivedTimestamp(email: PriorityEmail): number {
  const t = new Date(`${email.receivedDate}T${email.receivedAt || "00:00"}`).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function sortEmails(emails: PriorityEmail[], sort: EmailSortOption): PriorityEmail[] {
  const list = [...emails];
  switch (sort) {
    case "recent":
      return list.sort((a, b) => receivedTimestamp(b) - receivedTimestamp(a));
    case "oldest":
      return list.sort((a, b) => receivedTimestamp(a) - receivedTimestamp(b));
    case "urgent":
      return list.sort((a, b) => {
        const ua = a.category === "Urgent" ? 0 : 1;
        const ub = b.category === "Urgent" ? 0 : 1;
        if (ua !== ub) return ua - ub;
        return receivedTimestamp(b) - receivedTimestamp(a);
      });
    case "untreated":
      return list.sort((a, b) => {
        const ta = isEmailTreated(a) ? 1 : 0;
        const tb = isEmailTreated(b) ? 1 : 0;
        if (ta !== tb) return ta - tb;
        return receivedTimestamp(b) - receivedTimestamp(a);
      });
    case "attachments":
      return list.sort((a, b) => {
        const aa = emailHasAttachments(a) ? 0 : 1;
        const ab = emailHasAttachments(b) ? 0 : 1;
        if (aa !== ab) return aa - ab;
        return receivedTimestamp(b) - receivedTimestamp(a);
      });
    case "category":
      return list.sort((a, b) => {
        const cmp = a.category.localeCompare(b.category, "fr");
        if (cmp !== 0) return cmp;
        return receivedTimestamp(b) - receivedTimestamp(a);
      });
    default:
      return list;
  }
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
