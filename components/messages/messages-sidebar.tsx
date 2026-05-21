"use client";

import { Search } from "lucide-react";
import { MessagesRecipientSelect } from "@/components/messages/messages-recipient-select";
import {
  formatConversationTime,
  initialsFromName,
  isPresenceOnline,
} from "@/lib/messages-ui";
import type { ConversationSummary, PresenceTeamMember, RecipientOption } from "@/types/domain";

export type MessagesListTab = "all" | "unread";

interface MessagesSidebarProps {
  conversations: ConversationSummary[];
  loading: boolean;
  activePeerId: string | null;
  tab: MessagesListTab;
  searchQuery: string;
  presenceMap: Map<string, PresenceTeamMember>;
  recipients: RecipientOption[];
  onTabChange: (tab: MessagesListTab) => void;
  onSearchChange: (q: string) => void;
  onSelect: (peerId: string) => void;
  onRecipientChange: (peerId: string) => void;
}

export function MessagesSidebar({
  conversations,
  loading,
  activePeerId,
  tab,
  searchQuery,
  presenceMap,
  recipients,
  onTabChange,
  onSearchChange,
  onSelect,
  onRecipientChange,
}: MessagesSidebarProps) {
  const unreadTotal = conversations.reduce((n, c) => n + c.unreadCount, 0);

  const filtered = conversations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q || c.peerName.toLowerCase().includes(q) || c.lastPreview.toLowerCase().includes(q);
    const matchTab = tab === "all" || c.unreadCount > 0;
    return matchSearch && matchTab;
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 space-y-3 border-b border-slate-100 px-4 pb-3 pt-4">
        <h1 className="text-[15px] font-semibold tracking-tight text-slate-900">Messages</h1>
        <MessagesRecipientSelect
          id="sidebar-recipient"
          recipients={recipients}
          value={activePeerId}
          presenceMap={presenceMap}
          onChange={onRecipientChange}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un message ou un utilisateur…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-2 text-xs text-slate-800 outline-none focus:border-[#5D5CDE]/40 focus:ring-2 focus:ring-[#5D5CDE]/12"
          />
        </div>
        <div className="flex gap-5 border-b border-slate-100 text-xs font-medium">
          <button
            type="button"
            onClick={() => onTabChange("all")}
            className={`border-b-2 pb-2 transition ${
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
            className={`border-b-2 pb-2 transition ${
              tab === "unread"
                ? "border-[#5D5CDE] text-[#5D5CDE]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Non lus
            {unreadTotal > 0 ? (
              <span className="ml-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 py-px text-[9px] font-bold text-white">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <p className="px-4 py-6 text-center text-xs text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-500">Aucune conversation.</p>
        ) : (
          <ul>
            {filtered.map((c) => {
              const active = activePeerId === c.peerId;
              const presence = presenceMap.get(c.peerId);
              const online = isPresenceOnline(presence);

              return (
                <li key={c.peerId}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.peerId)}
                    className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left transition ${
                      active
                        ? "border-l-[3px] border-l-[#5D5CDE] bg-violet-50/90 pl-[9px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                        : "border-l-[3px] border-l-transparent hover:bg-slate-50/90"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[10px] font-bold text-white">
                        {initialsFromName(c.peerName)}
                      </span>
                      {online ? (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-1">
                        <span
                          className={`truncate text-[13px] leading-tight ${active ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}
                        >
                          {c.peerName}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                          {formatConversationTime(c.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] leading-snug text-slate-500">
                        {c.lastPreview}
                      </span>
                    </span>
                    {c.unreadCount > 0 ? (
                      <span className="mt-1.5 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
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
    </div>
  );
}
