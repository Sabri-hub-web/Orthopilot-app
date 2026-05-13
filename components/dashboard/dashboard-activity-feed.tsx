"use client";

import { CheckCircle2, CreditCard, Mail, Send, UserPlus } from "lucide-react";
import type { ActivityFeedItem } from "@/lib/dashboard-ui";

const kindMeta: Record<
  ActivityFeedItem["kind"],
  { Icon: typeof Mail; bg: string }
> = {
  email: { Icon: Mail, bg: "bg-violet-50 text-violet-600 ring-violet-200/80" },
  task: { Icon: CheckCircle2, bg: "bg-sky-50 text-sky-600 ring-sky-200/80" },
  payment: { Icon: CreditCard, bg: "bg-amber-50 text-amber-700 ring-amber-200/80" },
  relance: { Icon: Send, bg: "bg-orange-50 text-orange-600 ring-orange-200/80" },
  patient: { Icon: UserPlus, bg: "bg-emerald-50 text-emerald-700 ring-emerald-200/80" },
};

export function DashboardActivityFeed({
  items,
  compact = false,
}: {
  items: ActivityFeedItem[];
  compact?: boolean;
}) {
  if (!items.length) {
    return (
      <p className={`text-center text-slate-500 ${compact ? "py-4 text-[10px]" : "py-6 text-sm"}`}>
        Aucune activité récente.
      </p>
    );
  }

  return (
    <ul className={compact ? "divide-y divide-slate-100" : "relative space-y-0"}>
      {!compact ? (
        <div
          className="pointer-events-none absolute bottom-3 left-[17px] top-3 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent"
          aria-hidden
        />
      ) : null}
      {items.map((item) => {
        const { Icon, bg } = kindMeta[item.kind];
        if (compact) {
          return (
            <li key={item.id} className="flex items-start gap-2 py-1.5 first:pt-0">
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-white ${bg}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.65} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[10px] font-medium leading-snug text-slate-900">{item.title}</p>
                {item.subtitle ? (
                  <p className="mt-0.5 truncate text-[9px] text-slate-500">{item.subtitle}</p>
                ) : null}
              </div>
              <span className="shrink-0 pt-0.5 text-[9px] font-semibold tabular-nums text-slate-400">
                {item.timeLabel}
              </span>
            </li>
          );
        }
        return (
          <li key={item.id} className="relative flex gap-2 py-3 pl-1">
            <span
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-white ${bg}`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium leading-snug text-slate-900">{item.title}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{item.subtitle}</p>
              <p className="mt-1 text-[11px] font-medium tabular-nums text-slate-400">{item.timeLabel}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
