"use client";

import { MessageSquare, Plus } from "lucide-react";

interface MessagesEmptyStateProps {
  onNewMessage: () => void;
}

export function MessagesEmptyState({ onNewMessage }: MessagesEmptyStateProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-white/60 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <MessageSquare className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">Sélectionnez une conversation</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Choisissez un collègue pour afficher les messages.
      </p>
      <button
        type="button"
        onClick={onNewMessage}
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-violet-700 hover:to-indigo-700"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        Nouveau message
      </button>
    </div>
  );
}
