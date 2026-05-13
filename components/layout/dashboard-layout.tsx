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
}

export function DashboardLayout({
  title,
  children,
  currentUserName,
  currentUserRole,
  currentUserRoleKey,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  return (
    <div className="min-h-screen bg-[var(--app-surface,#f6f8fb)] text-slate-900 antialiased">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          role={currentUserRoleKey}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
        />
        <div
          className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-300 ${
            notificationsOpen ? "lg:pr-80" : "pr-0"
          }`}
        >
          <Topbar
            title={title}
            notificationsOpen={notificationsOpen}
            onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
            unreadNotificationsCount={unreadNotificationsCount}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-6 py-2 md:px-8 md:py-2.5 lg:px-8">
            {children}
          </main>
          <footer className="shrink-0 border-t border-slate-200/80 bg-white/60 px-3 py-1.5 text-center text-[10px] font-medium text-slate-500 backdrop-blur-sm md:px-4">
            © {new Date().getFullYear()} ORTHOPILOT — Tous droits réservés.
          </footer>
        </div>
        <NotificationsPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          onUnreadCountChange={setUnreadNotificationsCount}
        />
      </div>
    </div>
  );
}
