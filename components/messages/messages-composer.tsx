"use client";

import { Loader2, Paperclip, Send } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";

interface MessagesComposerProps {
  value: string;
  sending: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function MessagesComposer({ value, sending, onChange, onSubmit }: MessagesComposerProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending && value.trim()) {
        const form = e.currentTarget.form;
        if (form) form.requestSubmit();
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 border-t border-slate-100 bg-white px-3 py-3"
    >
      <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-2 shadow-sm">
        <button
          type="button"
          disabled
          title="Pièces jointes — bientôt disponible"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 opacity-50"
          aria-hidden
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message…"
          rows={1}
          className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={sending || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Envoyer"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-400">Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne</p>
    </form>
  );
}
