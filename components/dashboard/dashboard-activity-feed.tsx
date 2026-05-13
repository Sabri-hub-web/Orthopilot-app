"use client";

import { CheckCircle2, CreditCard, Mail } from "lucide-react";
import type { ActivityFeedItem } from "@/lib/dashboard-ui";

const kindMeta: Record<
  ActivityFeedItem["kind"],
  { Icon: typeof Mail; bg: string }
> = {
  email: { Icon: Mail, bg: "bg-violet-50 text-violet-600 ring-violet-200/80" },
  task: { Icon: CheckCircle2, bg: "bg-sky-50 text-sky-600 ring-sky-200/80" },
  payment: { Icon: CreditCard, bg: "bg-amber-50 text-amber-700 ring-amber-200/80" },
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
      <p className={`text-center text-slate-500 ${compact ? "py-2 text-[10px]" : "py-6 text-sm"}`}>
        Aucune activité récente.
      </p>
    );
  }

  const lineLeft = compact ? "left-[13px]" : "left-[17px]";
  const topPad = compact ? "top-2" : "top-3";
  const botPad = compact ? "bottom-2" : "bottom-3";

  return (
    <ul className="relative space-y-0">
      <div
        className={`pointer-events-none absolute ${botPad} ${lineLeft} ${topPad} w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent`}
        aria-hidden
      />
      {items.map((item) => {
        const { Icon, bg } = kindMeta[item.kind];
        return (
          <li key={item.id} className={`relative flex gap-2 pl-0.5 ${compact ? "py-1" : "py-3 pl-1"}`}>
            <span
              className={`relative z-10 flex shrink-0 items-center justify-center rounded-full ring-2 ring-white ${compact ? "h-6 w-6" : "h-9 w-9"} ${bg}`}
            >
              <Icon className={compact ? "h-3 w-3" : "h-4 w-4"} strokeWidth={1.75} aria-hidden />
            </span>
            <div className={`min-w-0 flex-1 ${compact ? "pt-0" : "pt-0.5"}`}>
              <p
                className={`font-medium leading-snug text-slate-900 ${compact ? "line-clamp-1 text-[10px]" : "text-sm"}`}
              >
                {item.title}
              </p>
              {!compact ? (
                <p className="mt-0.5 truncate text-xs text-slate-500">{item.subtitle}</p>
              ) : null}
              <p className={`font-medium tabular-nums text-slate-400 ${compact ? "text-[8px]" : "mt-1 text-[11px]"}`}>
                {item.timeLabel}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
