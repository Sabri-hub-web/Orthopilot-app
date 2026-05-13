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
    return {
      dot: "bg-orange-500",
      pill: "bg-orange-50 text-orange-800 ring-orange-100/90",
    };
  }
  if (!m.isOnline) {
    return {
      dot: "bg-slate-400",
      pill: "bg-slate-100 text-slate-600 ring-slate-200/90",
    };
  }
  switch (m.presenceStatus) {
    case "DISPONIBLE":
      return { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-800 ring-emerald-100/90" };
    case "EN_CONSULTATION":
      return { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-800 ring-sky-100/90" };
    case "EN_REUNION":
      return { dot: "bg-violet-500", pill: "bg-violet-50 text-violet-800 ring-violet-100/90" };
    case "ABSENT":
    default:
      return { dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600 ring-slate-200/90" };
  }
}

export function DashboardTeamPresence() {
  const [data, setData] = useState<PresenceTeamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/presence", { cache: "no-store" });
      if (res.status === 403 || res.status === 401) {
        setData(null);
        setError(null);
        return;
      }
      if (!res.ok) {
        setError("Impossible de charger la présence.");
        return;
      }
      const payload: PresenceTeamResponse = await res.json();
      setData(payload);
      setError(null);
    } catch {
      setError("Erreur réseau.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load();
    }, 45000);
    return () => window.clearInterval(id);
  }, [load]);

  const members = data?.members?.slice(0, 6) ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-2 py-1">
      {loading && !data && !error ? (
        <ul className="animate-pulse space-y-2 py-1">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex gap-2">
              <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-1 pt-0.5">
                <div className="h-2.5 max-w-[10rem] rounded bg-slate-100" />
                <div className="h-2 max-w-[6rem] rounded bg-slate-50" />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="flex flex-1 items-center justify-center px-1 text-center text-[10px] leading-snug text-rose-700">
          {error}
        </p>
      ) : null}

      {!loading && !error && !data ? (
        <p className="flex flex-1 items-center justify-center px-2 text-center text-[10px] leading-snug text-slate-500">
          Présence équipe réservée aux comptes autorisés.
        </p>
      ) : null}

      {!loading && !error && data && !members.length ? (
        <p className="flex flex-1 items-center justify-center px-2 text-center text-[10px] text-slate-500">
          Aucun collaborateur à afficher pour le moment.
        </p>
      ) : null}

      {members.length ? (
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
          {members.map((m) => {
            const { dot, pill } = presenceVisual(m);
            return (
              <li
                key={m.userId}
                className="flex items-center gap-1.5 rounded-lg border border-transparent px-0.5 py-1 transition hover:border-slate-100 hover:bg-slate-50/80"
              >
                <div className="relative shrink-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[9px] font-semibold text-white ring-2 ring-white">
                    {initialsFromName(m.fullName)}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white ${dot}`}
                    title={m.isOnline ? "Connecté" : "Hors ligne"}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-[11px] font-semibold leading-tight text-slate-900">{m.fullName}</p>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-px text-[8px] font-semibold leading-none ring-1 ${pill}`}
                    >
                      {m.presenceLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[9px] leading-tight text-slate-500">
                    {m.roleLabel}
                    <span className="text-slate-300"> · </span>
                    <span className="text-slate-400">—</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {!loading && data?.members && data.members.length > 6 ? (
        <p className="shrink-0 pt-0.5 text-center text-[9px] text-slate-400">+{data.members.length - 6} autres</p>
      ) : null}
    </div>
  );
}
