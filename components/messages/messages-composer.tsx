"use client";

import { Loader2, Send } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";

export interface PendingMessageFile {
  id: string;
  file: File;
  previewUrl?: string;
}

interface MessagesComposerProps {
  value: string;
  sending: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function MessagesComposer({
  value,
  sending,
  disabled = false,
  onChange,
  onSubmit,
}: MessagesComposerProps) {
  const canSend = !disabled && !sending && value.trim().length > 0;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        const form = e.currentTarget.form;
        if (form) form.requestSubmit();
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Choisissez un destinataire…" : "Votre message…"}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#5D5CDE] px-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#4f4fc8] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </div>
    </form>
  );
}
