"use client";

import { Loader2, Mail } from "lucide-react";
import type { GmailConnectionStatus } from "@/types/domain";

interface EmailGmailBarProps {
  status: GmailConnectionStatus | null;
  statusLoading: boolean;
  syncing: boolean;
  onConnect: () => void;
  onSync: () => void;
}

function formatSyncDate(iso: string | null | undefined): string {
  if (!iso) return "Jamais";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EmailGmailBar({ status, statusLoading, syncing, onConnect, onSync }: EmailGmailBarProps) {
  if (statusLoading) {
    return (
      <div className="mx-3 flex h-8 shrink-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 text-xs text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Gmail…
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div className="mx-3 flex h-8 shrink-0 items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 px-3 text-xs text-amber-900">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span>Gmail OAuth non configuré (variables serveur).</span>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="mx-3 flex h-8 shrink-0 items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 shadow-sm">
        <span className="flex items-center gap-1.5 text-xs text-slate-600">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          Gmail non connecté
        </span>
        <button
          type="button"
          onClick={onConnect}
          className="rounded-lg bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:opacity-90"
        >
          Connecter Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 flex h-8 shrink-0 items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-700">
        <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="truncate font-medium text-emerald-800">Gmail connecté · {status.gmailEmail}</span>
        <span className="hidden shrink-0 text-slate-500 sm:inline">
          · Sync {formatSyncDate(status.lastSyncAt)}
          {typeof status.lastSyncCount === "number" ? ` · ${status.lastSyncCount} traités` : ""}
          {typeof status.importedTotal === "number" ? ` · ${status.importedTotal} importés` : ""}
        </span>
      </div>
      <button
        type="button"
        onClick={onSync}
        disabled={syncing}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50 disabled:opacity-50"
      >
        {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Synchroniser Gmail
      </button>
    </div>
  );
}
