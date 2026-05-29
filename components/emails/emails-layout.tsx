"use client";

import type { ReactNode } from "react";
import { EMAILS_TOPBAR_PX } from "@/lib/emails-ui";

interface EmailsLayoutProps {
  categoryBanner: ReactNode;
  gmailBar?: ReactNode;
  sidebar: ReactNode;
  viewer: ReactNode;
  success?: string | null;
  error?: string | null;
}

export function EmailsLayout({
  categoryBanner,
  gmailBar,
  sidebar,
  viewer,
  success,
  error,
}: EmailsLayoutProps) {
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

      <header className="shrink-0 px-4 pt-3 pb-1">
        <h1 className="text-base font-semibold tracking-tight text-[#0F172A]">Emails</h1>
        <p className="mt-0.5 text-xs text-[#475569]">
          Gérez, triez et suivez tous les emails du cabinet.
        </p>
      </header>

      {gmailBar}

      {categoryBanner}

      <div
        className="grid min-h-0 w-full flex-1 gap-3 overflow-hidden px-3 pb-3 pt-1"
        style={{ gridTemplateColumns: "30% 70%" }}
      >
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{sidebar}</div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">{viewer}</div>
      </div>
    </div>
  );
}
