"use client";

import type { ReactNode } from "react";
import { EMAILS_TOPBAR_PX } from "@/lib/emails-ui";

interface EmailsLayoutProps {
  sidebar: ReactNode;
  viewer: ReactNode;
  aiPanel: ReactNode;
  success?: string | null;
  error?: string | null;
}

export function EmailsLayout({ sidebar, viewer, aiPanel, success, error }: EmailsLayoutProps) {
  return (
    <div
      className="flex w-full flex-col overflow-hidden bg-[#F8FAFC]"
      style={{ height: `calc(100vh - ${EMAILS_TOPBAR_PX}px)` }}
    >
      {success ? (
        <div className="shrink-0 border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div
        className="grid min-h-0 w-full flex-1 gap-3 overflow-hidden p-3"
        style={{ gridTemplateColumns: "24% 46% 30%" }}
      >
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{sidebar}</div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{viewer}</div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{aiPanel}</div>
      </div>
    </div>
  );
}
