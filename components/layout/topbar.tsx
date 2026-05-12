import { Bell, Search } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { PresenceMeSelect } from "@/components/presence/presence-me-select";

interface TopbarProps {
  title: string;
  notificationsOpen: boolean;
  onToggleNotifications: () => void;
  unreadNotificationsCount: number;
  currentUserName: string;
  currentUserRole: string;
}

export function Topbar({
  title,
  notificationsOpen,
  onToggleNotifications,
  unreadNotificationsCount,
  currentUserName,
  currentUserRole,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">ORTHOPILOT</p>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <Search size={16} />
            <span>Rechercher patient, email, tache...</span>
          </div>
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
              </span>
            ) : null}
          </button>
          <PresenceMeSelect />
          {notificationsOpen ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
              Panneau ouvert
            </span>
          ) : null}
          <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right md:block">
            <p className="text-xs font-medium text-slate-800">{currentUserName}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{currentUserRole}</p>
          </div>
          <LogoutButton className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100" />
        </div>
      </div>
    </header>
  );
}
