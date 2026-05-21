"use client";

import type { ReactNode } from "react";

/** Hauteur topbar compacte — alignée avec Topbar compact */
export const MESSAGES_TOPBAR_PX = 52;

interface MessagesLayoutProps {
  sidebar: ReactNode;
  chat: ReactNode;
  details: ReactNode;
  error?: string | null;
}

export function MessagesLayout({ sidebar, chat, details, error }: MessagesLayoutProps) {
  return (
    <div
      className="flex w-full flex-col overflow-hidden bg-[#eef1f6]"
      style={{ height: `calc(100vh - ${MESSAGES_TOPBAR_PX}px)` }}
    >
      {error ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div
        className="grid min-h-0 w-full flex-1 overflow-hidden"
        style={{ gridTemplateColumns: "22% 53% 25%" }}
      >
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-slate-200/90 bg-white">
          {sidebar}
        </div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-slate-200/90 bg-white">
          {chat}
        </div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white">{details}</div>
      </div>
    </div>
  );
}
