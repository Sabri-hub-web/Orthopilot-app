"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CreditCard,
  Home,
  Mail,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { hasPermission, type AppPermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
  permission: AppPermission;
};

const navSections: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Principal",
    items: [
      { label: "Dashboard", href: "/", icon: Home, permission: "dashboard:view" },
      { label: "Calendrier", href: "/calendar", icon: CalendarDays, permission: "calendar:view" },
    ],
  },
  {
    heading: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare, permission: "messages:view" },
      { label: "Emails", href: "/emails", icon: Mail, permission: "emails:view" },
    ],
  },
  {
    heading: "Gestion",
    items: [
      { label: "Suivi des règlements", href: "/reglements", icon: CreditCard, permission: "reglements:view" },
      { label: "Patients", href: "/patients", icon: Users, permission: "patients:view" },
      { label: "Tâches internes", href: "/tasks", icon: Stethoscope, permission: "tasks:view" },
      { label: "Logs & activité", href: "/logs", icon: Activity, permission: "logs:view" },
    ],
  },
  {
    heading: "Paramètres",
    items: [{ label: "Paramètres", href: "/settings", icon: Settings, permission: "settings:view" }],
  },
];

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

interface SidebarProps {
  collapsed: boolean;
  role: AuthUser["role"];
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentUserName: string;
  currentUserRole: string;
}

export function Sidebar({
  collapsed,
  role,
  onToggle,
  mobileOpen,
  onMobileClose,
  currentUserName,
  currentUserRole,
}: SidebarProps) {
  const pathname = usePathname();
  const cabinetDisplay =
    typeof process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME === "string" &&
    process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim() !== ""
      ? process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim()
      : "Cabinet";

  const widthClass = collapsed ? "w-[250px] lg:w-[72px]" : "w-[250px] lg:w-[250px]";

  return (
    <>
      <button
        type="button"
        aria-label="Fermer le menu"
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onMobileClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-white/10 bg-gradient-to-b from-[#0a1628] via-[#0d1b2e] to-[#050a12] text-slate-100 shadow-xl shadow-black/30 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-20 lg:max-h-screen lg:translate-x-0 lg:shadow-none ${widthClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-3 lg:h-[3.25rem] lg:justify-end">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onMobileClose}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white lg:flex"
            aria-label={collapsed ? "Agrandir la barre latérale" : "Réduire la barre latérale"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" strokeWidth={1.75} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>

        <div className={`border-b border-white/10 px-4 py-5 ${collapsed ? "lg:px-2 lg:py-4" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-sky-900/40">
              OP
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/90">
                  OrthoPilot
                </p>
                <p className="truncate text-xs font-medium text-amber-200/90">{cabinetDisplay}</p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Plateforme interne cabinet dentaire</p>
          ) : null}
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
          {navSections.map((section) => {
            const visible = section.items.filter((item) => hasPermission(role, item.permission));
            if (!visible.length) return null;
            return (
              <div key={section.heading}>
                {!collapsed ? (
                  <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {section.heading}
                  </p>
                ) : (
                  <div className="my-2 hidden h-px bg-white/10 lg:block" aria-hidden />
                )}
                <ul className="space-y-0.5">
                  {visible.map(({ label, href, icon: Icon }) => {
                    const isActive =
                      href === "/"
                        ? pathname === "/"
                        : pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => onMobileClose()}
                          title={label}
                          className={`group flex items-center gap-3 rounded-xl py-2 pr-2 text-[13px] font-medium transition duration-200 ${
                            collapsed ? "justify-center px-0 lg:px-0" : "px-2.5"
                          } ${
                            isActive
                              ? "bg-gradient-to-r from-sky-500/25 to-indigo-500/15 text-white shadow-[inset_0_0_0_1px_rgba(56,189,248,0.25)]"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`h-[18px] w-[18px] shrink-0 transition ${isActive ? "text-sky-300" : "text-slate-400 group-hover:text-slate-200"}`}
                            strokeWidth={1.75}
                            aria-hidden
                          />
                          {!collapsed ? <span className="truncate">{label}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className={`mt-auto border-t border-white/10 p-3 ${collapsed ? "lg:px-2" : ""}`}>
          <div
            className={`flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10 ${collapsed ? "lg:flex-col" : ""}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-semibold text-white ring-2 ring-white/10">
              {initialsFromName(currentUserName)}
            </div>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{currentUserName}</p>
                <p className="truncate text-[10px] uppercase tracking-wide text-slate-400">{currentUserRole}</p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <div className="mt-2 flex gap-2">
              <Link
                href="/settings"
                onClick={() => onMobileClose()}
                className="flex-1 rounded-lg border border-white/10 py-2 text-center text-[11px] font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Profil
              </Link>
              <LogoutButton className="flex-1 rounded-lg border border-white/10 py-2 text-center text-[11px] font-semibold text-slate-200 transition hover:bg-white/10" />
            </div>
          ) : (
            <div className="mt-2 hidden lg:block">
              <LogoutButton className="w-full rounded-lg border border-white/10 py-2 text-center text-[10px] font-semibold text-slate-200 transition hover:bg-white/10" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
