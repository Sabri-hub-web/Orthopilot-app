"use client";

import { useEffect, useState } from "react";
import { LogsListResponse } from "@/types/domain";

const PAGE_SIZE = 12;

export function LogsView() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LogsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const response = await fetch(`/api/logs?page=${page}&pageSize=${PAGE_SIZE}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Echec du chargement des logs.");
        }

        const payload: LogsListResponse = await response.json();
        setData(payload);
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [page]);

  const canGoPrev = page > 1;
  const canGoNext = data ? page < data.totalPages : false;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Logs & activite</h3>
        <p className="text-xs text-slate-500">Page {data?.page ?? page}</p>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">Chargement des logs...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {data ? (
        <>
          <div className="mt-4 space-y-3">
            {data.items.map((log) => (
              <article key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm text-slate-900">{log.message}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {log.actor} - {log.createdAt}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {data.total} element(s) - page {data.page} / {data.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => prev - 1)}
                disabled={!canGoPrev}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Precedent
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!canGoNext}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
