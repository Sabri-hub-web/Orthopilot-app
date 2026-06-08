"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock,
  CreditCard,
  Filter,
  LayoutGrid,
  List,
  ListTodo,
  Mail,
  MessageSquare,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  InternalTask,
  PatientCommentLine,
  PatientListItem,
  PriorityLevel,
  TaskFormPayload,
  TasksListResponse,
  UsersListItem,
} from "@/types/domain";

type StatusValue = TaskFormPayload["status"];
type StatusApiLabel = InternalTask["status"];
type TaskOrigin = "Email" | "Patient" | "Règlement" | "Manuel";
type EcheanceFilter = "all" | "today" | "week" | "overdue";
type ViewMode = "kanban" | "list";

const statusOptions: { value: StatusValue; label: StatusApiLabel }[] = [
  { value: "A_FAIRE", label: "A faire" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "TERMINEE", label: "Terminee" },
];

const COLUMNS: { value: StatusValue; apiLabel: StatusApiLabel; label: string; accent: string }[] = [
  { value: "A_FAIRE", apiLabel: "A faire", label: "À faire", accent: "bg-orange-400" },
  { value: "EN_COURS", apiLabel: "En cours", label: "En cours", accent: "bg-emerald-400" },
  { value: "EN_ATTENTE", apiLabel: "En attente", label: "En attente", accent: "bg-slate-400" },
  { value: "TERMINEE", apiLabel: "Terminee", label: "Terminées", accent: "bg-blue-400" },
];

const priorityOptions: { value: TaskFormPayload["priority"]; label: string }[] = [
  { value: "URGENTE", label: "Urgent" },
  { value: "IMPORTANTE", label: "Important" },
  { value: "NORMALE", label: "Normal" },
  { value: "FAIBLE", label: "Faible" },
];

const PRIORITY_META: Record<
  PriorityLevel,
  { label: string; bar: string; badge: string; value: TaskFormPayload["priority"] }
> = {
  urgente: { label: "Urgent", bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200", value: "URGENTE" },
  importante: {
    label: "Important",
    bar: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    value: "IMPORTANTE",
  },
  normale: { label: "Normal", bar: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200", value: "NORMALE" },
  faible: { label: "Faible", bar: "bg-slate-300", badge: "bg-slate-100 text-slate-600 border-slate-200", value: "FAIBLE" },
};

const ORIGIN_META: Record<TaskOrigin, { icon: typeof Mail; className: string }> = {
  Email: { icon: Mail, className: "bg-violet-50 text-violet-700 border-violet-200" },
  Patient: { icon: User, className: "bg-sky-50 text-sky-700 border-sky-200" },
  Règlement: { icon: CreditCard, className: "bg-amber-50 text-amber-700 border-amber-200" },
  Manuel: { icon: ListTodo, className: "bg-slate-50 text-slate-600 border-slate-200" },
};

const defaultForm: TaskFormPayload = {
  title: "",
  comment: "",
  dueDate: "",
  priority: "NORMALE",
  status: "A_FAIRE",
  assigneeId: null,
  patientId: null,
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function frDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

function frDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function priorityValueToLevel(value: TaskFormPayload["priority"]): PriorityLevel {
  return value.toLowerCase() as PriorityLevel;
}

function taskOrigin(task: InternalTask): TaskOrigin {
  const text = `${task.title} ${task.comment ?? ""}`.toLowerCase();
  if (/relance|règlement|reglement|paiement|facture|impay|encaiss/.test(text)) return "Règlement";
  if (/email|e-mail|mail|courriel|gmail/.test(text)) return "Email";
  if (task.patientId) return "Patient";
  return "Manuel";
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const inDaysStr = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function isOverdue(task: InternalTask): boolean {
  return task.status !== "Terminee" && task.dueDate < todayStr();
}

export function TasksView() {
  const [tasks, setTasks] = useState<InternalTask[]>([]);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"" | TaskFormPayload["priority"]>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"" | StatusApiLabel>("");
  const [echeanceFilter, setEcheanceFilter] = useState<EcheanceFilter>("all");
  const [originFilter, setOriginFilter] = useState<"" | TaskOrigin>("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");

  // selection / detail
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<PatientCommentLine[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");

  // drag & drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<StatusValue | null>(null);

  // create / edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormPayload>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadTasks = useCallback(async () => {
    const collected: InternalTask[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const res = await fetch(`/api/tasks?page=${currentPage}&pageSize=50`, { cache: "no-store" });
      if (!res.ok) throw new Error("Echec du chargement des tâches.");
      const payload: TasksListResponse = await res.json();
      collected.push(...payload.items);
      totalPages = payload.totalPages;
      currentPage += 1;
    } while (currentPage <= totalPages);
    setTasks(collected);
  }, []);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadTasks();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue de chargement.");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [loadTasks]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch("/api/patients?page=1&pageSize=50", { cache: "no-store" });
        if (res.ok) {
          const payload = await res.json();
          setPatients(payload.items ?? []);
        }
      } catch {
        setPatients([]);
      }
      try {
        const res = await fetch("/api/users", { cache: "no-store" });
        if (res.ok) {
          const payload = await res.json();
          setUsers(payload.items ?? []);
        }
      } catch {
        setUsers([]);
      }
    }
    void loadOptions();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (
        q &&
        !task.title.toLowerCase().includes(q) &&
        !(task.patientName?.toLowerCase().includes(q) ?? false) &&
        !(task.comment?.toLowerCase().includes(q) ?? false)
      ) {
        return false;
      }
      if (priorityFilter && PRIORITY_META[task.priority].value !== priorityFilter) return false;
      if (assigneeFilter) {
        if (assigneeFilter === "__none__") {
          if (task.assigneeId) return false;
        } else if (task.assigneeId !== assigneeFilter) {
          return false;
        }
      }
      if (statusFilter && task.status !== statusFilter) return false;
      if (originFilter && taskOrigin(task) !== originFilter) return false;
      if (echeanceFilter === "today" && task.dueDate !== todayStr()) return false;
      if (echeanceFilter === "overdue" && !isOverdue(task)) return false;
      if (echeanceFilter === "week") {
        const today = todayStr();
        const end = inDaysStr(7);
        if (!(task.dueDate >= today && task.dueDate <= end)) return false;
      }
      return true;
    });
  }, [tasks, search, priorityFilter, assigneeFilter, statusFilter, originFilter, echeanceFilter]);

  const kpi = useMemo(() => {
    const count = (label: StatusApiLabel) => tasks.filter((t) => t.status === label).length;
    return {
      total: tasks.length,
      todo: count("A faire"),
      inProgress: count("En cours"),
      waiting: count("En attente"),
      done: count("Terminee"),
    };
  }, [tasks]);

  const analytics = useMemo(() => {
    const workloadMap = new Map<string, number>();
    for (const t of tasks) {
      if (t.status === "Terminee") continue;
      const key = t.assigneeId ? t.assignee : "Non assignée";
      workloadMap.set(key, (workloadMap.get(key) ?? 0) + 1);
    }
    const workload = Array.from(workloadMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const maxWorkload = Math.max(1, ...workload.map((w) => w.value));
    const overdue = tasks.filter(isOverdue).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const today = todayStr();
    const end = inDaysStr(7);
    const upcoming = tasks
      .filter((t) => t.status !== "Terminee" && t.dueDate >= today && t.dueDate <= end)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return { workload, maxWorkload, overdue, upcoming };
  }, [tasks]);

  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  const loadComments = useCallback(async (patientId: string) => {
    try {
      setCommentsLoading(true);
      const res = await fetch(`/api/patients/${patientId}/comments`, { cache: "no-store" });
      if (!res.ok) {
        setComments([]);
        return;
      }
      const payload = await res.json();
      setComments(payload.items ?? []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  function handleSelect(task: InternalTask) {
    setSelectedId(task.id);
    setCommentDraft("");
    setComments([]);
    if (task.patientId) void loadComments(task.patientId);
  }

  async function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    if (!selected?.patientId || !commentDraft.trim()) return;
    try {
      const res = await fetch(`/api/patients/${selected.patientId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentDraft.trim() }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      const created: PatientCommentLine = await res.json();
      setComments((prev) => [created, ...prev]);
      setCommentDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur ajout commentaire.");
    }
  }

  function openCreate(prefillStatus?: StatusValue) {
    setEditingId(null);
    setForm({ ...defaultForm, status: prefillStatus ?? "A_FAIRE", dueDate: todayStr() });
    setModalOpen(true);
  }

  function openEdit(task: InternalTask) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      comment: task.comment ?? "",
      dueDate: task.dueDate,
      priority: PRIORITY_META[task.priority].value,
      status: statusOptions.find((o) => o.label === task.status)?.value ?? "A_FAIRE",
      assigneeId: task.assigneeId,
      patientId: task.patientId,
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const url = editingId ? `/api/tasks/${editingId}` : "/api/tasks";
      const method = editingId ? "PATCH" : "POST";
      const body = { ...form, comment: form.comment === "" ? null : form.comment };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadTasks();
      setModalOpen(false);
      setSuccess(editingId ? "Tâche mise à jour." : "Tâche créée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function quickStatusUpdate(taskId: string, status: StatusValue) {
    try {
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadTasks();
      setSuccess("Statut mis à jour.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  async function handleDelete(taskId: string) {
    if (!window.confirm("Supprimer cette tâche ? Cette action est définitive.")) return;
    try {
      setError(null);
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      await loadTasks();
      if (selectedId === taskId) setSelectedId(null);
      setSuccess("Tâche supprimée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  }

  function handleDrop(status: StatusValue, apiLabel: StatusApiLabel) {
    setDragOverCol(null);
    if (!draggedId) return;
    const task = tasks.find((t) => t.id === draggedId);
    setDraggedId(null);
    if (!task || task.status === apiLabel) return;
    void quickStatusUpdate(draggedId, status);
  }

  const kpiCards = [
    { title: "Total tâches", value: kpi.total, sub: "Toutes tâches", icon: ListTodo, tone: "bg-violet-50 text-violet-600" },
    { title: "À faire", value: kpi.todo, sub: "En attente de prise", icon: CircleDot, tone: "bg-orange-50 text-orange-600" },
    { title: "En cours", value: kpi.inProgress, sub: "Travail engagé", icon: PlayCircle, tone: "bg-emerald-50 text-emerald-600" },
    { title: "En attente", value: kpi.waiting, sub: "Bloquées / en pause", icon: PauseCircle, tone: "bg-slate-100 text-slate-600" },
    { title: "Terminées", value: kpi.done, sub: "Clôturées", icon: CheckCircle2, tone: "bg-blue-50 text-blue-600" },
  ];

  const renderCard = (task: InternalTask) => {
    const meta = PRIORITY_META[task.priority];
    const origin = taskOrigin(task);
    const originMeta = ORIGIN_META[origin];
    const OriginIcon = originMeta.icon;
    const overdue = isOverdue(task);
    const hasNote = Boolean(task.comment && task.comment.trim());
    return (
      <div
        key={task.id}
        role="button"
        tabIndex={0}
        draggable
        onDragStart={() => setDraggedId(task.id)}
        onDragEnd={() => setDraggedId(null)}
        onClick={() => handleSelect(task)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect(task);
          }
        }}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-white p-3 pl-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          selectedId === task.id ? "border-violet-300 ring-2 ring-violet-500/15" : "border-slate-200"
        }`}
      >
        <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.bar}`} />
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-slate-900">{task.title}</p>
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${meta.badge}`}>
            {meta.label}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${originMeta.className}`}>
            <OriginIcon className="h-3 w-3" />
            {origin}
          </span>
          {task.patientName ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600">
              <User className="h-3 w-3" />
              {task.patientName}
            </span>
          ) : null}
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] ${overdue ? "font-medium text-red-600" : "text-slate-500"}`}>
            <CalendarClock className="h-3.5 w-3.5" />
            {frDate(task.dueDate)}
          </span>
          <div className="flex items-center gap-2">
            {hasNote ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" />1
              </span>
            ) : null}
            {task.assigneeId ? (
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700"
                title={task.assignee}
              >
                {initials(task.assignee)}
              </span>
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400" title="Non assignée">
                <User className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tâches internes</h2>
          <p className="text-sm text-slate-500">Organisez, suivez et priorisez les tâches du cabinet.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une tâche, un patient…"
              className="h-9 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
            />
          </div>
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}
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
            <p className="text-[11px] text-slate-500">{card.sub}</p>
          </article>
        ))}
      </section>

      {/* Filtres */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="">Toutes priorités</option>
            {priorityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="">Tous les assignés</option>
            <option value="__none__">Non assignées</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="">Tous les statuts</option>
            {COLUMNS.map((c) => (
              <option key={c.value} value={c.apiLabel}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={echeanceFilter}
            onChange={(e) => setEcheanceFilter(e.target.value as EcheanceFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-violet-300"
          >
            <option value="all">Toutes échéances</option>
            <option value="today">Aujourd&apos;hui</option>
            <option value="week">Cette semaine</option>
            <option value="overdue">En retard</option>
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

          <div className="ml-auto flex items-center gap-0.5 rounded-xl bg-slate-100/70 p-0.5">
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                view === "kanban" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                view === "list" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Liste
            </button>
          </div>
        </div>

        {showAdvanced ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-500">Origine :</span>
            {(["", "Email", "Patient", "Règlement", "Manuel"] as const).map((o) => (
              <button
                key={o || "all"}
                type="button"
                onClick={() => setOriginFilter(o)}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  originFilter === o ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600"
                }`}
              >
                {o === "" ? "Toutes" : o}
              </button>
            ))}
            {(priorityFilter || assigneeFilter || statusFilter || originFilter || echeanceFilter !== "all" || search) ? (
              <button
                type="button"
                onClick={() => {
                  setPriorityFilter("");
                  setAssigneeFilter("");
                  setStatusFilter("");
                  setOriginFilter("");
                  setEcheanceFilter("all");
                  setSearch("");
                }}
                className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Kanban / Liste + panneau détail */}
      <div className={`grid gap-4 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1"}`}>
        <div className="min-w-0">
          {loading ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
              Chargement des tâches…
            </p>
          ) : view === "kanban" ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {COLUMNS.map((col) => {
                const colTasks = filtered.filter((t) => t.status === col.apiLabel);
                return (
                  <div
                    key={col.value}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverCol(col.value);
                    }}
                    onDragLeave={() => setDragOverCol((c) => (c === col.value ? null : c))}
                    onDrop={() => handleDrop(col.value, col.apiLabel)}
                    className={`flex max-h-[calc(100vh-16rem)] min-h-[12rem] w-[270px] shrink-0 flex-col rounded-2xl border bg-slate-50/70 transition ${
                      dragOverCol === col.value ? "border-violet-300 bg-violet-50/60" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                        <span className="text-sm font-semibold text-slate-800">{col.label}</span>
                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                          {colTasks.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreate(col.value)}
                        title="Ajouter une tâche"
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-violet-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                      {colTasks.map((task) => renderCard(task))}
                      {colTasks.length === 0 ? (
                        <p className="px-2 py-6 text-center text-xs text-slate-400">Aucune tâche</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_0.8fr] gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
                <span>Tâche</span>
                <span>Assigné</span>
                <span>Échéance</span>
                <span>Priorité</span>
                <span>Statut</span>
              </div>
              {filtered.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-slate-500">Aucune tâche pour ces filtres.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filtered.map((task) => {
                    const meta = PRIORITY_META[task.priority];
                    return (
                      <li key={task.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSelect(task)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSelect(task);
                          }}
                          className={`flex cursor-pointer flex-col gap-1 px-4 py-3 transition md:grid md:grid-cols-[2fr_1fr_1fr_1fr_0.8fr] md:items-center md:gap-2 ${
                            selectedId === task.id ? "bg-violet-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-8 w-1 rounded-full ${meta.bar}`} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                              <p className="text-[11px] text-slate-500">{taskOrigin(task)}{task.patientName ? ` · ${task.patientName}` : ""}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-600">{task.assigneeId ? task.assignee : "—"}</span>
                          <span className={`text-xs ${isOverdue(task) ? "font-medium text-red-600" : "text-slate-600"}`}>{frDate(task.dueDate)}</span>
                          <span className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>{meta.label}</span>
                          <span className="text-xs text-slate-600">{task.status}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* Panneau détail */}
        {selected ? (
          <aside className="flex max-h-[calc(100vh-9rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-4">
            {(() => {
              const meta = PRIORITY_META[selected.priority];
              const origin = taskOrigin(selected);
              const originMeta = ORIGIN_META[origin];
              const OriginIcon = originMeta.icon;
              return (
                <>
                  <header className="border-b border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"
                        title="Fermer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="mt-2 text-base font-semibold leading-snug text-slate-900">{selected.title}</h3>
                    <span className={`mt-2 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${originMeta.className}`}>
                      <OriginIcon className="h-3 w-3" />
                      {origin}
                    </span>
                  </header>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    {/* Métadonnées */}
                    <dl className="space-y-1.5 rounded-xl border border-slate-100 p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Patient lié</dt>
                        <dd className="font-medium text-slate-800">{selected.patientName ?? "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Assigné à</dt>
                        <dd className="font-medium text-slate-800">{selected.assigneeId ? selected.assignee : "Non assignée"}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Échéance</dt>
                        <dd className={`font-medium ${isOverdue(selected) ? "text-red-600" : "text-slate-800"}`}>{frDate(selected.dueDate)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Statut</dt>
                        <dd className="font-medium text-slate-800">{selected.status}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">Créé le</dt>
                        <dd className="font-medium text-slate-800">{frDate(selected.createdAt)}</dd>
                      </div>
                    </dl>

                    {/* Description */}
                    <section>
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Description</h4>
                      <p className="whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                        {selected.comment?.trim() ? selected.comment : "Aucune description."}
                      </p>
                    </section>

                    {/* Actions */}
                    <section>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => quickStatusUpdate(selected.id, "EN_COURS")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          En cours
                        </button>
                        <button
                          type="button"
                          onClick={() => quickStatusUpdate(selected.id, "EN_ATTENTE")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600"
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          En attente
                        </button>
                        <button
                          type="button"
                          onClick={() => quickStatusUpdate(selected.id, "TERMINEE")}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-medium text-blue-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Terminé
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(selected)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(selected.id)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </section>

                    {/* Commentaires */}
                    <section>
                      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Commentaires
                      </h4>
                      {selected.patientId ? (
                        <>
                          <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                              value={commentDraft}
                              onChange={(e) => setCommentDraft(e.target.value)}
                              placeholder="Ajouter un commentaire…"
                              className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300"
                            />
                            <button
                              type="submit"
                              disabled={!commentDraft.trim()}
                              className="rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Ajouter
                            </button>
                          </form>
                          <div className="mt-2 space-y-2">
                            {commentsLoading ? (
                              <p className="text-xs text-slate-400">Chargement…</p>
                            ) : comments.length === 0 ? (
                              <p className="text-xs text-slate-400">Aucun commentaire.</p>
                            ) : (
                              comments.map((c) => (
                                <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-slate-800">{c.authorName}</p>
                                    <p className="text-[11px] text-slate-400">{frDateTime(c.createdAt)}</p>
                                  </div>
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.content}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
                          Liez un patient à cette tâche pour ajouter des commentaires partagés.
                        </p>
                      )}
                    </section>
                  </div>
                </>
              );
            })()}
          </aside>
        ) : null}
      </div>

      {/* Analytics bas de page */}
      {!loading ? (
        <section className="grid gap-3 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Users className="h-4 w-4 text-violet-600" />
              Charge de travail
            </h3>
            <div className="mt-3 space-y-2">
              {analytics.workload.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune tâche active.</p>
              ) : (
                analytics.workload.map((w) => (
                  <div key={w.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-slate-700">{w.name}</span>
                      <span className="font-medium text-slate-500">{w.value}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${(w.value / analytics.maxWorkload) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Tâches en retard
              <span className="ml-auto rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                {analytics.overdue.length}
              </span>
            </h3>
            <div className="mt-3 space-y-2">
              {analytics.overdue.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune tâche en retard.</p>
              ) : (
                analytics.overdue.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-100 p-2 text-left hover:bg-slate-50"
                  >
                    <span className="min-w-0 truncate text-xs text-slate-700">{t.title}</span>
                    <span className="shrink-0 text-[11px] font-medium text-red-600">{frDate(t.dueDate)}</span>
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-violet-600" />
              Échéances à venir
            </h3>
            <div className="mt-3 space-y-2">
              {analytics.upcoming.length === 0 ? (
                <p className="text-xs text-slate-400">Aucune échéance proche.</p>
              ) : (
                analytics.upcoming.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-100 p-2 text-left hover:bg-slate-50"
                  >
                    <span className="min-w-0 truncate text-xs text-slate-700">{t.title}</span>
                    <span className="shrink-0 text-[11px] font-medium text-slate-500">{frDate(t.dueDate)}</span>
                  </button>
                ))
              )}
            </div>
          </article>
        </section>
      ) : null}

      {/* Modal création / édition */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ListTodo className="h-4 w-4 text-violet-600" />
                {editingId ? "Modifier la tâche" : "Nouvelle tâche"}
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
                Titre
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                  placeholder="Titre de la tâche"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500 sm:col-span-2">
                Description
                <textarea
                  value={form.comment ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={2}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  placeholder="Détails de la tâche"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Priorité
                <select
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TaskFormPayload["priority"] }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  {priorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Statut
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as StatusValue }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Assigné à
                <select
                  value={form.assigneeId ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value || null }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  <option value="">Non assignée</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                Patient lié
                <select
                  value={form.patientId ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, patientId: e.target.value || null }))}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                >
                  <option value="">Sans patient</option>
                  {patients.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.fullName}
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
              <p className="text-[11px] text-slate-400 sm:col-span-2">
                L&apos;origine (Email / Patient / Règlement / Manuel) est détectée automatiquement selon le contenu et le patient lié.
              </p>
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
