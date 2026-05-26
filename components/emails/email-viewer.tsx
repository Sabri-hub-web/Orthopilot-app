"use client";

import {
  CheckCircle2,
  Forward,
  ListTodo,
  Loader2,
  Mail,
  MoreHorizontal,
  Reply,
  Send,
  Smile,
  Paperclip,
  UserPlus,
} from "lucide-react";
import { EmailAttachments } from "@/components/emails/email-attachments";
import {
  displaySenderName,
  emailCategoryBadgeClass,
  emailStatusBadgeClass,
  initialsFromEmail,
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
  onDelete,
}: EmailViewerProps) {
  if (!email) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
          <Mail className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">Sélectionnez un email</p>
        <p className="mt-1 text-xs text-slate-400">Choisissez un message dans la liste pour le lire</p>
      </div>
    );
  }

  const bodyText =
    email.bodyText?.trim() ||
    email.comment?.trim() ||
    `Objet : ${email.subject}\n\nAucun contenu détaillé enregistré pour cet email. Utilisez le commentaire interne pour ajouter des notes.`;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="shrink-0 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-xs font-bold text-white">
            {initialsFromEmail(email.from)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-[#0F172A]">
                {displaySenderName(email.from)}
              </h2>
              <span
                className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-medium ${emailCategoryBadgeClass[email.category]}`}
              >
                {email.category}
              </span>
              <span
                className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-medium ${emailStatusBadgeClass[email.status]}`}
              >
                {email.status}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-[#475569]">{email.from}</p>
            <p className="mt-1 text-[11px] text-slate-400">
              Reçu le {email.receivedDate} à {email.receivedAt}
              {email.patientName ? ` · Patient : ${email.patientName}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {[
            { icon: Reply, label: "Répondre", action: () => document.getElementById("email-reply-input")?.focus() },
            { icon: Forward, label: "Transférer", action: undefined },
            { icon: CheckCircle2, label: "Marquer traité", action: onMarkTreated },
            { icon: ListTodo, label: "Créer tâche", action: undefined },
            { icon: UserPlus, label: "Assigner", action: onEdit },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/50"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
          <div className="relative ml-auto">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              onClick={() => {
                const choice = window.confirm("Actions : OK = Modifier, Annuler = Supprimer");
                if (choice) onEdit();
                else onDelete();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <h3 className="text-lg font-semibold leading-snug text-[#0F172A]">{email.subject}</h3>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">{bodyText}</div>
        <div className="mt-6">
          <EmailAttachments subject={email.subject} comment={email.comment} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
        <form onSubmit={onReplySubmit} className="space-y-2">
          <div className="relative">
            <input
              id="email-reply-input"
              value={replyDraft}
              onChange={(e) => onReplyChange(e.target.value)}
              placeholder="Rédiger une réponse ou un commentaire interne…"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-28 text-sm text-slate-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Pièce jointe"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={replySending || !replyDraft.trim()}
                className="flex h-8 items-center gap-1 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
              >
                {replySending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Envoyer
              </button>
            </div>
          </div>
        </form>
      </footer>
    </div>
  );
}
