"use client";

import {
  displaySenderName,
  emailCategoryBadgeClass,
  emailAccentBarClass,
  emailPreviewText,
  formatEmailListTime,
  getEmailAccentType,
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
  const accent = getEmailAccentType(email);
  const treated = isEmailTreated(email);

  return (
    <button
      type="button"
      onClick={() => onSelect(email.id)}
      className={`group relative flex h-[80px] w-full shrink-0 items-stretch overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
        selected
          ? "border-violet-300 bg-violet-50/80 shadow-md shadow-violet-500/10"
          : "border-slate-200/80 bg-white hover:bg-slate-50"
      }`}
    >
      <span className={`w-1 shrink-0 ${emailAccentBarClass[accent]}`} aria-hidden />

      <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
            selected
              ? "bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]"
              : "bg-gradient-to-br from-slate-500 to-slate-700"
          }`}
        >
          {initialsFromEmail(email.from)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`truncate text-sm font-semibold ${treated ? "text-slate-500" : "text-[#0F172A]"}`}>
              {displaySenderName(email.from)}
            </p>
            <span className="shrink-0 text-[11px] font-medium text-[#475569]">
              {formatEmailListTime(email.receivedDate, email.receivedAt)}
            </span>
          </div>
          <p className="truncate text-xs font-medium text-slate-700">{email.subject}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#475569]">{emailPreviewText(email)}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${emailCategoryBadgeClass[email.category]}`}
            >
              {email.category}
            </span>
            <span
              className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                treated ? "text-emerald-600" : "text-amber-700"
              }`}
            >
              {treated ? "Traité" : "Non traité"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
