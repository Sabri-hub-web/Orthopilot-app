"use client";

import { ChevronDown, User } from "lucide-react";
import { initialsFromName } from "@/lib/messages-ui";
import type { PresenceTeamMember, RecipientOption } from "@/types/domain";

interface MessagesRecipientSelectProps {
  recipients: RecipientOption[];
  value: string | null;
  presenceMap?: Map<string, PresenceTeamMember>;
  onChange: (peerId: string) => void;
  compact?: boolean;
  id?: string;
}

export function MessagesRecipientSelect({
  recipients,
  value,
  presenceMap,
  onChange,
  compact = false,
  id = "message-recipient",
}: MessagesRecipientSelectProps) {
  const selected = recipients.find((r) => r.id === value);

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <label
        htmlFor={id}
        className={`flex items-center gap-1 font-medium text-slate-500 ${compact ? "text-[10px]" : "text-[11px]"}`}
      >
        <User className="h-3 w-3" />
        Envoyer à
      </label>
      <div className="relative">
        <select
          id={id}
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v) onChange(v);
          }}
          className={`w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#5D5CDE] focus:ring-2 focus:ring-[#5D5CDE]/15 ${
            compact ? "py-1.5 pl-2 pr-8 text-xs" : "py-2 pl-3 pr-9 text-sm"
          }`}
        >
          <option value="" disabled>
            Choisir un collègue…
          </option>
          {recipients.map((r) => {
            const role = presenceMap?.get(r.id)?.roleLabel;
            return (
              <option key={r.id} value={r.id}>
                {r.fullName}
                {role ? ` — ${role}` : ""}
              </option>
            );
          })}
        </select>
        <ChevronDown
          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
          aria-hidden
        />
      </div>
      {selected && !compact ? (
        <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-[8px] font-bold text-white">
            {initialsFromName(selected.fullName)}
          </span>
          Conversation avec {selected.fullName}
        </p>
      ) : null}
    </div>
  );
}
