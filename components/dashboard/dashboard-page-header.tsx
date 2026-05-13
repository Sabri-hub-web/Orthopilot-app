interface DashboardPageHeaderProps {
  greetingName: string;
  currentDateLabel: string;
}

export function DashboardPageHeader({ greetingName, currentDateLabel }: DashboardPageHeaderProps) {
  const displayName = greetingName.trim() || "l’équipe";
  return (
    <header className="animate-dashboard-in mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
          Bonjour {displayName} <span className="inline-block">👋</span>
        </h1>
        <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-slate-600">
          Voici ce qui se passe aujourd’hui au cabinet.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm shadow-slate-900/5 sm:items-end sm:text-right">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Aujourd’hui</p>
        <p className="text-sm font-medium capitalize leading-snug text-slate-800">{currentDateLabel}</p>
        <p className="text-xs text-emerald-700">Cabinet opérationnel</p>
      </div>
    </header>
  );
}
