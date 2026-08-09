"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Home,
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
import { loadGeneralSettings } from "@/lib/settings-ui";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
  permission: AppPermission;
};

const navSections: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Principal",
    items: [{ label: "Dashboard", href: "/", icon: Home, permission: "dashboard:view" }],
  },
  {
    heading: "Communication",
    items: [{ label: "Messages", href: "/messages", icon: MessageSquare, permission: "messages:view" }],
  },
  {
    heading: "Gestion",
    items: [
      { label: "Suivi des règlements", href: "/reglements", icon: CreditCard, permission: "reglements:view" },
      { label: "Patients", href: "/patients", icon: Users, permission: "patients:view" },
      { label: "Tâches internes", href: "/tasks", icon: Stethoscope, permission: "tasks:view" },
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
  const envCabinet =
    typeof process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME === "string" &&
    process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim() !== ""
      ? process.env.NEXT_PUBLIC_CABINET_DISPLAY_NAME.trim()
      : "Cabinet";
  const [cabinetDisplay, setCabinetDisplay] = useState(envCabinet);

  useEffect(() => {
    const prefs = loadGeneralSettings();
    if (prefs.cabinetName.trim()) setCabinetDisplay(prefs.cabinetName.trim());
    function onCabinetChanged(e: Event) {
      const detail = (e as CustomEvent<{ cabinetName?: string }>).detail;
      if (detail?.cabinetName?.trim()) setCabinetDisplay(detail.cabinetName.trim());
    }
    window.addEventListener("orthopilot-cabinet-changed", onCabinetChanged);
    return () => window.removeEventListener("orthopilot-cabinet-changed", onCabinetChanged);
  }, []);

  const widthClass = collapsed ? "w-[240px] lg:w-[3.25rem]" : "w-[240px] lg:w-[240px]";

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
        className={`fixed inset-y-0 left-0 z-50 flex h-screen min-h-screen flex-col border-r border-white/[0.08] bg-gradient-to-b from-[#080f1c] via-[#0c1526] to-[#050910] text-slate-100 shadow-xl shadow-black/40 transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 lg:shadow-none ${widthClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-2 lg:h-12 lg:justify-end">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onMobileClose}
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white lg:flex"
            aria-label={collapsed ? "Agrandir la barre latérale" : "Réduire la barre latérale"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" strokeWidth={1.75} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>

        <div className={`border-b border-white/10 px-3 py-3 ${collapsed ? "lg:px-1.5 lg:py-2.5" : ""}`}>
          <div className={`flex items-center gap-2 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 text-xs font-bold text-white shadow-md shadow-sky-900/40">
              OP
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
                  OrthoPilot
                </p>
                <p className="truncate text-[11px] font-medium text-amber-200/90">{cabinetDisplay}</p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <p className="mt-2 text-[10px] leading-snug text-slate-400">Plateforme interne cabinet dentaire</p>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col justify-evenly overflow-y-auto px-1.5 py-4 lg:py-6">
          {navSections.map((section) => {
            const visible = section.items.filter((item) => hasPermission(role, item.permission));
            if (!visible.length) return null;
            return (
              <div key={section.heading} className="shrink-0">
                {!collapsed ? (
                  <p className="mb-2 px-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    {section.heading}
                  </p>
                ) : (
                  <div className="my-3 hidden h-px bg-white/10 lg:block" aria-hidden />
                )}
                <ul className="space-y-1">
                  {visible.map(({ label, href, icon: Icon }) => {
                    const isActive =
                      href === "/"
                        ? pathname === "/"
                        : pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          prefetch
                          onClick={() => onMobileClose()}
                          title={label}
                          className={`group flex items-center gap-2 rounded-lg py-1.5 pr-1.5 text-[12px] font-medium transition duration-200 ${
                            collapsed ? "justify-center px-0 lg:px-0" : "px-2"
                          } ${
                            isActive
                              ? "bg-gradient-to-r from-violet-500/30 via-indigo-500/20 to-sky-500/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15),inset_0_0_0_1px_rgba(167,139,250,0.35)]"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 transition ${isActive ? "text-violet-300" : "text-slate-400 group-hover:text-slate-200"}`}
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

        <div className={`mt-auto border-t border-white/10 p-2 ${collapsed ? "lg:px-1" : ""}`}>
          <div
            className={`flex items-center gap-2 rounded-lg bg-white/5 p-2 ring-1 ring-white/10 ${collapsed ? "lg:flex-col" : ""}`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[10px] font-semibold text-white ring-2 ring-white/10">
              {initialsFromName(currentUserName)}
            </div>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-white">{currentUserName}</p>
                <p className="truncate text-[9px] uppercase tracking-wide text-slate-400">{currentUserRole}</p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <div className="mt-1.5 flex gap-1.5">
              <Link
                href="/settings"
                prefetch
                onClick={() => onMobileClose()}
                className="flex-1 rounded-md border border-white/10 py-1.5 text-center text-[10px] font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Profil
              </Link>
              <LogoutButton className="flex-1 rounded-md border border-white/10 py-1.5 text-center text-[10px] font-semibold text-slate-200 transition hover:bg-white/10" />
            </div>
          ) : (
            <div className="mt-1.5 hidden lg:block">
              <LogoutButton className="w-full rounded-md border border-white/10 py-1.5 text-center text-[9px] font-semibold text-slate-200 transition hover:bg-white/10" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
