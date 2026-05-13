import { Bell, Search } from "lucide-react";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

interface DashboardPageHeaderProps {
  greetingName: string;
  currentDateLabel: string;
  userDisplayName: string;
  userRoleLabel: string;
}

export function DashboardPageHeader({
  greetingName,
  currentDateLabel,
  userDisplayName,
  userRoleLabel,
}: DashboardPageHeaderProps) {
  const displayName = greetingName.trim() || "l’équipe";
  const initials = initialsFromName(userDisplayName);

  return (
    <header className="animate-dashboard-in mb-3 flex shrink-0 flex-col gap-3 border-b border-slate-200/80 pb-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          Bonjour {displayName} <span className="inline-block">👋</span>
        </h1>
        <p className="mt-0.5 max-w-xl text-xs leading-snug text-slate-600">
          Voici ce qui se passe aujourd’hui au cabinet.
        </p>
        <p className="mt-1 text-[11px] font-medium capitalize leading-snug text-slate-400">{currentDateLabel}</p>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-3">
        <div className="relative min-w-0 flex-1 sm:min-w-[220px] sm:max-w-[320px] md:min-w-[260px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            readOnly
            placeholder="Rechercher un patient, une tâche…"
            className="w-full cursor-default rounded-xl border border-slate-200/90 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 shadow-sm outline-none ring-sky-500/20 placeholder:text-slate-400 focus:ring-2"
            aria-label="Recherche (aperçu)"
          />
        </div>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.65} aria-hidden />
        </button>
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-semibold text-white ring-2 ring-slate-100">
            {initials}
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-xs font-semibold text-slate-900">{userDisplayName}</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">{userRoleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
