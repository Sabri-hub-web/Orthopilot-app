"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { initialsFromName } from "@/lib/messages-ui";
import type { RecipientOption } from "@/types/domain";

interface MessagesNewMessageModalProps {
  open: boolean;
  recipients: RecipientOption[];
  onClose: () => void;
  onSelect: (peerId: string) => void;
}

export function MessagesNewMessageModal({
  open,
  recipients,
  onClose,
  onSelect,
}: MessagesNewMessageModalProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.fullName.toLowerCase().includes(q));
  }, [query, recipients]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-labelledby="new-message-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-2">
          <h2 id="new-message-title" className="text-base font-semibold text-slate-900">
            Nouveau message
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un collègue…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-8 pr-3 text-sm text-slate-800 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200"
            autoFocus
          />
        </div>

        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-2 py-4 text-center text-sm text-slate-500">Aucun collègue trouvé.</li>
          ) : (
            filtered.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(r.id);
                    onClose();
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-violet-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] font-bold text-white">
                    {initialsFromName(r.fullName)}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-900">{r.fullName}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
