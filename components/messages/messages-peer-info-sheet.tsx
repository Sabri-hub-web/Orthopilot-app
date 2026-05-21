"use client";

import Link from "next/link";
import { ListTodo, X } from "lucide-react";
import { initialsFromName, presenceStatusLabel } from "@/lib/messages-ui";
import type { PresenceTeamMember } from "@/types/domain";

interface MessagesPeerInfoSheetProps {
  open: boolean;
  peerName: string;
  peerId: string;
  presence?: PresenceTeamMember;
  onClose: () => void;
}

export function MessagesPeerInfoSheet({
  open,
  peerName,
  peerId,
  presence,
  onClose,
}: MessagesPeerInfoSheetProps) {
  if (!open) return null;

  const statusLabel = presenceStatusLabel(presence);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 backdrop-blur-[1px]"
      role="presentation"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-labelledby="peer-info-title"
        className="flex h-full w-full max-w-xs flex-col border-l border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id="peer-info-title" className="text-sm font-semibold text-slate-900">
            Informations
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-sm font-bold text-white">
              {initialsFromName(peerName)}
            </span>
            <p className="mt-3 text-base font-semibold text-slate-900">{peerName}</p>
            {presence?.roleLabel ? (
              <p className="mt-0.5 text-sm text-slate-500">{presence.roleLabel}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">{statusLabel}</p>
          </div>

          <div className="mt-6 space-y-2">
            <Link
              href="/tasks"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-violet-50 hover:border-violet-200"
            >
              <ListTodo className="h-4 w-4 text-violet-600" />
              Voir les tâches du cabinet
            </Link>
            <p className="text-center text-[10px] text-slate-400">
              Collègue : réf. interne {peerId.slice(0, 8)}…
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
