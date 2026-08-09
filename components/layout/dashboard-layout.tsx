"use client";

import { ReactNode, useState } from "react";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { AuthUser } from "@/lib/auth/session";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  currentUserName: string;
  currentUserRole: string;
  currentUserRoleKey: AuthUser["role"];
  /** Page calendrier : hauteur fixe, pas de scroll ni footer */
  fillViewport?: boolean;
  /** Topbar réduite (calendrier plein écran) */
  topbarCompact?: boolean;
  /** Contenu plein cadre sans padding (messages) */
  contentFlush?: boolean;
}

export function DashboardLayout({
  title,
  children,
  currentUserName,
  currentUserRole,
  currentUserRoleKey,
  fillViewport = false,
  topbarCompact = false,
  contentFlush = false,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  return (
    <section
      className={`bg-[var(--app-surface,#f6f8fb)] text-slate-900 antialiased dark:text-slate-100 ${
        fillViewport ? "h-screen max-h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <section className={`flex ${fillViewport ? "h-full" : "min-h-screen"}`}>
        <Sidebar
          collapsed={sidebarCollapsed}
          role={currentUserRoleKey}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
        />
        <section
          className={`flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ${
            notificationsOpen ? "lg:pr-80" : "pr-0"
          } ${fillViewport ? "h-full overflow-hidden" : "min-h-screen"}`}
        >
          <Topbar
            title={title}
            compact={topbarCompact}
            notificationsOpen={notificationsOpen}
            onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
            unreadNotificationsCount={unreadNotificationsCount}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <main
            className={`flex min-h-0 flex-1 flex-col overflow-x-hidden ${
              contentFlush
                ? "overflow-hidden p-0"
                : fillViewport
                  ? "overflow-hidden px-3 py-1.5 md:px-4 md:py-2"
                  : "overflow-y-auto px-4 py-1.5 md:px-6 md:py-2"
            }`}
          >
            {children}
          </main>
          {fillViewport ? null : (
            <footer className="shrink-0 border-t border-slate-200/80 bg-white/60 px-3 py-1.5 text-center text-[10px] font-medium text-slate-500 backdrop-blur-sm md:px-4">
              © {new Date().getFullYear()} ORTHOPILOT — Tous droits réservés.
            </footer>
          )}
        </section>
        <NotificationsPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          onUnreadCountChange={setUnreadNotificationsCount}
        />
      </section>
    </section>
  );
}
