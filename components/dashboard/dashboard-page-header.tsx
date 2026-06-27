import { DashboardActionChips } from "@/components/dashboard/dashboard-quick-access";

interface DashboardPageHeaderProps {
  greetingName: string;
  currentDateLabel: string;
}

export function DashboardPageHeader({ greetingName, currentDateLabel }: DashboardPageHeaderProps) {
  const displayName = greetingName.trim() || "l’équipe";

  return (
    <header className="animate-dashboard-in shrink-0 border-b border-slate-200/80 pb-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            Bonjour {displayName} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-0.5 max-w-xl text-[11px] leading-snug text-slate-600">
            Voici ce qui se passe aujourd’hui au cabinet.
          </p>
          <p className="mt-0.5 text-[10px] font-medium capitalize leading-snug text-slate-400">
            {currentDateLabel}
          </p>
        </div>
        <DashboardActionChips className="shrink-0 lg:max-w-[28rem] lg:justify-end lg:pt-0.5" />
      </div>
    </header>
  );
}
