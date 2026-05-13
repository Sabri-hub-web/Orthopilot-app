"use client";

import { useCallback, useEffect, useState } from "react";
import type { PresenceTeamResponse } from "@/types/domain";

export function PresenceTeamWidget() {
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
        setError("Impossible de charger la presence equipe.");
        return;
      }
      const payload: PresenceTeamResponse = await res.json();
      setData(payload);
      setError(null);
    } catch {
      setError("Erreur reseau.");
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

  if (loading && !data && !error) {
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-sm text-slate-500 shadow-sm shadow-slate-900/5">
        Chargement présence équipe…
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200/80 bg-rose-50/90 p-5 text-sm text-rose-900 shadow-sm">
        {error}
      </section>
    );
  }

  if (!data?.members.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">Présence équipe</h3>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs font-semibold text-sky-600 transition hover:text-sky-700"
        >
          Actualiser
        </button>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        Session active = connecté. Statut choisi par chaque utilisateur (barre du haut).
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="pb-2 font-medium"> </th>
              <th className="pb-2 font-medium">Nom</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Statut</th>
              <th className="pb-2 font-medium">Activite</th>
            </tr>
          </thead>
          <tbody>
            {data.members.map((m) => (
              <tr key={m.userId} className="border-t border-slate-100">
                <td className="py-2 pr-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      m.isOnline ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    title={m.isOnline ? "Connecte" : "Hors ligne"}
                  />
                </td>
                <td className="py-2 font-medium text-slate-900">{m.fullName}</td>
                <td className="py-2 text-slate-600">{m.roleLabel}</td>
                <td className="py-2 text-slate-700">{m.presenceLabel}</td>
                <td className="py-2 text-xs text-slate-500">
                  {m.isOnline && m.lastSeenAt
                    ? `Vu ${new Date(m.lastSeenAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                    : m.isOnline
                      ? "En ligne"
                      : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
