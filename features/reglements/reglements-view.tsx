"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  Eye,
  Filter,
  History,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  PatientCommentLine,
  PatientHubResponse,
  PatientListItem,
  PaymentFollowUp,
  ReglementFormPayload,
  ReglementSemestreApi,
  ReglementsListResponse,
  ReglementStatusApi,
  UsersListItem,
} from "@/types/domain";
import {
  REGLEMENT_SEMESTRE_VALUES,
  REGLEMENT_STATUS_VALUES,
  reglementSemestreLabelMap,
  reglementStatusLabelMap,
} from "@/lib/reglements";

const PAGE_SIZE = 8;

type StatusLabel = PaymentFollowUp["status"];
type PaymentBucket = "paid" | "green" | "orange" | "red";
type RelanceFilter = "all" | "none" | "has";
type KpiFilter = null | "green" | "orange" | "red" | "relance";
type CommentFilter = "active" | "done" | "all";

const statusOptions = REGLEMENT_STATUS_VALUES.map((value) => ({
  value,
  label: reglementStatusLabelMap[value],
}));

const semestreOptions = REGLEMENT_SEMESTRE_VALUES.map((value) => ({
  value,
  label: reglementSemestreLabelMap[value],
}));

const defaultForm: ReglementFormPayload = {
  patientId: "",
  amountDue: 0,
  dueDate: "",
  status: "EN_ATTENTE",
  semestre: "SEMESTRE_1",
  comment: "",
};

const statusBadgeStyles: Record<StatusLabel, string> = {
  "En attente": "bg-slate-100 text-slate-700 border-slate-200",
  "En retard": "bg-red-50 text-red-700 border-red-100",
  "Relance envoyee": "bg-orange-50 text-orange-700 border-orange-100",
  Partiel: "bg-amber-50 text-amber-800 border-amber-100",
  Regle: "bg-emerald-50 text-emerald-800 border-emerald-100",
};

const bucketMeta: Record<
  PaymentBucket,
  { label: string; badge: string; bar: string; tone: string; health: string }
> = {
  paid: {
    label: "Réglé",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    tone: "text-emerald-700",
    health: "Paiement à jour",
  },
  green: {
    label: "À jour",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    tone: "text-emerald-700",
    health: "Paiement à jour",
  },
  orange: {
    label: "À surveiller",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    bar: "bg-orange-500",
    tone: "text-orange-700",
    health: "Retard modéré",
  },
  red: {
    label: "Retard critique",
    badge: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
    tone: "text-red-700",
    health: "Retard critique",
  },
};

function paymentBucket(item: PaymentFollowUp): PaymentBucket {
  if (item.status === "Regle") return "paid";
  if (item.daysLate <= 30) return "green";
  if (item.daysLate <= 60) return "orange";
  return "red";
}

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function euro(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value || 0);
}

function frDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

function frDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function relanceLabel(count: number): string {
  if (count <= 0) return "Aucune";
  return count === 1 ? "1 relance" : `${count} relances`;
}

export function ReglementsView() {
  const [items, setItems] = useState<PaymentFollowUp[]>([]);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [relanceFilter, setRelanceFilter] = useState<RelanceFilter>("all");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [page, setPage] = useState(1);

  // selection / detail panel
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hub, setHub] = useState<PatientHubResponse | null>(null);
  const [hubLoading, setHubLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentRecipientId, setCommentRecipientId] = useState("");
  const [commentFilter, setCommentFilter] = useState<CommentFilter>("active");
  const [commentLoading, setCommentLoading] = useState(false);

  // create / edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReglementFormPayload>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadReglements = useCallback(async () => {
    const collected: PaymentFollowUp[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const res = await fetch(`/api/reglements?page=${currentPage}&pageSize=100`, { cache: "no-store" });
      if (!res.ok) throw new Error("Echec du chargement des règlements.");
      const payload: ReglementsListResponse = await res.json();
      collected.push(...payload.items);
      totalPages = payload.totalPages;
      currentPage += 1;
    } while (currentPage <= totalPages);
    setItems(collected);
  }, []);

  const loadPatients = useCallback(async () => {
    const collected: PatientListItem[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const res = await fetch(`/api/patients?page=${currentPage}&pageSize=100`, { cache: "no-store" });
      if (!res.ok) break;
      const payload = await res.json();
      collected.push(...(payload.items ?? []));
      totalPages = payload.totalPages ?? 1;
      currentPage += 1;
    } while (currentPage <= totalPages);
    setPatients(collected);
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await Promise.all([loadReglements(), loadPatients()]);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue de chargement.");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [loadReglements, loadPatients]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        if (!res.ok) return;
        const payload = await res.json();
        setUsers(payload.items ?? []);
      } catch {
        // optionnel
      }
    }
    loadUsers();
  }, []);

  const patientRdvMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const p of patients) map.set(p.id, p.nextAppointmentAt);
    return map;
  }, [patients]);

  // KPI counts
  const kpi = useMemo(() => {
    const nonPaid = items.filter((i) => i.status !== "Regle");
    const green = nonPaid.filter((i) => paymentBucket(i) === "green").length;
    const orange = nonPaid.filter((i) => paymentBucket(i) === "orange").length;
    const red = nonPaid.filter((i) => paymentBucket(i) === "red").length;
    const relance = nonPaid.filter((i) => i.daysLate > 0).length;
    const remainingTotal = nonPaid.reduce((acc, i) => acc + Number(i.amountDue || 0), 0);
    const denom = Math.max(1, nonPaid.length);
    return {
      green,
      orange,
      red,
      relance,
      remainingTotal,
      greenPct: Math.round((green / denom) * 100),
      orangePct: Math.round((orange / denom) * 100),
      redPct: Math.round((red / denom) * 100),
      relancePct: Math.round((relance / denom) * 100),
    };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = amountMin === "" ? null : Number.parseFloat(amountMin);
    const max = amountMax === "" ? null : Number.parseFloat(amountMax);
    return items.filter((item) => {
      if (q && !item.patientName.toLowerCase().includes(q)) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (semesterFilter && item.semestre !== semesterFilter) return false;
      if (relanceFilter === "none" && item.relanceCount > 0) return false;
      if (relanceFilter === "has" && item.relanceCount === 0) return false;
      if (min !== null && !Number.isNaN(min) && item.amountDue < min) return false;
      if (max !== null && !Number.isNaN(max) && item.amountDue > max) return false;
      if (kpiFilter) {
        if (kpiFilter === "relance") {
          if (!(item.status !== "Regle" && item.daysLate > 0)) return false;
        } else if (paymentBucket(item) !== kpiFilter) {
          return false;
        }
      }
      return true;
    });
  }, [items, search, statusFilter, semesterFilter, relanceFilter, amountMin, amountMax, kpiFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, semesterFilter, relanceFilter, amountMin, amountMax, kpiFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const loadHub = useCallback(async (patientId: string) => {
    try {
      setHubLoading(true);
      const res = await fetch(`/api/patients/${patientId}`, { cache: "no-store" });
      if (!res.ok) {
        setHub(null);
        return;
      }
      const payload: PatientHubResponse = await res.json();
      setHub(payload);
    } catch {
      setHub(null);
    } finally {
      setHubLoading(false);
    }
  }, []);

  function handleSelect(item: PaymentFollowUp) {
    setSelectedId(item.id);
    setCommentDraft("");
    setCommentRecipientId("");
    setCommentFilter("active");
    setHub(null);
    void loadHub(item.patientId);
  }

  async function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !commentDraft.trim()) return;
    try {
      setCommentLoading(true);
      const res = await fetch(`/api/patients/${selected.patientId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentDraft.trim(), recipientId: commentRecipientId || null }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      const created: PatientCommentLine = await res.json();
      setHub((prev) => (prev ? { ...prev, comments: [created, ...prev.comments] } : prev));
      setCommentDraft("");
      setCommentRecipientId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur ajout commentaire.");
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleToggleCommentDone(commentId: string, isDone: boolean) {
    if (!selected) return;
    try {
      const res = await fetch(`/api/patients/${selected.patientId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      const updated: PatientCommentLine = await res.json();
      setHub((prev) =>
        prev ? { ...prev, comments: prev.comments.map((c) => (c.id === commentId ? updated : c)) } : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur mise à jour commentaire.");
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError(null);
      await Promise.all([loadReglements(), loadPatients()]);
      setSuccess("Liste règlements actualisée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de rafraîchir.");
    } finally {
      setRefreshing(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(selected ? { ...defaultForm, patientId: selected.patientId } : defaultForm);
    setModalOpen(true);
  }

  function openEdit(item: PaymentFollowUp) {
    const statusValue =
      statusOptions.find((o) => o.label === item.status)?.value ?? ("EN_ATTENTE" as ReglementStatusApi);
    setEditingId(item.id);
    setForm({
      patientId: item.patientId,
      amountDue: item.amountDue,
      dueDate: item.dueDate,
      status: statusValue,
      semestre: item.semestre ?? "HORS_SEMESTRE",
      comment: item.comment ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const url = editingId ? `/api/reglements/${editingId}` : "/api/reglements";
      const method = editingId ? "PATCH" : "POST";
      const body = {
        patientId: form.patientId,
        amountDue: form.amountDue,
        dueDate: form.dueDate,
        status: form.status,
        semestre: form.semestre,
        comment: form.comment === "" ? null : form.comment,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadReglements();
      setModalOpen(false);
      setSuccess(editingId ? "Règlement mis à jour." : "Règlement créé.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function quickStatusUpdate(reglementId: string, status: ReglementStatusApi) {
    try {
      setError(null);
      const res = await fetch(`/api/reglements/${reglementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadReglements();
      setSuccess("Statut mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  async function handleRelance(reglementId: string) {
    try {
      setError(null);
      const res = await fetch(`/api/reglements/${reglementId}/relance`, { method: "POST" });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadReglements();
      if (selected) void loadHub(selected.patientId);
      setSuccess("Relance enregistrée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  async function handleDelete(reglementId: string) {
    if (!window.confirm("Supprimer ce règlement ? Cette action est définitive.")) return;
    try {
      setError(null);
      const res = await fetch(`/api/reglements/${reglementId}`, { method: "DELETE" });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadReglements();
      if (selectedId === reglementId) {
        setSelectedId(null);
        setHub(null);
      }
      setSuccess("Règlement supprimé.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  function exportCsv() {
    const header = [
      "Patient",
      "Montant (€)",
      "Semestre / Période",
      "Échéance",
      "Prochain RDV",
      "Statut",
      "Jours de retard",
    ];
    const lines = filtered.map((item) => {
      const rdv = patientRdvMap.get(item.patientId) ?? null;
      const amount = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(item.amountDue);
      return [
        item.patientName,
        amount,
        item.semestreLabel,
        frDate(item.dueDate),
        frDate(rdv),
        item.status,
        String(item.daysLate),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";");
    });
    const csv = `\uFEFF${[header.join(";"), ...lines].join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reglements_orthopilot_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpiCards = [
    {
      key: "green" as const,
      title: "À jour",
      count: kpi.green,
      pct: kpi.greenPct,
      bar: "bg-emerald-500",
      track: "bg-emerald-100",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "orange" as const,
      title: "À surveiller",
      count: kpi.orange,
      pct: kpi.orangePct,
      bar: "bg-orange-500",
      track: "bg-orange-100",
      icon: Clock3,
      iconClass: "bg-orange-50 text-orange-600",
    },
    {
      key: "red" as const,
      title: "Retard critique",
      count: kpi.red,
      pct: kpi.redPct,
      bar: "bg-red-500",
      track: "bg-red-100",
      icon: AlertTriangle,
      iconClass: "bg-red-50 text-red-600",
    },
  ];

  const visibleComments = (hub?.comments ?? []).filter((c) =>
    commentFilter === "all" ? true : commentFilter === "done" ? c.isDone : !c.isDone,
  );

  return (
    <div className="space-y-4 pb-4">
      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {/* KPI global — Reste à encaisser */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-slate-500">Reste à encaisser</p>
            <p className="text-2xl font-bold text-slate-900">{euro(kpi.remainingTotal)}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Sur {items.filter((i) => i.status !== "Regle").length} règlement(s) non soldé(s)
        </p>
      </section>

      {/* Zone 1 — KPI */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const active = kpiFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setKpiFilter((prev) => (prev === card.key ? null : card.key))}
              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow ${
                active ? "border-violet-300 ring-2 ring-violet-500/15" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">{card.title}</p>
                <span className={`rounded-xl p-1.5 ${card.iconClass}`}>
                  <card.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.count}</p>
              <p className="text-[11px] text-slate-500">patient{card.count > 1 ? "s" : ""}</p>
              <div className={`mt-3 h-1.5 w-full overflow-hidden rounded-full ${card.track}`}>
                <div className={`h-full rounded-full ${card.bar}`} style={{ width: `${Math.min(100, card.pct)}%` }} />
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setKpiFilter((prev) => (prev === "relance" ? null : "relance"))}
          className={`flex flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow ${
            kpiFilter === "relance" ? "border-violet-300 ring-2 ring-violet-500/15" : "border-slate-200"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">Relances aujourd&apos;hui</p>
            <span className="rounded-xl bg-violet-50 p-1.5 text-violet-600">
              <Bell className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpi.relance}</p>
          <p className="text-[11px] text-slate-500">relance{kpi.relance > 1 ? "s" : ""} à effectuer</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700">
            Voir la liste
            <span aria-hidden>→</span>
          </span>
        </button>
      </section>

      {/* Zone 2 — Barre de filtres */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un patient…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="">Tous les statuts</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="">Tous les semestres</option>
            {semestreOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={relanceFilter}
            onChange={(e) => setRelanceFilter(e.target.value as RelanceFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="all">Toutes relances</option>
            <option value="none">Sans relance</option>
            <option value="has">Avec relance</option>
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition ${
              showAdvanced ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtres avancés
            <ChevronDown className={`h-3.5 w-3.5 transition ${showAdvanced ? "rotate-180" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing || loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            title="Rafraîchir la liste"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Actualisation…" : "Rafraîchir"}
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau règlement
          </button>
        </div>

        {showAdvanced ? (
          <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
            <label className="flex flex-col gap-1 text-xs text-slate-500">
              Montant min (€)
              <input
                type="number"
                min={0}
                value={amountMin}
                onChange={(e) => setAmountMin(e.target.value)}
                className="h-9 w-32 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                placeholder="0"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-500">
              Montant max (€)
              <input
                type="number"
                min={0}
                value={amountMax}
                onChange={(e) => setAmountMax(e.target.value)}
                className="h-9 w-32 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                placeholder="—"
              />
            </label>
            {(amountMin || amountMax || kpiFilter || statusFilter || semesterFilter || relanceFilter !== "all") ? (
              <button
                type="button"
                onClick={() => {
                  setAmountMin("");
                  setAmountMax("");
                  setKpiFilter(null);
                  setStatusFilter("");
                  setSemesterFilter("");
                  setRelanceFilter("all");
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Zone 3 — Tableau + panneau */}
      <div className={`grid gap-4 ${selected ? "xl:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]" : "grid-cols-1"}`}>
        {/* Tableau central */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.6fr_0.9fr_1.3fr_1fr_1fr_0.9fr_auto] gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
            <span>Patient</span>
            <span>Montant</span>
            <span>Semestre</span>
            <span>Prochain RDV</span>
            <span>Statut</span>
            <span>Relance</span>
            <span className="text-right">Action</span>
          </div>

          {loading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Chargement des règlements…</p>
          ) : pageItems.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Aucun règlement pour ces filtres.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pageItems.map((item) => {
                const bucket = paymentBucket(item);
                const meta = bucketMeta[bucket];
                const rdv = patientRdvMap.get(item.patientId) ?? null;
                const isSelected = selectedId === item.id;
                return (
                  <li key={item.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(item);
                        }
                      }}
                      className={`flex w-full cursor-pointer flex-col gap-2 px-4 py-3 text-left transition md:grid md:grid-cols-[1.6fr_0.9fr_1.3fr_1fr_1fr_0.9fr_auto] md:items-center md:gap-2 ${
                        isSelected ? "bg-violet-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                          {initials(item.patientName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">{item.patientName}</span>
                          {item.daysLate > 0 ? (
                            <span className="text-[11px] text-red-500">{item.daysLate} j. de retard</span>
                          ) : (
                            <span className="text-[11px] text-slate-400">À jour</span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between md:block">
                        <span className="text-[10px] uppercase text-slate-400 md:hidden">Montant</span>
                        <span className="text-sm font-semibold text-slate-900">{euro(item.amountDue)}</span>
                      </div>

                      <div className="flex items-center justify-between md:block">
                        <span className="text-[10px] uppercase text-slate-400 md:hidden">Semestre</span>
                        <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                          {item.semestreLabel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between md:block">
                        <span className="text-[10px] uppercase text-slate-400 md:hidden">Prochain RDV</span>
                        <span className="text-xs text-slate-600">{frDate(rdv)}</span>
                      </div>

                      <div className="flex items-center justify-between md:block">
                        <span className="text-[10px] uppercase text-slate-400 md:hidden">Statut</span>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
                          {bucket === "paid" ? "Réglé" : meta.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between md:block">
                        <span className="text-[10px] uppercase text-slate-400 md:hidden">Relance</span>
                        <span className={`text-xs ${item.relanceCount > 0 ? "font-medium text-slate-700" : "text-slate-400"}`}>
                          {relanceLabel(item.relanceCount)}
                        </span>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          href={`/patients/${item.patientId}?tab=reglements&from=reglements`}
                          prefetch
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                          title="Ouvrir la fiche patient"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="md:hidden xl:inline">Ouvrir</span>
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
            <span className="text-xs text-slate-500">
              {filtered.length} règlement{filtered.length > 1 ? "s" : ""} · page {page} / {totalPages}
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

        {/* Panneau latéral droit */}
        {selected ? (
          <aside className="flex max-h-[calc(100vh-9rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4">
            {(() => {
              const bucket = paymentBucket(selected);
              const meta = bucketMeta[bucket];
              const paid = selected.status === "Regle" ? selected.amountDue : 0;
              const remaining = Math.max(0, selected.amountDue - paid);
              const rdv = patientRdvMap.get(selected.patientId) ?? null;
              const statusValue =
                statusOptions.find((o) => o.label === selected.status)?.value ?? "EN_ATTENTE";
              return (
                <>
                  {/* Header */}
                  <header className="flex items-start justify-between gap-2 border-b border-slate-100 p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700">
                        {initials(selected.patientName)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-slate-900">{selected.patientName}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
                            {bucket === "paid" ? "Réglé" : meta.label}
                          </span>
                          <span className={`text-[11px] font-medium ${meta.tone}`}>{meta.health}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(null);
                        setHub(null);
                      }}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"
                      title="Fermer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </header>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    {/* Bloc financier */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <Wallet className="h-3.5 w-3.5" />
                        Financier
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                          <p className="text-[10px] text-slate-500">Total</p>
                          <p className="text-sm font-bold text-slate-900">{euro(selected.amountDue)}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5">
                          <p className="text-[10px] text-emerald-600">Réglé</p>
                          <p className="text-sm font-bold text-emerald-700">{euro(paid)}</p>
                        </div>
                        <div className="rounded-xl border border-red-100 bg-red-50 p-2.5">
                          <p className="text-[10px] text-red-600">Reste à payer</p>
                          <p className="text-sm font-bold text-red-700">{euro(remaining)}</p>
                        </div>
                      </div>
                    </section>

                    {/* Bloc semestre */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Semestre
                      </h4>
                      <dl className="space-y-1.5 rounded-xl border border-slate-100 p-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Phase / période</dt>
                          <dd>
                            <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                              {selected.semestreLabel}
                            </span>
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Échéance</dt>
                          <dd className="font-medium text-slate-800">{frDate(selected.dueDate)}</dd>
                        </div>
                      </dl>
                    </section>

                    {/* Bloc suivi */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Suivi
                      </h4>
                      <dl className="space-y-1.5 rounded-xl border border-slate-100 p-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Prochain RDV</dt>
                          <dd className="font-medium text-slate-800">{frDate(rdv)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Nombre de relances</dt>
                          <dd className="font-medium text-slate-800">{selected.relanceCount}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-slate-500">Dernière relance</dt>
                          <dd className="font-medium text-slate-800">{frDateTime(selected.lastRelanceAt)}</dd>
                        </div>
                      </dl>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select
                          value={statusValue}
                          onChange={(e) => quickStatusUpdate(selected.id, e.target.value as ReglementStatusApi)}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-violet-300"
                        >
                          {statusOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRelance(selected.id)}
                          disabled={selected.status === "Regle"}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-medium text-amber-800 disabled:opacity-40"
                        >
                          <Send className="h-3 w-3" />
                          Relance
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(selected)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3 w-3" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(selected.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </section>

                    {/* Commentaires internes */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Commentaires internes
                      </h4>
                      <form onSubmit={handleAddComment} className="space-y-2">
                        <textarea
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          rows={2}
                          placeholder="Ajouter un commentaire…"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300"
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={commentRecipientId}
                            onChange={(e) => setCommentRecipientId(e.target.value)}
                            className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 px-2 text-xs text-slate-700"
                          >
                            <option value="">Destinataire (optionnel)</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={commentLoading || !commentDraft.trim()}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Ajouter
                          </button>
                        </div>
                      </form>

                      <div className="mt-3 flex items-center gap-1.5">
                        {[
                          { id: "active" as const, label: "Actifs" },
                          { id: "done" as const, label: "Traités" },
                          { id: "all" as const, label: "Tous" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setCommentFilter(f.id)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] ${
                              commentFilter === f.id
                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                : "border-slate-200 text-slate-600"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-2 space-y-2">
                        {hubLoading ? (
                          <p className="text-xs text-slate-400">Chargement des commentaires…</p>
                        ) : visibleComments.length === 0 ? (
                          <p className="text-xs text-slate-400">Aucun commentaire.</p>
                        ) : (
                          visibleComments.map((c) => (
                            <div
                              key={c.id}
                              className={`rounded-xl border p-3 ${
                                c.isDone ? "border-slate-100 bg-slate-50/70 opacity-80" : "border-slate-100 bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-slate-800">{c.authorName}</p>
                                <p className="text-[11px] text-slate-400">{frDateTime(c.createdAt)}</p>
                              </div>
                              {c.recipientName ? (
                                <p className="text-[11px] text-slate-500">→ {c.recipientName}</p>
                              ) : null}
                              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.content}</p>
                              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-[11px] text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={c.isDone}
                                  onChange={(e) => handleToggleCommentDone(c.id, e.target.checked)}
                                />
                                Marquer comme traité
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </section>

                    {/* Historique */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <History className="h-3.5 w-3.5" />
                        Historique
                      </h4>
                      {hubLoading ? (
                        <p className="text-xs text-slate-400">Chargement de l&apos;historique…</p>
                      ) : (hub?.logs.length ?? 0) === 0 ? (
                        <p className="text-xs text-slate-400">Aucun événement.</p>
                      ) : (
                        <ol className="space-y-3 border-l border-slate-200 pl-4">
                          {(hub?.logs ?? []).slice(0, 12).map((log) => (
                            <li key={log.id} className="relative">
                              <span className="absolute -left-[1.30rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-violet-500" />
                              <p className="text-[11px] font-medium text-slate-400">{frDate(log.createdAt)}</p>
                              <p className="text-sm text-slate-700">{log.message}</p>
                            </li>
                          ))}
                        </ol>
                      )}
                    </section>
                  </div>
                </>
              );
            })()}
          </aside>
        ) : null}
      </div>

      {/* Modal création / édition */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CreditCard className="h-4 w-4 text-violet-600" />
                {editingId ? "Modifier le règlement" : "Nouveau règlement"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <form onSubmit={handleSubmit} className="grid gap-3 p-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                Patient
                <select
                  value={form.patientId}
                  onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                  required
                >
                  <option value="" disabled>
                    Sélectionner un patient
                  </option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Montant (€)
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={form.amountDue || ""}
                  onChange={(e) => setForm((p) => ({ ...p, amountDue: Number.parseFloat(e.target.value) || 0 }))}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Semestre / Période
                <select
                  value={form.semestre}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, semestre: e.target.value as ReglementSemestreApi }))
                  }
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                  required
                >
                  {semestreOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Échéance
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Statut
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ReglementStatusApi }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                Commentaire interne
                <textarea
                  value={form.comment ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={2}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                />
              </label>
              <div className="flex items-center justify-end gap-2 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
