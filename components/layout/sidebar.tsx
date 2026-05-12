"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  Home,
  Mail,
  MessageSquare,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { hasPermission, type AppPermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/session";

const navItems = [
  { label: "Dashboard", href: "/", icon: Home, permission: "dashboard:view" as AppPermission },
  { label: "Calendrier", href: "/calendar", icon: CalendarDays, permission: "calendar:view" as AppPermission },
  { label: "Messages", href: "/messages", icon: MessageSquare, permission: "messages:view" as AppPermission },
  { label: "Suivi des reglements", href: "/reglements", icon: CreditCard, permission: "reglements:view" as AppPermission },
  { label: "Emails", href: "/emails", icon: Mail, permission: "emails:view" as AppPermission },
  { label: "Patients", href: "/patients", icon: Users, permission: "patients:view" as AppPermission },
  { label: "Taches internes", href: "/tasks", icon: Stethoscope, permission: "tasks:view" as AppPermission },
  { label: "Logs & activite", href: "/logs", icon: Activity, permission: "logs:view" as AppPermission },
  { label: "Parametres", href: "/settings", icon: Settings, permission: "settings:view" as AppPermission },
];

interface SidebarProps {
  collapsed: boolean;
  role: AuthUser["role"];
  onToggle: () => void;
}

export function Sidebar({ collapsed, role, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`hidden border-r border-slate-900 bg-slate-950 p-4 text-slate-100 transition-all duration-300 lg:block ${
        collapsed ? "w-24" : "w-72"
      }`}
    >
      <div className="mb-6 border-b border-slate-800 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-200/60 bg-amber-100/10 text-xs font-semibold text-amber-200">
              CH
            </div>
            {!collapsed ? (
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Cabinet Hippolyte</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-300 transition hover:bg-slate-900 hover:text-white"
            aria-label="Reduire ou agrandir la barre laterale"
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>
        <h1 className={`text-xl font-semibold ${collapsed ? "text-xs leading-4 text-slate-300" : "text-slate-100"}`}>
          {collapsed ? "Cabinet" : "Cabinet interne"}
        </h1>
      </div>

      <nav className="space-y-2">
        {navItems
          .filter((item) => hasPermission(role, item.permission))
          .map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-amber-500/20 text-amber-200"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
              title={label}
            >
              <Icon size={16} />
              {!collapsed ? <span className="ml-3">{label}</span> : null}
            </Link>
          );
          })}
      </nav>
    </aside>
  );
}
