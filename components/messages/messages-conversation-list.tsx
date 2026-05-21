"use client";

import { Plus, Search } from "lucide-react";
import {
  formatConversationTime,
  initialsFromName,
  isPresenceOnline,
} from "@/lib/messages-ui";
import type { ConversationSummary, PresenceTeamMember } from "@/types/domain";

interface MessagesConversationListProps {
  conversations: ConversationSummary[];
  loading: boolean;
  activePeerId: string | null;
  searchQuery: string;
  presenceMap: Map<string, PresenceTeamMember>;
  onSearchChange: (q: string) => void;
  onSelect: (peerId: string) => void;
  onNewMessage: () => void;
}

export function MessagesConversationList({
  conversations,
  loading,
  activePeerId,
  searchQuery,
  presenceMap,
  onSearchChange,
  onSelect,
  onNewMessage,
}: MessagesConversationListProps) {
  const filtered = conversations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return c.peerName.toLowerCase().includes(q);
  });

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
          <button
            type="button"
            onClick={onNewMessage}
            className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:from-violet-700 hover:to-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            Nouveau
          </button>
        </div>
        <div className="relative mt-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher une conversation…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate-500">
            {searchQuery ? "Aucune conversation trouvée." : "Aucune conversation encore."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((c) => {
              const active = activePeerId === c.peerId;
              const presence = presenceMap.get(c.peerId);
              const online = isPresenceOnline(presence);

              return (
                <li key={c.peerId}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.peerId)}
                    className={`flex w-full items-start gap-2.5 rounded-xl border-l-[3px] px-2.5 py-2 text-left transition ${
                      active
                        ? "border-l-violet-500 bg-violet-50/90 shadow-sm"
                        : "border-l-transparent hover:bg-slate-50"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] font-bold text-white">
                        {initialsFromName(c.peerName)}
                      </span>
                      {online ? (
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-1">
                        <span className={`truncate text-sm ${active ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>
                          {c.peerName}
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                          {formatConversationTime(c.lastMessageAt)}
                        </span>
                      </span>
                      {presence?.roleLabel ? (
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                          {presence.roleLabel}
                        </span>
                      ) : null}
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{c.lastPreview}</span>
                    </span>
                    {c.unreadCount > 0 ? (
                      <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
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
    </aside>
  );
}
