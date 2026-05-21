"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { displayFirstName, initialsFromName, isPresenceOnline } from "@/lib/messages-ui";
import type { PresenceTeamMember, RecipientOption } from "@/types/domain";

interface MessagesRecipientSearchProps {
  recipients: RecipientOption[];
  value: string | null;
  loading?: boolean;
  presenceMap?: Map<string, PresenceTeamMember>;
  onChange: (peerId: string) => void;
  compact?: boolean;
}

export function MessagesRecipientSearch({
  recipients,
  value,
  loading = false,
  presenceMap,
  onChange,
  compact = false,
}: MessagesRecipientSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = recipients.find((r) => r.id === value);

  useEffect(() => {
    if (selected) setQuery(selected.fullName);
  }, [selected?.id, selected?.fullName]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.roleLabel?.toLowerCase().includes(q) ||
        displayFirstName(r.fullName).toLowerCase().includes(q),
    );
  }, [query, recipients]);

  return (
    <div ref={rootRef} className={`relative ${compact ? "space-y-1" : "space-y-1.5"}`}>
      <label
        className={`block font-medium text-slate-500 ${compact ? "text-[10px]" : "text-[11px]"}`}
      >
        Envoyer à
      </label>
      <div className="relative">
        <Search
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${compact ? "left-2 h-3 w-3" : "left-2.5 h-3.5 w-3.5"}`}
        />
        <input
          type="text"
          value={query}
          disabled={loading || recipients.length === 0}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? "Chargement…" : "Rechercher un collègue…"}
          className={`w-full rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm outline-none transition focus:border-[#5D5CDE] focus:ring-2 focus:ring-[#5D5CDE]/12 disabled:bg-slate-50 disabled:text-slate-400 ${
            compact ? "py-1.5 pl-7 pr-2 text-xs" : "py-2 pl-8 pr-2 text-sm"
          }`}
          autoComplete="off"
        />
      </div>

      {open && !loading && suggestions.length > 0 ? (
        <ul
          className="absolute left-0 right-0 z-20 mt-1 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((r) => {
            const presence = presenceMap?.get(r.id);
            const online = isPresenceOnline(presence);
            const active = value === r.id;

            return (
              <li key={r.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(r.id);
                    setQuery(r.fullName);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition ${
                    active ? "bg-violet-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="relative shrink-0">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[9px] font-bold text-white">
                      {initialsFromName(r.fullName)}
                    </span>
                    {online ? (
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-emerald-500" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-900">
                      {displayFirstName(r.fullName)}
                    </span>
                    <span className="block truncate text-[10px] text-slate-500">
                      {r.roleLabel ?? r.fullName}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {open && !loading && query && suggestions.length === 0 ? (
        <p className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
          Aucun collègue trouvé.
        </p>
      ) : null}
    </div>
  );
}
