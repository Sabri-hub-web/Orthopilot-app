"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Filter,
  LogIn,
  Mail,
  Users,
  X,
} from "lucide-react";
import { ActivityLog, LogsListResponse } from "@/types/domain";

const PAGE_SIZE = 15;
const MAX_PAGES = 20;

type LogColor = "green" | "violet" | "orange" | "red" | "slate";
type LogModule = "Emails" | "Patients" | "Règlements" | "Tâches" | "Documents" | "Agenda" | "Système";
type PeriodFilter = "today" | "7d" | "30d" | "all";

interface EnrichedLog extends ActivityLog {
  module: LogModule;
  color: LogColor;
  action: string;
  target: string;
}

const COLOR_BADGE: Record<LogColor, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  red: "bg-red-50 text-red-700 border-red-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};

const COLOR_DOT: Record<LogColor, string> = {
  green: "bg-emerald-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  slate: "bg-slate-400",
};

const MODULE_BAR: Record<LogModule, string> = {
  Emails: "bg-violet-500",
  Patients: "bg-sky-500",
  "Règlements": "bg-amber-500",
  "Tâches": "bg-emerald-500",
  Documents: "bg-orange-500",
  Agenda: "bg-indigo-400",
  "Système": "bg-slate-400",
};

const CHART_MODULES: LogModule[] = ["Emails", "Patients", "Règlements", "Tâches", "Documents"];

const SYSTEM_ACTORS = new Set(["Systeme", "Système", "Authentification"]);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayKeyOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function logDayKey(log: ActivityLog): string {
  return (log.createdAtIso ?? "").slice(0, 10);
}

function frDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function moduleOf(message: string): LogModule {
  const m = message.toLowerCase();
  if (/reglement|règlement|relance/.test(m)) return "Règlements";
  if (/email|gmail/.test(m)) return "Emails";
  if (/tache|tâche/.test(m)) return "Tâches";
  if (/document/.test(m)) return "Documents";
  if (/commentaire|patient/.test(m)) return "Patients";
  if (/calendrier|evenement|événement/.test(m)) return "Agenda";
  return "Système";
}

function colorOf(message: string): LogColor {
  const m = message.toLowerCase();
  if (/suppress|supprim|échec|echec|annul/.test(m)) return "red";
  if (/email/.test(m)) return "violet";
  if (/commentaire|document/.test(m)) return "orange";
  if (/creation|création|cree|créé|ajout|enregistr|termin|relance/.test(m)) return "green";
  return "slate";
}

function actionOf(message: string): string {
  const m = message.toLowerCase();
  if (m.startsWith("echec connexion")) return "Échec connexion";
  if (m.startsWith("connexion gmail")) return "Connexion Gmail";
  if (m.startsWith("synchronisation gmail")) return "Synchronisation Gmail";
  if (m.startsWith("connexion")) return "Connexion";
  if (m.startsWith("deconnexion")) return "Déconnexion";
  if (m.startsWith("creation patient")) return "Création patient";
  if (m.startsWith("modification patient")) return "Modification patient";
  if (m.includes("commentaire interne patient")) return "Note patient mise à jour";
  if (m.includes("commentaire patient ajout")) return "Commentaire ajouté";
  if (m.includes("commentaire patient marqué termin")) return "Commentaire terminé";
  if (m.includes("commentaire patient réactiv")) return "Commentaire réactivé";
  if (m.startsWith("document ajout")) return "Document ajouté";
  if (m.startsWith("creation tache")) return "Création tâche";
  if (m.startsWith("modification tache")) return "Modification tâche";
  if (m.startsWith("changement statut tache")) return "Statut tâche modifié";
  if (m.startsWith("tache terminee")) return "Tâche terminée";
  if (m.startsWith("assignation tache")) return "Tâche assignée";
  if (m.startsWith("suppression tache")) return "Tâche supprimée";
  if (m.startsWith("creation reglement")) return "Règlement ajouté";
  if (m.startsWith("modification reglement")) return "Règlement modifié";
  if (m.startsWith("changement statut reglement")) return "Statut règlement modifié";
  if (m.startsWith("suppression reglement")) return "Règlement supprimé";
  if (m.startsWith("relance enregistree")) return "Relance envoyée";
  if (m.startsWith("creation email")) return "Email créé";
  if (m.startsWith("modification email")) return "Email modifié";
  if (m.startsWith("changement statut email")) return "Statut email modifié";
  if (m.startsWith("changement categorie email")) return "Catégorie email modifiée";
  if (m.startsWith("assignation email")) return "Email assigné";
  if (m.startsWith("desassignation email")) return "Email désassigné";
  if (m.startsWith("suppression email")) return "Email supprimé";
  if (m.startsWith("import csv")) return "Import CSV";
  if (m.startsWith("message interne")) return "Message interne";
  if (m.includes("evenement calendrier")) return "Événement agenda";
  const idx = message.indexOf(":");
  return idx > 0 ? message.slice(0, idx).trim() : message.slice(0, 40);
}

function targetOf(message: string): string {
  const paren = message.match(/\(([^)]+)\)/);
  if (paren) return paren[1].trim();
  const idx = message.indexOf(":");
  if (idx >= 0) {
    const rest = message.slice(idx + 1).split("—")[0].split("->")[0].trim();
    return rest || "—";
  }
  return "—";
}

const ACTION_TYPE_OPTIONS: { value: "" | LogColor; label: string }[] = [
  { value: "", label: "Tous les types" },
  { value: "green", label: "Créations / clôtures" },
  { value: "violet", label: "Emails" },
  { value: "orange", label: "Commentaires / documents" },
  { value: "red", label: "Suppressions / alertes" },
  { value: "slate", label: "Modifications" },
];

export function LogsView() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<PeriodFilter>("7d");
  const [userFilter, setUserFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"" | LogModule>("");
  const [typeFilter, setTypeFilter] = useState<"" | LogColor>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const loadLogs = useCallback(async () => {
    const collected: ActivityLog[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const res = await fetch(`/api/logs?page=${currentPage}&pageSize=50`, { cache: "no-store" });
      if (!res.ok) throw new Error("Echec du chargement des logs.");
      const payload: LogsListResponse = await res.json();
      collected.push(...payload.items);
      totalPages = payload.totalPages;
      currentPage += 1;
    } while (currentPage <= totalPages && currentPage <= MAX_PAGES);
    setLogs(collected);
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadLogs();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue de chargement.");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [loadLogs]);

  const enriched: EnrichedLog[] = useMemo(
    () =>
      logs.map((log) => ({
        ...log,
        module: moduleOf(log.message),
        color: colorOf(log.message),
        action: actionOf(log.message),
        target: targetOf(log.message),
      })),
    [logs],
  );

  const userOptions = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) set.add(log.actor);
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = todayKey();
    const start = period === "today" ? today : period === "7d" ? dayKeyOffset(-7) : period === "30d" ? dayKeyOffset(-30) : "";
    return enriched.filter((log) => {
      const key = logDayKey(log);
      if (start && key && key < start) return false;
      if (period === "today" && key !== today) return false;
      if (userFilter && log.actor !== userFilter) return false;
      if (moduleFilter && log.module !== moduleFilter) return false;
      if (typeFilter && log.color !== typeFilter) return false;
      if (
        q &&
        !log.message.toLowerCase().includes(q) &&
        !log.actor.toLowerCase().includes(q) &&
        !log.action.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [enriched, period, userFilter, moduleFilter, typeFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [period, userFilter, moduleFilter, typeFilter, search]);

  const kpi = useMemo(() => {
    const today = todayKey();
    const yesterday = dayKeyOffset(-1);
    const todayLogs = enriched.filter((l) => logDayKey(l) === today);
    const yLogs = enriched.filter((l) => logDayKey(l) === yesterday);
    const activeUsers = new Set(todayLogs.filter((l) => !SYSTEM_ACTORS.has(l.actor)).map((l) => l.actor));
    const tasksDone = todayLogs.filter((l) => l.module === "Tâches" && /termin/.test(l.message.toLowerCase())).length;
    const emailsTreated = todayLogs.filter(
      (l) => l.module === "Emails" && /(->\s*traite|assignation email|traité)/i.test(l.message),
    ).length;
    const connexions = todayLogs.filter((l) => l.action === "Connexion").length;
    const diff = todayLogs.length - yLogs.length;
    const pct = yLogs.length > 0 ? Math.round((diff / yLogs.length) * 100) : todayLogs.length > 0 ? 100 : 0;
    return {
      actions: todayLogs.length,
      pct,
      activeUsers: activeUsers.size,
      tasksDone,
      emailsTreated,
      connexions,
      emailsToday: todayLogs.filter((l) => l.module === "Emails").length,
      reglementsToday: todayLogs.filter((l) => l.module === "Règlements").length,
      tachesToday: todayLogs.filter((l) => l.module === "Tâches").length,
    };
  }, [enriched]);

  const moduleStats = useMemo(() => {
    const counts = new Map<LogModule, number>();
    for (const log of enriched) counts.set(log.module, (counts.get(log.module) ?? 0) + 1);
    const max = Math.max(1, ...CHART_MODULES.map((m) => counts.get(m) ?? 0));
    return CHART_MODULES.map((m) => ({ module: m, count: counts.get(m) ?? 0, pct: ((counts.get(m) ?? 0) / max) * 100 }));
  }, [enriched]);

  const importantActions = useMemo(
    () => enriched.filter((l) => l.color === "green" || l.color === "violet" || l.color === "red").slice(0, 6),
    [enriched],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function logHref(log: EnrichedLog): string | null {
    if (!log.patientId) return null;
    if (log.module === "Règlements") return `/patients/${log.patientId}?tab=reglements`;
    if (log.module === "Documents") return `/patients/${log.patientId}?tab=documents`;
    if (log.module === "Patients") return `/patients/${log.patientId}?tab=commentaires`;
    return `/patients/${log.patientId}`;
  }

  function handleRowClick(log: EnrichedLog) {
    const href = logHref(log);
    if (href) router.push(href);
  }

  function exportCsv() {
    const header = ["Date / heure", "Utilisateur", "Action", "Module", "Cible", "Détails"];
    const lines = filtered.map((log) =>
      [frDateTime(log.createdAtIso), log.actor, log.action, log.module, log.target, log.message]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = [header.join(";"), ...lines].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activite-${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpiCards = [
    {
      title: "Actions aujourd'hui",
      value: kpi.actions,
      sub: `${kpi.pct >= 0 ? "+" : ""}${kpi.pct}% vs hier`,
      subClass: kpi.pct >= 0 ? "text-emerald-600" : "text-red-600",
      icon: Activity,
      tone: "bg-violet-50 text-violet-600",
    },
    { title: "Utilisateurs actifs", value: kpi.activeUsers, sub: "Aujourd'hui", icon: Users, tone: "bg-sky-50 text-sky-600" },
    { title: "Tâches terminées", value: kpi.tasksDone, sub: "Aujourd'hui", icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600" },
    { title: "Emails traités", value: kpi.emailsTreated, sub: "Aujourd'hui", icon: Mail, tone: "bg-orange-50 text-orange-600" },
    { title: "Connexions", value: kpi.connexions, sub: "Aujourd'hui", icon: LogIn, tone: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Logs &amp; activité</h2>
          <p className="text-sm text-slate-500">Le journal d&apos;activité métier du cabinet.</p>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {/* KPI */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium text-slate-500">{card.title}</p>
              <span className={`rounded-xl p-1.5 ${card.tone}`}>
                <card.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
            <p className={`text-[11px] ${card.subClass ?? "text-slate-500"}`}>{card.sub}</p>
          </article>
        ))}
      </section>

      {/* Filtres */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="today">Aujourd&apos;hui</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="all">Tout</option>
          </select>

          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="">Tous les utilisateurs</option>
            {userOptions.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value as typeof moduleFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="">Tous les modules</option>
            {(["Emails", "Patients", "Règlements", "Tâches", "Documents", "Agenda", "Système"] as LogModule[]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            {ACTION_TYPE_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition ${
              showAdvanced ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtres
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter
          </button>
        </div>

        {showAdvanced ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <div className="relative flex-1 min-w-[200px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans l'activité…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-violet-300"
              />
            </div>
            {(userFilter || moduleFilter || typeFilter || search || period !== "7d") ? (
              <button
                type="button"
                onClick={() => {
                  setUserFilter("");
                  setModuleFilter("");
                  setTypeFilter("");
                  setSearch("");
                  setPeriod("7d");
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Tableau + panneau droit */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Tableau */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.1fr_1fr_1.2fr_0.9fr_1.2fr] gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:grid">
            <span>Date / heure</span>
            <span>Utilisateur</span>
            <span>Action</span>
            <span>Module</span>
            <span>Cible</span>
          </div>

          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Chargement de l&apos;activité…</p>
          ) : pageItems.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Aucune activité pour ces filtres.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pageItems.map((log) => {
                const clickable = Boolean(logHref(log));
                return (
                  <li key={log.id}>
                    <div
                      role={clickable ? "button" : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={clickable ? () => handleRowClick(log) : undefined}
                      onKeyDown={
                        clickable
                          ? (e) => {
                              if (e.key === "Enter") handleRowClick(log);
                            }
                          : undefined
                      }
                      title={log.message}
                      className={`flex flex-col gap-1 px-4 py-3 transition lg:grid lg:grid-cols-[1.1fr_1fr_1.2fr_0.9fr_1.2fr] lg:items-center lg:gap-2 ${
                        clickable ? "cursor-pointer hover:bg-slate-50" : ""
                      }`}
                    >
                      <span className="text-xs text-slate-500">{frDateTime(log.createdAtIso)}</span>
                      <span className="truncate text-sm text-slate-700">{log.actor}</span>
                      <span className="inline-flex w-fit items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${COLOR_DOT[log.color]}`} />
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${COLOR_BADGE[log.color]}`}>
                          {log.action}
                        </span>
                      </span>
                      <span className="text-xs text-slate-600">{log.module}</span>
                      <span className="truncate text-xs text-slate-600" title={log.target}>
                        {log.target}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
            <span className="text-xs text-slate-500">
              {filtered.length} action{filtered.length > 1 ? "s" : ""} · page {page} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        </section>

        {/* Panneau droit */}
        <aside className="space-y-3">
          {/* Activité par module */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Activity className="h-4 w-4 text-violet-600" />
              Activité par module
            </h3>
            <div className="mt-3 space-y-2.5">
              {moduleStats.map((stat) => (
                <div key={stat.module}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{stat.module}</span>
                    <span className="font-medium text-slate-500">{stat.count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${MODULE_BAR[stat.module]}`} style={{ width: `${stat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Dernières actions importantes */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Dernières actions importantes</h3>
            <div className="mt-3 space-y-2">
              {importantActions.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune action récente.</p>
              ) : (
                importantActions.map((log) => {
                  const clickable = Boolean(logHref(log));
                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={clickable ? () => handleRowClick(log) : undefined}
                      className={`flex w-full items-start gap-2 rounded-xl border border-slate-100 p-2 text-left ${
                        clickable ? "hover:bg-slate-50" : "cursor-default"
                      }`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${COLOR_DOT[log.color]}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-slate-800">{log.action}</span>
                        <span className="block truncate text-[11px] text-slate-500">{log.target}</span>
                        <span className="block text-[10px] text-slate-400">{frDateTime(log.createdAtIso)}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Résumé du jour */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <CalendarDays className="h-4 w-4 text-violet-600" />
              Résumé du jour
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "Actions", value: kpi.actions, icon: Activity, tone: "text-violet-600" },
                { label: "Emails", value: kpi.emailsToday, icon: Mail, tone: "text-orange-600" },
                { label: "Règlements", value: kpi.reglementsToday, icon: CreditCard, tone: "text-amber-600" },
                { label: "Tâches", value: kpi.tachesToday, icon: FileText, tone: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">{item.label}</p>
                    <item.icon className={`h-3.5 w-3.5 ${item.tone}`} />
                  </div>
                  <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
