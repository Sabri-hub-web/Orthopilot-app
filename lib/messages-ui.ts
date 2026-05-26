import type { InternalMessageLine, PresenceTeamMember, RecipientOption } from "@/types/domain";

export const MESSAGE_ATTACHMENTS_ENABLED = false;

export const MESSAGE_ATTACHMENT_MAX_FILES = 5;
export const MESSAGE_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function formatConversationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Hier";

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function presenceByUserId(members: PresenceTeamMember[]): Map<string, PresenceTeamMember> {
  return new Map(members.map((m) => [m.userId, m]));
}

export function presenceStatusLabel(member: PresenceTeamMember | undefined): string {
  if (!member) return "Hors ligne";
  if (!member.isOnline) return "Hors ligne";
  return member.presenceLabel;
}

export function isPresenceOnline(member: PresenceTeamMember | undefined): boolean {
  if (!member) return false;
  return member.isOnline && member.presenceStatus === "DISPONIBLE";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const MESSAGE_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv,.doc,.docx,.xls,.xlsx";

export function attachmentDownloadUrl(id: string, inline = false): string {
  return `/api/messages/attachments/${id}${inline ? "?inline=1" : ""}`;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  );
}

export function daySeparatorLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameCalendarDay(date, now)) return "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(date, yesterday)) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function groupMessagesByDay(
  messages: InternalMessageLine[],
): { dayKey: string; label: string; items: InternalMessageLine[] }[] {
  const groups: { dayKey: string; label: string; items: InternalMessageLine[] }[] = [];

  for (const m of messages) {
    const d = new Date(m.createdAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = groups[groups.length - 1];
    if (last?.dayKey === dayKey) {
      last.items.push(m);
    } else {
      groups.push({ dayKey, label: daySeparatorLabel(m.createdAt), items: [m] });
    }
  }

  return groups;
}

export const MESSAGE_ACCENT = "#5D5CDE";

/** Prénom affiché (ex. « Naomi » depuis « Naomi Responsable ») */
export function displayFirstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName;
}

/** Liste destinataires : API messages + équipe présence (sans l'utilisateur connecté) */
export function mergeMessageRecipients(
  fromApi: RecipientOption[],
  presenceMembers: PresenceTeamMember[],
  currentUserId: string,
): RecipientOption[] {
  const map = new Map<string, RecipientOption>();

  for (const r of fromApi) {
    if (r.id !== currentUserId) map.set(r.id, r);
  }

  for (const m of presenceMembers) {
    if (m.userId === currentUserId) continue;
    const existing = map.get(m.userId);
    map.set(m.userId, {
      id: m.userId,
      fullName: m.fullName,
      roleLabel: existing?.roleLabel ?? m.roleLabel,
    });
  }

  return [...map.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "fr"));
}
