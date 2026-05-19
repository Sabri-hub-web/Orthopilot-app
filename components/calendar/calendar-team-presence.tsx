"use client";

import { useCallback, useEffect, useState } from "react";
import type { PresenceTeamMember, PresenceTeamResponse } from "@/types/domain";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function statusPillClass(m: PresenceTeamMember): string {
  const label = m.presenceLabel.toLowerCase();
  if (label.includes("pause")) return "text-orange-700";
  if (!m.isOnline) return "text-slate-500";
  switch (m.presenceStatus) {
    case "DISPONIBLE":
      return "text-emerald-700";
    case "EN_CONSULTATION":
      return "text-sky-700";
    case "EN_REUNION":
      return "text-violet-700";
    default:
      return "text-slate-500";
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
    <article className="shrink-0 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Utilisateurs présents
      </h3>
      {loading ? (
        <p className="mt-2 text-[11px] text-slate-500">Chargement…</p>
      ) : !members.length ? (
        <p className="mt-2 text-[11px] text-slate-500">Aucune donnée.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-2 py-0.5">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[9px] font-bold text-white">
                {initialsFromName(m.fullName)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] leading-tight">
                <span className="font-semibold text-slate-900">{m.fullName}</span>
                <span className="text-slate-400"> · </span>
                <span className={`font-medium ${statusPillClass(m)}`}>{m.presenceLabel}</span>
                <span className="text-slate-400"> · Salle 1</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
