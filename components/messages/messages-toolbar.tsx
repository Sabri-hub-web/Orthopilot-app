"use client";

import { Plus, Search } from "lucide-react";

interface MessagesToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewMessage: () => void;
}

export function MessagesToolbar({ searchQuery, onSearchChange, onNewMessage }: MessagesToolbarProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900">Messages</h1>
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un message ou un utilisateur…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#5D5CDE]/50 focus:ring-2 focus:ring-[#5D5CDE]/15"
        />
      </div>
      <button
        type="button"
        onClick={onNewMessage}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#5D5CDE] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4f4fc8]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        Nouveau message
      </button>
    </header>
  );
}
