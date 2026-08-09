"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  CreditCard,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  User,
  X,
} from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  PatientFormPayload,
  PatientHubResponse,
  PatientHubStatusApi,
  UsersListItem,
} from "@/types/domain";
import { PATIENT_HUB_STATUS_VALUES, patientHubStatusLabelMap } from "@/lib/patients";

const hubStatusOptions = PATIENT_HUB_STATUS_VALUES.map((value) => ({
  value,
  label: patientHubStatusLabelMap[value],
}));

function datetimeLocalFromIso(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function formatLogDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
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
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function frDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

function patientStatusUiLabel(status: PatientHubResponse["patient"]["hubStatus"]): "Actif" | "En pause" | "Terminé" {
  if (status === "Archive") return "Terminé";
  if (status === "Suivi admin") return "En pause";
  return "Actif";
}

function statusPillClass(status: ReturnType<typeof patientStatusUiLabel>): string {
  if (status === "Actif") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "En pause") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

interface PatientHubViewProps {
  patientId: string;
}

type CommentFilter = "active" | "done" | "all";

export function PatientHubView({ patientId }: PatientHubViewProps) {
  const router = useRouter();
  const [hub, setHub] = useState<PatientHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PatientFormPayload | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentRecipientId, setCommentRecipientId] = useState("");
  const [commentFilter, setCommentFilter] = useState<CommentFilter>("active");
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [fromReglements, setFromReglements] = useState(false);
  const [hasMutuelle, setHasMutuelle] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const from = params.get("from");
    setFromReglements(from === "reglements" || tab === "reglements");
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadHub = useCallback(async () => {
    const response = await fetch(`/api/patients/${patientId}`, { cache: "no-store" });
    if (response.status === 404) throw new Error("Patient introuvable.");
    if (!response.ok) throw new Error("Echec du chargement de la fiche.");
    const payload: PatientHubResponse = await response.json();
    setHub(payload);
    const statusValue =
      hubStatusOptions.find((o) => o.label === payload.patient.hubStatus)?.value ?? ("ACTIF" as PatientHubStatusApi);
    setForm({
      firstName: payload.patient.firstName,
      lastName: payload.patient.lastName,
      email: payload.patient.email,
      phone: payload.patient.phone,
      legalGuardian: payload.patient.legalGuardian,
      nextAppointmentAt: datetimeLocalFromIso(payload.patient.nextAppointmentAt),
      mutuelle: payload.patient.mutuelle,
      internalComment: payload.patient.internalComment,
      hubStatus: statusValue,
    });
    setHasMutuelle(Boolean(payload.patient.mutuelle));
  }, [patientId]);

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        await loadHub();
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
        setHub(null);
        setForm(null);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [loadHub]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        setUsers(payload.items ?? []);
      } catch {
        // optionnel
      }
    }
    loadUsers();
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      const mutuelleName = (form.mutuelle ?? "").trim();
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email === "" ? null : form.email,
        phone: form.phone === "" ? null : form.phone,
        legalGuardian: form.legalGuardian === "" ? null : form.legalGuardian,
        nextAppointmentAt: form.nextAppointmentAt === "" ? null : form.nextAppointmentAt,
        mutuelle: hasMutuelle && mutuelleName ? mutuelleName : null,
        internalComment: form.internalComment === "" ? null : form.internalComment,
        hubStatus: form.hubStatus,
      };
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadHub();
      setSuccess("Fiche enregistrée avec succès.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(event?: React.FormEvent) {
    event?.preventDefault();
    if (!commentDraft.trim()) return;
    try {
      setCommentLoading(true);
      const response = await fetch(`/api/patients/${patientId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentDraft.trim(),
          recipientId: commentRecipientId || null,
        }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      const created = await response.json();
      setHub((prev) =>
        prev
          ? {
              ...prev,
              comments: [created, ...prev.comments],
            }
          : prev,
      );
      setCommentDraft("");
      setCommentRecipientId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur ajout commentaire.");
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleToggleCommentDone(commentId: string, isDone: boolean) {
    try {
      const response = await fetch(`/api/patients/${patientId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      const updated = await response.json();
      setHub((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.map((c) => (c.id === commentId ? updated : c)),
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur mise à jour commentaire.");
    }
  }

  async function handleConfirmDelete() {
    try {
      setDeleting(true);
      setError(null);
      const response = await fetch(`/api/patients/${patientId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        setDeleteOpen(false);
        return;
      }
      router.push("/patients");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur suppression patient.");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement de la fiche patient...</p>;
  }

  if (error && !hub) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!hub || !form) {
    return null;
  }

  const status = patientStatusUiLabel(hub.patient.hubStatus);
  const now = new Date();
  const semesterStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
  const semesterEnd = new Date(now.getFullYear(), now.getMonth() < 6 ? 5 : 11, 30);
  const firstLog = hub.logs[0];
  const recentReglements = [...hub.reglements]
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .slice(0, 8);
  const filteredComments = hub.comments.filter((comment) =>
    commentFilter === "all" ? true : commentFilter === "done" ? comment.isDone : !comment.isDone,
  );

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-wrap items-center gap-2">
        {fromReglements ? (
          <Link
            href="/reglements"
            prefetch
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Retour aux règlements
          </Link>
        ) : null}
        <Link
          href="/patients"
          prefetch
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Retour à la liste patients
        </Link>
      </div>

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-[260px] items-start gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
              {initials(hub.patient.fullName)}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{hub.patient.fullName}</h2>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusPillClass(status)}`}>
                  {status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Patient depuis le {firstLog ? new Date(firstLog.createdAt).toLocaleDateString("fr-FR") : "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {hub.patient.phone ?? "Téléphone non renseigné"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {hub.patient.email ?? "Email non renseigné"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Supprimer le patient
            </button>
            <button
              type="submit"
              form="patient-hub-form"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-md">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-medium text-slate-500">Semestre en cours</p>
            <span className="rounded-xl bg-violet-50 p-1.5 text-violet-600">
              <Clock3 className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-snug text-slate-900">
            {semesterStart.toLocaleDateString("fr-FR")} - {semesterEnd.toLocaleDateString("fr-FR")}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Semestre {now.getMonth() < 6 ? "1" : "2"}</p>
        </article>
      </section>

      <form id="patient-hub-form" onSubmit={handleSave} className="grid gap-3 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <User className="h-4 w-4 text-violet-600" />
            Coordonnées / Infos
          </h3>
          <div className="mt-3 grid gap-2">
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => (f ? { ...f, firstName: e.target.value } : f))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Prénom"
              required
            />
            <input
              value={form.lastName}
              onChange={(e) => setForm((f) => (f ? { ...f, lastName: e.target.value } : f))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nom"
              required
            />
            <input
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Téléphone"
            />
            <input
              value={form.email ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Email"
            />

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
              <p className="text-xs font-medium text-slate-700">Mutuelle</p>
              <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={hasMutuelle}
                  onChange={(e) => {
                    setHasMutuelle(e.target.checked);
                    if (!e.target.checked) setForm((f) => (f ? { ...f, mutuelle: "" } : f));
                  }}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                Oui
              </label>
              {hasMutuelle ? (
                <input
                  value={form.mutuelle ?? ""}
                  onChange={(e) => setForm((f) => (f ? { ...f, mutuelle: e.target.value } : f))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  placeholder="Nom de la mutuelle"
                />
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">Non renseignée</p>
              )}
            </div>

            <input
              value={form.legalGuardian ?? ""}
              onChange={(e) => setForm((f) => (f ? { ...f, legalGuardian: e.target.value } : f))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Responsable légal"
            />
            <select
              value={form.hubStatus ?? "ACTIF"}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, hubStatus: e.target.value as PatientHubStatusApi } : f))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {hubStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <CreditCard className="h-4 w-4 text-violet-600" />
            Historique règlements
          </h3>
          <div className="mt-3 space-y-2">
            {recentReglements.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800">{frDate(r.dueDate)}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {r.semestreLabel} · {r.status}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-900">{euro(r.amountDue)}</p>
                  {r.daysLate > 0 && r.status !== "Regle" ? (
                    <p className="text-[10px] font-medium text-rose-600">+{r.daysLate} j</p>
                  ) : null}
                </div>
              </div>
            ))}
            {recentReglements.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun règlement enregistré.</p>
            ) : null}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <MessageSquare className="h-4 w-4 text-violet-600" />
            Commentaires
          </h3>
          <div className="mb-3 grid gap-2">
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Ajouter un commentaire…"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
            <select
              value={commentRecipientId}
              onChange={(e) => setCommentRecipientId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">Destinataire (optionnel)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleAddComment()}
              disabled={commentLoading || !commentDraft.trim()}
              className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
          <div className="mb-3 flex items-center gap-2">
            {[
              { id: "active" as const, label: "Actifs" },
              { id: "done" as const, label: "Terminés" },
              { id: "all" as const, label: "Tous" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCommentFilter(f.id)}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  commentFilter === f.id
                    ? "border-violet-200 bg-violet-50 text-violet-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="max-h-[22rem] space-y-2 overflow-y-auto">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl border border-slate-100 p-3 ${
                  comment.isDone ? "bg-slate-50/60 opacity-80" : "bg-slate-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-800">{comment.authorName}</p>
                {comment.recipientName ? (
                  <p className="text-xs text-slate-500">→ {comment.recipientName}</p>
                ) : null}
                <p className="text-xs text-slate-500">{formatLogDate(comment.createdAt)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={comment.isDone}
                    onChange={(e) => handleToggleCommentDone(comment.id, e.target.checked)}
                  />
                  Marquer comme lu / terminé
                </label>
              </div>
            ))}
            {filteredComments.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun commentaire.</p>
            ) : null}
          </div>
        </article>
      </form>

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-patient-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 id="delete-patient-title" className="text-sm font-semibold text-slate-900">
                Supprimer le patient
              </h3>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer la fiche de ce patient ?
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Cette action est définitive : règlements et commentaires liés seront également
              supprimés.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
