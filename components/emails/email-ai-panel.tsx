"use client";

import {
  CheckCircle2,
  ListTodo,
  Loader2,
  MessageSquarePlus,
  Sparkles,
} from "lucide-react";
import {
  buildEmailHistory,
  emailCategoryBadgeClass,
  emailPriorityLabel,
  emailStatusBadgeClass,
} from "@/lib/emails-ui";
import type { EmailStatusApi, PriorityEmail, UsersListItem } from "@/types/domain";

interface EmailAiPanelProps {
  email: PriorityEmail | null;
  users: UsersListItem[];
  aiLoading: boolean;
  onGenerateAiSummary: () => void;
  onMarkTreated: () => void;
  onAddComment: () => void;
  onCreateTask: () => void;
  onAssignChange: (assigneeId: string | null) => void;
  onStatusChange: (status: EmailStatusApi) => void;
}

const historyDotClass = {
  violet: "bg-violet-500 ring-violet-100",
  blue: "bg-blue-500 ring-blue-100",
  emerald: "bg-emerald-500 ring-emerald-100",
  slate: "bg-slate-400 ring-slate-100",
} as const;

export function EmailAiPanel({
  email,
  users,
  aiLoading,
  onGenerateAiSummary,
  onMarkTreated,
  onAddComment,
  onCreateTask,
  onAssignChange,
  onStatusChange,
}: EmailAiPanelProps) {
  if (!email) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 text-center shadow-sm">
        <p className="text-xs text-slate-400">Détails et analyse IA</p>
      </div>
    );
  }

  const history = buildEmailHistory(email);
  const hasSummary = Boolean(email.aiSummary?.trim());

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-0.5">
      {/* Résumé IA */}
      <section className="shrink-0 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-[#0F172A]">Résumé IA</h3>
          </div>
          {hasSummary ? (
            <button
              type="button"
              onClick={onGenerateAiSummary}
              disabled={aiLoading}
              className="text-[11px] font-medium text-violet-600 transition hover:text-violet-800 disabled:opacity-50"
            >
              {aiLoading ? "…" : "Régénérer"}
            </button>
          ) : null}
        </div>

        {hasSummary ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-[#475569]">{email.aiSummary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {email.aiCategory ? (
                <span className="rounded-lg bg-white/70 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                  {email.aiCategory}
                </span>
              ) : null}
              {email.aiPriority ? (
                <span className="rounded-lg bg-white/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  Priorité : {email.aiPriority}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-slate-400">Résumé IA non généré</p>
            <button
              type="button"
              onClick={onGenerateAiSummary}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Générer résumé IA
            </button>
          </div>
        )}
      </section>

      {/* Métadonnées */}
      <section className="shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Métadonnées</h3>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">Catégorie</dt>
            <dd>
              <span
                className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-medium ${emailCategoryBadgeClass[email.category]}`}
              >
                {email.category}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">Priorité</dt>
            <dd className="font-medium text-slate-800">{emailPriorityLabel(email)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">Statut</dt>
            <dd>
              <select
                value={
                  email.status === "A traiter"
                    ? "A_TRAITER"
                    : email.status === "En cours"
                      ? "EN_COURS"
                      : email.status === "Traite"
                        ? "TRAITE"
                        : "ARCHIVE"
                }
                onChange={(e) => onStatusChange(e.target.value as EmailStatusApi)}
                className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium outline-none ${emailStatusBadgeClass[email.status]}`}
              >
                <option value="A_TRAITER">A traiter</option>
                <option value="EN_COURS">En cours</option>
                <option value="TRAITE">Traite</option>
                <option value="ARCHIVE">Archive</option>
              </select>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="shrink-0 text-slate-500">Assigné à</dt>
            <dd className="min-w-0">
              <select
                value={email.assigneeId ?? ""}
                onChange={(e) => onAssignChange(e.target.value || null)}
                className="max-w-[140px] truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800 outline-none focus:border-violet-300"
              >
                <option value="">Non assigné</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </dd>
          </div>
          {email.patientName ? (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500">Patient</dt>
              <dd className="truncate font-medium text-slate-800">{email.patientName}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {/* Actions rapides */}
      <section className="shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions rapides</h3>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={onCreateTask}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50"
          >
            <ListTodo className="h-3.5 w-3.5 text-violet-600" />
            Créer tâche
          </button>
          <button
            type="button"
            onClick={onAddComment}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-violet-600" />
            Ajouter commentaire
          </button>
          <button
            type="button"
            onClick={onMarkTreated}
            className="flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-left text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Marquer traité
          </button>
        </div>
      </section>

      {/* Historique */}
      <section className="shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Historique</h3>
        <ol className="relative mt-4 space-y-4 border-l border-slate-200 pl-4">
          {history.map((event, i) => (
            <li key={event.id} className="relative">
              <span
                className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full ring-4 ${historyDotClass[event.tone]}`}
              />
              <p className="text-xs font-semibold text-slate-800">{event.label}</p>
              {event.detail ? (
                <p className="mt-0.5 text-[11px] text-slate-500">{event.detail}</p>
              ) : null}
              {i === 0 ? null : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
