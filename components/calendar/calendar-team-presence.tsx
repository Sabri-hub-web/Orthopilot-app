"use client";

import { useCallback, useEffect, useState } from "react";
import type { PresenceTeamMember, PresenceTeamResponse } from "@/types/domain";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function presenceBadgeClass(m: PresenceTeamMember): string {
  const label = m.presenceLabel.toLowerCase();
  if (label.includes("pause")) return "bg-orange-100 text-orange-800";
  if (!m.isOnline) return "bg-slate-100 text-slate-600";
  switch (m.presenceStatus) {
    case "DISPONIBLE":
      return "bg-emerald-100 text-emerald-800";
    case "EN_CONSULTATION":
      return "bg-sky-100 text-sky-800";
    case "EN_REUNION":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function presenceDotClass(m: PresenceTeamMember): string {
  const label = m.presenceLabel.toLowerCase();
  if (label.includes("pause")) return "bg-orange-500";
  if (!m.isOnline) return "bg-slate-400";
  switch (m.presenceStatus) {
    case "DISPONIBLE":
      return "bg-emerald-500";
    case "EN_CONSULTATION":
      return "bg-sky-500";
    case "EN_REUNION":
      return "bg-violet-500";
    default:
      return "bg-slate-400";
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

  const members = data?.members?.slice(0, 5) ?? [];

  return (
    <article className="shrink-0 rounded-2xl border border-slate-200/70 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h3 className="text-[11px] font-semibold text-slate-900">Utilisateurs présents</h3>
      {loading ? (
        <p className="mt-2 text-[10px] text-slate-500">Chargement…</p>
      ) : !members.length ? (
        <p className="mt-2 text-[10px] text-slate-500">Aucune donnée.</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center gap-2 rounded-xl border border-slate-100/80 bg-slate-50/40 px-2 py-1.5"
            >
              <span className="relative shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[9px] font-bold text-white shadow-sm">
                  {initialsFromName(m.fullName)}
                </span>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white ${presenceDotClass(m)}`}
                />
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-slate-900">{m.fullName}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1">
                  <span
                    className={`inline-flex rounded-md px-1.5 py-px text-[9px] font-semibold ${presenceBadgeClass(m)}`}
                  >
                    {m.presenceLabel}
                  </span>
                  <span className="text-[9px] text-slate-500">Salle —</span>
                </p>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
