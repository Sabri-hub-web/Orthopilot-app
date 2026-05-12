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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          role={currentUserRoleKey}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
        <div
          className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ${
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
          />
          <main className="min-h-0 flex-1 overflow-hidden p-4 md:p-6">{children}</main>
          <footer className="border-t border-slate-200 bg-white px-4 py-2 text-center text-xs text-slate-500 md:px-6">
            © {new Date().getFullYear()} ORTHOPILOT - Tous droits reserves.
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
