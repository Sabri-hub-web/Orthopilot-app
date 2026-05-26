"use client";

import { Filter, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { EmailListItem } from "@/components/emails/email-list-item";
import type { PriorityEmail } from "@/types/domain";

interface EmailSidebarProps {
  emails: PriorityEmail[];
  loading: boolean;
  selectedId: string | null;
  searchQuery: string;
  page: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onCompose: () => void;
}

export function EmailSidebar({
  emails,
  loading,
  selectedId,
  searchQuery,
  page,
  totalPages,
  canGoPrev,
  canGoNext,
  onSearchChange,
  onSelect,
  onRefresh,
  onPrevPage,
  onNextPage,
  onCompose,
}: EmailSidebarProps) {
  const q = searchQuery.trim().toLowerCase();
  const filtered = emails.filter((email) => {
    const matchSearch =
      !q ||
      email.subject.toLowerCase().includes(q) ||
      email.from.toLowerCase().includes(q) ||
      (email.comment?.toLowerCase().includes(q) ?? false);
    return matchSearch;
  });

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher un email…"
              className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
            />
          </div>
          <button
            type="button"
            title="Filtres"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Actualiser"
            onClick={onRefresh}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            title="Nouvel email"
            onClick={onCompose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        {loading && emails.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">Aucun email dans cette catégorie.</p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((email) => (
              <EmailListItem
                key={email.id}
                email={email}
                selected={selectedId === email.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-100 px-3 py-1.5">
        <span className="text-[10px] text-slate-500">
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={!canGoPrev}
            className="rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 disabled:opacity-40"
          >
            Préc.
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={!canGoNext}
            className="rounded-lg border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 disabled:opacity-40"
          >
            Suiv.
          </button>
        </div>
      </footer>
    </div>
  );
}
