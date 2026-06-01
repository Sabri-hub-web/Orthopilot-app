"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  ListTodo,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Reply,
  Send,
  UserPlus,
} from "lucide-react";
import { EmailAttachments } from "@/components/emails/email-attachments";
import { cleanEmailBody } from "@/lib/email-html";
import {
  displaySenderName,
  gmailReplyUrl,
  gmailThreadUrl,
  initialsFromEmail,
  isEmailTreated,
  isGmailEmail,
} from "@/lib/emails-ui";
import type { FormEvent } from "react";
import type { PriorityEmail, UsersListItem } from "@/types/domain";

interface EmailViewerProps {
  email: PriorityEmail | null;
  users: UsersListItem[];
  replyDraft: string;
  replySending: boolean;
  onReplyChange: (v: string) => void;
  onReplySubmit: (e: FormEvent) => void;
  onMarkTreated: () => void;
  onAssignChange: (assigneeId: string | null) => void;
  onCreateTask: () => void;
  onEdit: () => void;
}

export function EmailViewer({
  email,
  users,
  replyDraft,
  replySending,
  onReplyChange,
  onReplySubmit,
  onMarkTreated,
  onAssignChange,
  onCreateTask,
  onEdit,
}: EmailViewerProps) {
  const [assignOpen, setAssignOpen] = useState(false);

  if (!email) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
          <Mail className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Sélectionnez un email</p>
        <p className="mt-1 text-xs text-slate-400">Choisissez un message dans la liste pour le lire</p>
      </div>
    );
  }

  const gmail = isGmailEmail(email);
  const treated = isEmailTreated(email);
  const threadUrl = gmailThreadUrl(email);
  const replyUrl = gmailReplyUrl(email);

  const cleanedBody =
    cleanEmailBody(email.bodyText) || cleanEmailBody(email.snippet);
  const bodyText = cleanedBody || "Aucun contenu lisible pour cet email.";

  const notes = (email.comment ?? "")
    .split(/\n\n---\n/)
    .map((n) => n.trim())
    .filter(Boolean);

  const btnGhost =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50";

  const assigneeName = email.assignee && email.assignee !== "Non assignee" ? email.assignee : null;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold leading-snug text-[#0F172A]">{email.subject}</h2>
          {treated ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Traité
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-[10px] font-bold text-white">
            {initialsFromEmail(email.from)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#0F172A]">{displaySenderName(email.from)}</p>
            <p className="truncate text-[11px] text-slate-400">{email.from}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-slate-400">
              {email.receivedDate} · {email.receivedAt}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{email.category}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {gmail ? (
            <>
              <a
                href={threadUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:opacity-90"
              >
                <ExternalLink className="h-3 w-3" />
                Ouvrir dans Gmail
              </a>
              <a
                href={replyUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={btnGhost}
              >
                <Reply className="h-3 w-3" />
                Répondre dans Gmail
              </a>
            </>
          ) : null}

          <div className="relative">
            <button
              type="button"
              onClick={() => setAssignOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-medium transition ${
                assigneeName
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100/70"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50"
              }`}
            >
              <UserPlus className="h-3 w-3" />
              {assigneeName ? `Assigné à ${assigneeName}` : "Non assigné"}
            </button>
            {assignOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAssignOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      onAssignChange(null);
                      setAssignOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-[12px] transition hover:bg-slate-50 ${
                      !email.assigneeId ? "font-semibold text-violet-700" : "text-slate-600"
                    }`}
                  >
                    Non assigné
                  </button>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        onAssignChange(user.id);
                        setAssignOpen(false);
                      }}
                      className={`block w-full truncate rounded-lg px-3 py-1.5 text-left text-[12px] transition hover:bg-slate-50 ${
                        email.assigneeId === user.id ? "font-semibold text-violet-700" : "text-slate-700"
                      }`}
                    >
                      {user.fullName}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {!treated ? (
            <button type="button" onClick={onMarkTreated} className={btnGhost}>
              <CheckCircle2 className="h-3 w-3" />
              Marquer traité
            </button>
          ) : null}

          <button type="button" onClick={onCreateTask} className={btnGhost}>
            <ListTodo className="h-3 w-3" />
            Créer tâche
          </button>

          {!gmail ? (
            <button type="button" onClick={onEdit} className={btnGhost}>
              <Pencil className="h-3 w-3" />
              Modifier
            </button>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700 [overflow-wrap:anywhere]">
            {bodyText}
          </div>

          <div className="mt-6">
            <EmailAttachments attachments={email.attachments ?? []} gmailThreadUrl={threadUrl} />
          </div>

          {notes.length > 0 ? (
            <section className="mt-6 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                Commentaire interne
              </p>
              {notes.length === 1 ? (
                <div className="rounded-xl border-l-4 border-amber-300 bg-amber-50/70 px-4 py-3">
                  {email.assignee && email.assignee !== "Non assignee" ? (
                    <p className="mb-1 text-[11px] font-medium text-amber-700">{email.assignee}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                    {notes[0]}
                  </p>
                </div>
              ) : (
                <ol className="space-y-2">
                  {notes.map((note, i) => (
                    <li
                      key={i}
                      className="rounded-xl border-l-4 border-amber-300 bg-amber-50/70 px-4 py-3"
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                        {note}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ) : null}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
        <form onSubmit={onReplySubmit}>
          <div className="relative mx-auto max-w-3xl">
            <input
              id="email-reply-input"
              value={replyDraft}
              onChange={(e) => onReplyChange(e.target.value)}
              placeholder="Ajouter un commentaire interne…"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-24 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
            />
            <button
              type="submit"
              disabled={replySending || !replyDraft.trim()}
              className="absolute right-2 top-1/2 flex h-8 -translate-y-1/2 items-center gap-1 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
            >
              {replySending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Ajouter
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
