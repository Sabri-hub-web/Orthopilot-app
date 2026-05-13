"use client";

import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { PresenceMeSelect } from "@/components/presence/presence-me-select";

const routeLabels: Record<string, string> = {
  "/": "Tableau de bord",
  "/calendar": "Calendrier",
  "/messages": "Messages",
  "/reglements": "Règlements",
  "/emails": "Emails",
  "/patients": "Patients",
  "/tasks": "Tâches",
  "/logs": "Logs",
  "/settings": "Paramètres",
};

function breadcrumbForPath(pathname: string): string[] {
  if (pathname === "/") return ["OrthoPilot", "Tableau de bord"];
  const segments = pathname.split("/").filter(Boolean);
  const first = `/${segments[0] ?? ""}`;
  const main = routeLabels[first] ?? segments[0] ?? "";
  if (segments.length === 1) return ["OrthoPilot", main];
  const sub = segments.slice(1).join(" / ");
  return ["OrthoPilot", main, sub];
}

interface TopbarProps {
  title: string;
  notificationsOpen: boolean;
  onToggleNotifications: () => void;
  unreadNotificationsCount: number;
  currentUserName: string;
  currentUserRole: string;
  onOpenMobileNav: () => void;
}

export function Topbar({
  title,
  notificationsOpen,
  onToggleNotifications,
  unreadNotificationsCount,
  currentUserName,
  currentUserRole,
  onOpenMobileNav,
}: TopbarProps) {
  const pathname = usePathname();
  const crumbs = breadcrumbForPath(pathname);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-md">
      <div className="flex flex-col gap-2 px-3 py-2 lg:flex-row lg:items-center lg:gap-3 lg:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <div className="min-w-0 flex-1">
            <nav
              aria-label="Fil d'Ariane"
              className="mb-0.5 flex flex-wrap items-center gap-0.5 text-[10px] font-medium text-slate-400"
            >
              {crumbs.map((c, i) => (
                <span key={`${c}-${i}`} className="flex items-center gap-0.5">
                  {i > 0 ? <ChevronRight className="h-2.5 w-2.5 opacity-60" aria-hidden /> : null}
                  <span className={i === crumbs.length - 1 ? "text-slate-600" : ""}>{c}</span>
                </span>
              ))}
            </nav>
            <h2 className="truncate text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          </div>
        </div>

        <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:items-center lg:mx-2 lg:max-w-md lg:flex-1 xl:max-w-lg">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              readOnly
              placeholder="Rechercher patient, email, tâche…"
              className="w-full cursor-default rounded-lg border border-slate-200/90 bg-slate-50/90 py-1.5 pl-8 pr-2 text-xs text-slate-800 shadow-inner outline-none ring-sky-500/20 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-1"
              title="Recherche globale — à connecter"
              aria-label="Recherche (bientôt disponible)"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <PresenceMeSelect compact />
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white">
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            ) : null}
          </button>
          {notificationsOpen ? (
            <span className="hidden rounded-full bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700 xl:inline">
              Panneau ouvert
            </span>
          ) : null}
          <div className="hidden max-w-[9rem] flex-col rounded-lg border border-slate-200/90 bg-white px-2 py-1 text-right shadow-sm sm:flex">
            <span className="truncate text-[11px] font-semibold text-slate-800">{currentUserName}</span>
            <span className="truncate text-[9px] uppercase tracking-wide text-slate-500">{currentUserRole}</span>
          </div>
          <LogoutButton className="rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50" />
        </div>
      </div>
    </header>
  );
}
