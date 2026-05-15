"use client";

import { useCallback, useEffect, useState } from "react";
import type { PresenceTeamMember, PresenceTeamResponse } from "@/types/domain";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function presenceVisual(m: PresenceTeamMember): { dot: string; pill: string } {
  const label = m.presenceLabel.toLowerCase();
  if (label.includes("pause")) {
    return { dot: "bg-orange-500", pill: "bg-orange-50 text-orange-800 ring-orange-100/90" };
  }
  if (!m.isOnline) {
    return { dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600 ring-slate-200/90" };
  }
  switch (m.presenceStatus) {
    case "DISPONIBLE":
      return { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-800 ring-emerald-100/90" };
    case "EN_CONSULTATION":
      return { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-800 ring-sky-100/90" };
    case "EN_REUNION":
      return { dot: "bg-violet-500", pill: "bg-violet-50 text-violet-800 ring-violet-100/90" };
    default:
      return { dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600 ring-slate-200/90" };
  }
}

export function CalendarTeamPresence() {
  const [data, setData] = useState<PresenceTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/presence", { cache: "no-store" });
      if (res.status === 403 || res.status === 401) {
        setData(null);
        return;
      }
      if (res.ok) setData((await res.json()) as PresenceTeamResponse);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    const id = window.setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [load]);

  const members = data?.members?.slice(0, 6) ?? [];

  return (
    <article className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
      <h3 className="text-xs font-semibold text-slate-900">Utilisateurs présents</h3>
      {loading ? (
        <p className="mt-2 text-[10px] text-slate-500">Chargement…</p>
      ) : !members.length ? (
        <p className="mt-2 text-[10px] text-slate-500">Aucune donnée de présence.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {members.map((m) => {
            const { dot, pill } = presenceVisual(m);
            return (
              <li key={m.userId} className="flex items-center gap-2 rounded-lg px-0.5 py-1">
                <span className="relative shrink-0">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[9px] font-semibold text-white">
                    {initialsFromName(m.fullName)}
                  </span>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white ${dot}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-slate-900">{m.fullName}</p>
                  <p className="truncate text-[9px] text-slate-500">
                    {m.roleLabel} ·{" "}
                    <span className={`rounded px-1 py-px text-[8px] font-medium ring-1 ${pill}`}>
                      {m.presenceLabel}
                    </span>{" "}
                    · —
                  </p>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
