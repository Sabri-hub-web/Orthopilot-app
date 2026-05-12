"use client";

import { useEffect, useState } from "react";
import { PRESENCE_STATUS_VALUES, presenceStatusLabelMap } from "@/lib/presence";
import type { MyPresenceResponse } from "@/types/domain";

export function PresenceMeSelect() {
  const [status, setStatus] = useState<MyPresenceResponse["presenceStatus"]>("DISPONIBLE");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/presence/me", { cache: "no-store" });
        if (!res.ok) return;
        const data: MyPresenceResponse = await res.json();
        if (!cancelled) setStatus(data.presenceStatus);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onChange(next: MyPresenceResponse["presenceStatus"]) {
    setSaving(true);
    try {
      const res = await fetch("/api/presence/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presenceStatus: next }),
      });
      if (res.ok) {
        const data: MyPresenceResponse = await res.json();
        setStatus(data.presenceStatus);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return <span className="hidden text-xs text-slate-400 md:inline">...</span>;
  }

  return (
    <label className="hidden flex-col gap-0.5 md:flex">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">Mon statut</span>
      <select
        value={status}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as MyPresenceResponse["presenceStatus"])}
        className="max-w-[12rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
      >
        {PRESENCE_STATUS_VALUES.map((v) => (
          <option key={v} value={v}>
            {presenceStatusLabelMap[v]}
          </option>
        ))}
      </select>
    </label>
  );
}
