"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import { PatientFormPayload, PatientHubResponse, PatientHubStatusApi } from "@/types/domain";
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

type HubTab = "overview" | "reglements" | "rendezvous" | "documents" | "commentaires";

export function PatientHubView({ patientId }: PatientHubViewProps) {
  const [hub, setHub] = useState<PatientHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PatientFormPayload | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HubTab>("overview");
  const [commentDraft, setCommentDraft] = useState("");
  const [docNameDraft, setDocNameDraft] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

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

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email === "" ? null : form.email,
        phone: form.phone === "" ? null : form.phone,
        legalGuardian: form.legalGuardian === "" ? null : form.legalGuardian,
        nextAppointmentAt: form.nextAppointmentAt === "" ? null : form.nextAppointmentAt,
        mutuelle: form.mutuelle === "" ? null : form.mutuelle,
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

  async function handleAddComment(event: React.FormEvent) {
    event.preventDefault();
    if (!commentDraft.trim()) return;
    try {
      setCommentLoading(true);
      const response = await fetch(`/api/patients/${patientId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentDraft.trim() }),
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur ajout commentaire.");
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleAddDocumentPlaceholder(event: React.FormEvent) {
    event.preventDefault();
    if (!docNameDraft.trim()) return;
    try {
      setDocLoading(true);
      const response = await fetch(`/api/patients/${patientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docNameDraft.trim(),
          mimeType: "application/octet-stream",
          sizeBytes: 0,
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
              documents: [created, ...prev.documents],
            }
          : prev,
      );
      setDocNameDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur ajout document.");
    } finally {
      setDocLoading(false);
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
  const reglementsTotal = hub.reglements.reduce((acc, r) => acc + Number(r.amountDue || 0), 0);
  const reglementsRegles = hub.reglements
    .filter((r) => r.status === "Regle")
    .reduce((acc, r) => acc + Number(r.amountDue || 0), 0);
  const progress = reglementsTotal > 0 ? Math.round((reglementsRegles / reglementsTotal) * 100) : 0;
  const now = new Date();
  const semesterStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
  const semesterEnd = new Date(now.getFullYear(), now.getMonth() < 6 ? 5 : 11, 30);
  const prochainRdv = hub.patient.nextAppointmentAt
    ? new Date(hub.patient.nextAppointmentAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
    : "Aucun rendez-vous planifié";
  const enRetardCount = hub.reglements.filter((r) => r.status === "En retard").length;
  const reglementsPayesCount = hub.reglements.filter((r) => r.status === "Regle").length;
  const totalReglements = Math.max(1, hub.reglements.length);
  const retardRatio = enRetardCount / totalReglements;
  const reglementHealth =
    enRetardCount === 0
      ? "Payé"
      : retardRatio > 0.5
        ? "Retard > 2 mois"
        : "Retard 1 mois";
  const reglementBadge =
    enRetardCount === 0
      ? `${reglementsPayesCount} payé(s)`
      : retardRatio > 0.5
        ? "Retard critique"
        : "Retard modéré";
  const reglementTone =
    enRetardCount === 0 ? "text-emerald-700" : retardRatio > 0.5 ? "text-red-700" : "text-amber-700";
  const firstLog = hub.logs[0];
  const tabs: { id: HubTab; label: string }[] = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "reglements", label: "Règlements" },
    { id: "rendezvous", label: "Rendez-vous" },
    { id: "documents", label: "Documents" },
    { id: "commentaires", label: "Commentaires" },
  ];

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <Link href="/patients" className="inline-block text-sm font-medium text-violet-700 hover:underline">
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
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {hub.patient.legalGuardian ?? "Responsable légal non renseigné"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="patient-hub-form"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Modifier les informations"}
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
              title="Actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            title: "Prochain rendez-vous",
            value: prochainRdv,
            sub: hub.patient.nextAppointmentAt ? "Planning à confirmer" : "Aucun RDV à venir",
            icon: CalendarClock,
          },
          {
            title: "Statut règlement",
            value: reglementBadge,
            sub: reglementHealth,
            icon: CreditCard,
            valueClass: reglementTone,
          },
          {
            title: "Montant total traitement",
            value: euro(reglementsTotal),
            sub: `Échéancier sur ${Math.max(1, hub.reglements.length)} mois`,
            icon: Shield,
          },
          {
            title: "Montant réglé",
            value: euro(reglementsRegles),
            sub: `${progress}% du total`,
            icon: CheckCircle2,
            valueClass: progress >= 90 ? "text-emerald-700" : progress >= 50 ? "text-amber-700" : "text-red-700",
          },
          {
            title: "Semestre en cours",
            value: `${semesterStart.toLocaleDateString("fr-FR")} - ${semesterEnd.toLocaleDateString("fr-FR")}`,
            sub: `Semestre ${now.getMonth() < 6 ? "1" : "2"}`,
            icon: Clock3,
          },
        ].map((kpi) => (
          <article key={kpi.title} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium text-slate-500">{kpi.title}</p>
              <span className="rounded-xl bg-violet-50 p-1.5 text-violet-600">
                <kpi.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className={`mt-2 text-sm font-semibold leading-snug ${kpi.valueClass ?? "text-slate-900"}`}>{kpi.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{kpi.sub}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                activeTab === tab.id
                  ? "border-b-2 border-violet-600 text-violet-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <form id="patient-hub-form" onSubmit={handleSave}>
        {activeTab === "overview" ? (
          <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1.1fr]">
            <section className="space-y-3 xl:col-span-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-900">Informations générales</h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <input value={form.firstName} onChange={(e) => setForm((f) => (f ? { ...f, firstName: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Prénom" required />
                    <input value={form.lastName} onChange={(e) => setForm((f) => (f ? { ...f, lastName: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Nom" required />
                    <input value={form.phone ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Téléphone" />
                    <input value={form.email ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Email" />
                    <input value={form.mutuelle ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, mutuelle: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Mutuelle" />
                    <input value={form.legalGuardian ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, legalGuardian: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Responsable légal" />
                    <input type="datetime-local" value={form.nextAppointmentAt ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, nextAppointmentAt: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                    <select value={form.hubStatus ?? "ACTIF"} onChange={(e) => setForm((f) => (f ? { ...f, hubStatus: e.target.value as PatientHubStatusApi } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                      {hubStatusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <textarea value={form.internalComment ?? ""} onChange={(e) => setForm((f) => (f ? { ...f, internalComment: e.target.value } : f))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" rows={3} placeholder="Notes importantes" />
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Derniers commentaires</h3>
                    <button type="button" onClick={() => setActiveTab("commentaires")} className="text-xs font-medium text-violet-700 hover:underline">Voir tout</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {hub.comments.slice(0, 3).map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                        <p className="font-medium text-slate-800">{comment.authorName}</p>
                        <p className="text-[11px] text-slate-500">{formatLogDate(comment.createdAt)}</p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-700">{comment.content}</p>
                      </div>
                    ))}
                    {hub.comments.length === 0 ? <p className="text-xs text-slate-500">Aucun commentaire.</p> : null}
                  </div>
                </article>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Derniers règlements</h3>
                    <button type="button" onClick={() => setActiveTab("reglements")} className="text-xs font-medium text-violet-700 hover:underline">Voir tout</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {hub.reglements.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2">
                        <div>
                          <p className="text-xs font-medium text-slate-800">{r.dueDate}</p>
                          <p className="text-[11px] text-slate-500">{r.status}</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{euro(r.amountDue)}</span>
                      </div>
                    ))}
                    {hub.reglements.length === 0 ? <p className="text-xs text-slate-500">Aucun règlement lié.</p> : null}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Derniers documents</h3>
                    <button type="button" onClick={() => setActiveTab("documents")} className="text-xs font-medium text-violet-700 hover:underline">Voir tout</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {hub.documents.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-800">{doc.name}</p>
                          <p className="text-[11px] text-slate-500">{formatLogDate(doc.createdAt)}</p>
                        </div>
                        <button type="button" disabled={!doc.downloadUrl} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 disabled:cursor-not-allowed disabled:opacity-50">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {hub.documents.length === 0 ? <p className="text-xs text-slate-500">Aucun document récent.</p> : null}
                  </div>
                </article>
              </div>
            </section>

            <aside className="space-y-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Activity className="h-4 w-4 text-violet-600" />
                  Activité récente
                </h3>
                <ol className="mt-3 space-y-2">
                  {hub.logs.slice(0, 5).map((log) => (
                    <li key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] text-slate-500">{formatLogDate(log.createdAt)}</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-800">{log.actor}</p>
                      <p className="text-xs text-slate-700">{log.message}</p>
                    </li>
                  ))}
                  {hub.logs.length === 0 ? <p className="text-xs text-slate-500">Aucune activité récente.</p> : null}
                </ol>
              </article>
            </aside>
          </div>
        ) : null}

        {activeTab === "reglements" ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Règlements</h3>
            <div className="mt-3 space-y-2">
              {hub.reglements.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.dueDate}</p>
                    <p className="text-xs text-slate-500">{r.status}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{euro(r.amountDue)}</span>
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {activeTab === "rendezvous" ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Rendez-vous</h3>
            <p className="mt-3 text-sm text-slate-700">
              Prochain rendez-vous : {hub.patient.nextAppointmentAt ? formatLogDate(hub.patient.nextAppointmentAt) : "Aucun rendez-vous"}
            </p>
          </article>
        ) : null}

        {activeTab === "commentaires" ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <MessageSquare className="h-4 w-4 text-violet-600" />
              Commentaires
            </h3>
            <form onSubmit={handleAddComment} className="mb-4 flex gap-2">
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Ajouter un commentaire patient..."
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <button type="submit" disabled={commentLoading || !commentDraft.trim()} className="rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50">
                Ajouter
              </button>
            </form>
            <div className="space-y-2">
              {hub.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">{comment.authorName}</p>
                  <p className="text-xs text-slate-500">{formatLogDate(comment.createdAt)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                </div>
              ))}
              {hub.comments.length === 0 ? <p className="text-xs text-slate-500">Aucun commentaire.</p> : null}
            </div>
          </article>
        ) : null}

        {activeTab === "documents" ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-violet-600" />
              Documents
            </h3>
            <form onSubmit={handleAddDocumentPlaceholder} className="mb-4 flex gap-2">
              <input
                value={docNameDraft}
                onChange={(e) => setDocNameDraft(e.target.value)}
                placeholder="Nom du document (préparation upload)"
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <button type="submit" disabled={docLoading || !docNameDraft.trim()} className="rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white disabled:opacity-50">
                Ajouter
              </button>
            </form>
            <div className="space-y-2">
              {hub.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{doc.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatLogDate(doc.createdAt)}{doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
                    </p>
                  </div>
                  {doc.downloadUrl ? (
                    <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-200 p-1.5 text-slate-500">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <button type="button" disabled className="rounded-lg border border-slate-200 p-1.5 text-slate-400" title="Téléchargement bientôt disponible">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {hub.documents.length === 0 ? <p className="text-xs text-slate-500">Aucun document.</p> : null}
            </div>
          </article>
        ) : null}
      </form>
    </div>
  );
}
