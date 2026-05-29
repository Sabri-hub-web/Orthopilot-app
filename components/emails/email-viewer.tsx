"use client";

import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
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
import type { PriorityEmail } from "@/types/domain";

interface EmailViewerProps {
  email: PriorityEmail | null;
  replyDraft: string;
  replySending: boolean;
  onReplyChange: (v: string) => void;
  onReplySubmit: (e: FormEvent) => void;
  onMarkTreated: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EmailViewer({
  email,
  replyDraft,
  replySending,
  onReplyChange,
  onReplySubmit,
  onMarkTreated,
  onEdit,
}: EmailViewerProps) {
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
    cleanEmailBody(email.bodyText) ||
    email.comment?.trim() ||
    cleanEmailBody(email.snippet);
  const bodyText = cleanedBody || "Aucun contenu lisible pour cet email.";

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold leading-snug text-[#0F172A]">{email.subject}</h2>

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
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {email.category}
              {treated ? " · Traité" : ""}
            </p>
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50"
              >
                <Reply className="h-3 w-3" />
                Répondre dans Gmail
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={() => document.getElementById("email-reply-input")?.focus()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50"
            >
              <Reply className="h-3 w-3" />
              Commenter
            </button>
          )}
          {!treated ? (
            <button
              type="button"
              onClick={onMarkTreated}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <CheckCircle2 className="h-3 w-3" />
              Marquer traité
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50"
          >
            <UserPlus className="h-3 w-3" />
            Assigner
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4">
        <div className="max-w-none whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">
          {bodyText}
        </div>
        <div className="mt-6">
          <EmailAttachments attachments={email.attachments ?? []} gmailThreadUrl={threadUrl} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
        <form onSubmit={onReplySubmit}>
          <div className="relative">
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
