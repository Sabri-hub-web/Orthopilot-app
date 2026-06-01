"use client";

import { ArrowUpDown, Inbox, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { EmailListItem } from "@/components/emails/email-list-item";
import {
  EMAIL_ASSIGNMENT_FILTERS,
  EMAIL_SORT_OPTIONS,
  EMAIL_SOURCE_FILTERS,
  type EmailAssignmentFilter,
  type EmailSortOption,
  type EmailSourceFilter,
} from "@/lib/emails-ui";
import type { PriorityEmail } from "@/types/domain";

interface EmailSidebarProps {
  emails: PriorityEmail[];
  loading: boolean;
  selectedId: string | null;
  searchQuery: string;
  sourceFilter: EmailSourceFilter;
  assignmentFilter: EmailAssignmentFilter;
  sortOption: EmailSortOption;
  gmailConnected: boolean;
  page: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onSearchChange: (q: string) => void;
  onSourceChange: (source: EmailSourceFilter) => void;
  onAssignmentChange: (filter: EmailAssignmentFilter) => void;
  onSortChange: (sort: EmailSortOption) => void;
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
  sourceFilter,
  assignmentFilter,
  sortOption,
  gmailConnected,
  page,
  totalPages,
  canGoPrev,
  canGoNext,
  onSearchChange,
  onSourceChange,
  onAssignmentChange,
  onSortChange,
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
      <header className="shrink-0 space-y-2 border-b border-slate-100 px-3 py-2.5">
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

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-0.5 rounded-xl bg-slate-100/70 p-0.5">
            {EMAIL_SOURCE_FILTERS.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => onSourceChange(source.id)}
                className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-200 ${
                  sourceFilter === source.id
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {source.label}
              </button>
            ))}
          </div>
          <div className="relative shrink-0">
            <ArrowUpDown className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as EmailSortOption)}
              title="Trier"
              className="h-7 appearance-none rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-[11px] font-medium text-slate-600 outline-none transition focus:border-violet-300"
            >
              {EMAIL_SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-0.5 rounded-xl bg-slate-100/70 p-0.5">
          {EMAIL_ASSIGNMENT_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onAssignmentChange(item.id)}
              className={`flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-200 ${
                assignmentFilter === item.id
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2">
        {loading && emails.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
              <Inbox className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-slate-500">Aucun email</p>
            <p className="text-xs text-slate-400">
              {sourceFilter === "gmail"
                ? gmailConnected
                  ? "Synchronisez Gmail pour importer vos emails."
                  : "Connectez Gmail pour voir vos emails."
                : "Aucun email à afficher pour ce filtre."}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
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
