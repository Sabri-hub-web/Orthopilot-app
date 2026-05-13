interface DashboardPageHeaderProps {
  greetingName: string;
  currentDateLabel: string;
}

export function DashboardPageHeader({ greetingName, currentDateLabel }: DashboardPageHeaderProps) {
  const displayName = greetingName.trim() || "l’équipe";
  return (
    <header className="animate-dashboard-in mb-2 flex shrink-0 flex-col gap-2 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
          Bonjour {displayName} <span className="inline-block">👋</span>
        </h1>
        <p className="mt-0.5 max-w-xl text-xs leading-snug text-slate-600">
          Voici ce qui se passe aujourd’hui au cabinet.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-0.5 rounded-xl border border-slate-200/80 bg-white/90 px-2.5 py-2 text-left shadow-sm sm:items-end sm:text-right">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Aujourd’hui</p>
        <p className="max-w-[14rem] text-[11px] font-medium capitalize leading-snug text-slate-800">
          {currentDateLabel}
        </p>
        <p className="text-[10px] text-emerald-700">Cabinet opérationnel</p>
      </div>
    </header>
  );
}
