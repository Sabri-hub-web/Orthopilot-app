"use client";

import { useCallback, useEffect, useState } from "react";
import type { PresenceTeamMember, PresenceTeamResponse } from "@/types/domain";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function presenceDot(m: PresenceTeamMember): string {
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
    <article className="shrink-0 rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm">
      <h3 className="text-[10px] font-semibold text-slate-900">Utilisateurs présents</h3>
      {loading ? (
        <p className="mt-1 text-[9px] text-slate-500">Chargement…</p>
      ) : !members.length ? (
        <p className="mt-1 text-[9px] text-slate-500">Aucune donnée.</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-1.5 py-px">
              <span className="relative shrink-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[8px] font-semibold text-white">
                  {initialsFromName(m.fullName)}
                </span>
                <span
                  className={`absolute -bottom-px -right-px h-1.5 w-1.5 rounded-full ring-1 ring-white ${presenceDot(m)}`}
                />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[10px] font-semibold text-slate-900">{m.fullName}</p>
                <p className="truncate text-[8px] text-slate-500">
                  {m.presenceLabel} · {m.roleLabel} · —
                </p>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
