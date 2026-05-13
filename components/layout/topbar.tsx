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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/5 backdrop-blur-md">
      <div className="flex min-h-[3.25rem] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="min-w-0 flex-1">
            <nav aria-label="Fil d'Ariane" className="mb-0.5 flex flex-wrap items-center gap-1 text-[11px] font-medium text-slate-400">
              {crumbs.map((c, i) => (
                <span key={`${c}-${i}`} className="flex items-center gap-1">
                  {i > 0 ? <ChevronRight className="h-3 w-3 opacity-60" aria-hidden /> : null}
                  <span className={i === crumbs.length - 1 ? "text-slate-600" : ""}>{c}</span>
                </span>
              ))}
            </nav>
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900 lg:text-[1.05rem]">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:mx-4 lg:max-w-xl lg:flex-1">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              readOnly
              placeholder="Rechercher patient, email, tâche…"
              className="w-full cursor-default rounded-xl border border-slate-200/90 bg-slate-50/80 py-2 pl-9 pr-3 text-[13px] text-slate-800 shadow-inner shadow-slate-900/5 outline-none ring-sky-500/20 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2"
              title="Recherche globale — à connecter"
              aria-label="Recherche (bientôt disponible)"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <PresenceMeSelect compact />
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            ) : null}
          </button>
          {notificationsOpen ? (
            <span className="hidden rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700 xl:inline">
              Panneau ouvert
            </span>
          ) : null}
          <div className="hidden max-w-[10rem] flex-col rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-right shadow-sm sm:flex">
            <span className="truncate text-xs font-semibold text-slate-800">{currentUserName}</span>
            <span className="truncate text-[10px] uppercase tracking-wide text-slate-500">{currentUserRole}</span>
          </div>
          <LogoutButton className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50" />
        </div>
      </div>
    </header>
  );
}
