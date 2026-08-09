"use client";

import type { ReactNode } from "react";

/** Hauteur topbar compacte — alignée avec Topbar compact */
export const MESSAGES_TOPBAR_PX = 52;

interface MessagesLayoutProps {
  sidebar: ReactNode;
  chat: ReactNode;
  details?: ReactNode;
  error?: string | null;
}

export function MessagesLayout({ sidebar, chat, error }: MessagesLayoutProps) {
  return (
    <div
      className="flex w-full flex-col overflow-hidden bg-[#eef1f6] dark:bg-slate-950"
      style={{ height: `calc(100vh - ${MESSAGES_TOPBAR_PX}px)` }}
    >
      {error ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 w-full flex-1 grid-cols-1 overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900">
          {sidebar}
        </div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white dark:bg-slate-900">
          {chat}
        </div>
      </div>
    </div>
  );
}
