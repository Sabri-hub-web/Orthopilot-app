import type { PresenceTeamMember } from "@/types/domain";

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
