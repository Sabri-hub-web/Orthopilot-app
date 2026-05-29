"use client";

import { Paperclip } from "lucide-react";
import {
  displaySenderName,
  emailHasAttachments,
  formatEmailListTime,
  initialsFromEmail,
  isEmailTreated,
} from "@/lib/emails-ui";
import type { PriorityEmail } from "@/types/domain";

interface EmailListItemProps {
  email: PriorityEmail;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function EmailListItem({ email, selected, onSelect }: EmailListItemProps) {
  const treated = isEmailTreated(email);
  const hasAttachments = emailHasAttachments(email);

  return (
    <button
      type="button"
      onClick={() => onSelect(email.id)}
      className={`group relative flex w-full shrink-0 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 ${
        selected
          ? "border-violet-200 bg-violet-50/70 shadow-sm shadow-violet-500/5"
          : "border-transparent bg-white hover:border-slate-200/80 hover:bg-slate-50"
      }`}
    >
      <span
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          selected
            ? "bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]"
            : "bg-gradient-to-br from-slate-400 to-slate-600"
        }`}
      >
        {initialsFromEmail(email.from)}
        {!treated ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-violet-500" />
        ) : null}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${treated ? "font-medium text-slate-500" : "font-semibold text-[#0F172A]"}`}>
            {displaySenderName(email.from)}
          </p>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400">
            {hasAttachments ? <Paperclip className="h-3 w-3 text-slate-400" /> : null}
            {formatEmailListTime(email.receivedDate, email.receivedAt)}
          </span>
        </div>
        <p className={`truncate text-xs ${treated ? "text-slate-400" : "text-slate-600"}`}>{email.subject}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="truncate text-[10px] font-medium text-slate-400">{email.category}</span>
          {hasAttachments ? (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
              Pièce jointe
            </span>
          ) : null}
          {treated ? (
            <span className="text-[10px] font-medium text-emerald-500">· Traité</span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
