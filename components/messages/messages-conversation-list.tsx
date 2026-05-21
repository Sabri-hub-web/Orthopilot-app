"use client";

import { Archive } from "lucide-react";
import {
  formatConversationTime,
  initialsFromName,
  isPresenceOnline,
} from "@/lib/messages-ui";
import type { ConversationSummary, PresenceTeamMember } from "@/types/domain";

export type ConversationTab = "all" | "unread";

interface MessagesConversationListProps {
  conversations: ConversationSummary[];
  loading: boolean;
  activePeerId: string | null;
  tab: ConversationTab;
  searchQuery: string;
  presenceMap: Map<string, PresenceTeamMember>;
  onTabChange: (tab: ConversationTab) => void;
  onSelect: (peerId: string) => void;
}

export function MessagesConversationList({
  conversations,
  loading,
  activePeerId,
  tab,
  searchQuery,
  presenceMap,
  onTabChange,
  onSelect,
}: MessagesConversationListProps) {
  const unreadTotal = conversations.reduce((n, c) => n + c.unreadCount, 0);

  const filtered = conversations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.peerName.toLowerCase().includes(q) ||
      c.lastPreview.toLowerCase().includes(q);
    const matchesTab = tab === "all" || c.unreadCount > 0;
    return matchesSearch && matchesTab;
  });

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-100 px-3 pt-2">
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => onTabChange("all")}
            className={`border-b-2 pb-2 font-medium transition ${
              tab === "all"
                ? "border-[#5D5CDE] text-[#5D5CDE]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Conversations
          </button>
          <button
            type="button"
            onClick={() => onTabChange("unread")}
            className={`border-b-2 pb-2 font-medium transition ${
              tab === "unread"
                ? "border-[#5D5CDE] text-[#5D5CDE]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Non lus
            {unreadTotal > 0 ? (
              <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-slate-500">
            {tab === "unread" ? "Aucun message non lu." : "Aucune conversation."}
          </p>
        ) : (
          <ul>
            {filtered.map((c) => {
              const active = activePeerId === c.peerId;
              const presence = presenceMap.get(c.peerId);
              const online = isPresenceOnline(presence);
              const subtitle = presence?.roleLabel ?? c.lastPreview;

              return (
                <li key={c.peerId}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.peerId)}
                    className={`flex w-full items-start gap-3 border-b border-slate-50 px-3 py-3 text-left transition ${
                      active ? "bg-violet-50/80" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[11px] font-bold text-white">
                        {initialsFromName(c.peerName)}
                      </span>
                      {online ? (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={`truncate text-sm ${active ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}
                        >
                          {c.peerName}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                          {formatConversationTime(c.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{subtitle}</span>
                    </span>
                    {c.unreadCount > 0 ? (
                      <span className="mt-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {c.unreadCount > 9 ? "9+" : c.unreadCount}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-100 p-2">
        <button
          type="button"
          disabled
          title="Bientôt disponible"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-slate-400 opacity-70"
        >
          <Archive className="h-3.5 w-3.5" />
          Archiver les conversations
        </button>
      </footer>
    </aside>
  );
}
