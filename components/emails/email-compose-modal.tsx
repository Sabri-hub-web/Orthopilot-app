"use client";

import { X } from "lucide-react";
import type { EmailCategoryApi, EmailFormPayload, EmailStatusApi, PatientListItem, UsersListItem } from "@/types/domain";

interface EmailComposeModalProps {
  open: boolean;
  editing: boolean;
  form: EmailFormPayload;
  isSubmitting: boolean;
  patients: PatientListItem[];
  users: UsersListItem[];
  categoryOptions: { value: EmailCategoryApi; label: string }[];
  statusOptions: { value: EmailStatusApi; label: string }[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (patch: Partial<EmailFormPayload>) => void;
}

export function EmailComposeModal({
  open,
  editing,
  form,
  isSubmitting,
  patients,
  users,
  categoryOptions,
  statusOptions,
  onClose,
  onSubmit,
  onChange,
}: EmailComposeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-compose-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="email-compose-title" className="text-base font-semibold text-slate-900">
            {editing ? "Modifier l'email" : "Enregistrer un email"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form id="email-compose-form" onSubmit={onSubmit} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.sender}
              onChange={(e) => onChange({ sender: e.target.value })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
              placeholder="Expéditeur (email ou nom)"
              required
            />
            <input
              type="datetime-local"
              value={form.receivedAt}
              onChange={(e) => onChange({ receivedAt: e.target.value })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15"
              required
            />
            <input
              value={form.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
              placeholder="Objet"
              required
            />
            <select
              value={form.category}
              onChange={(e) => onChange({ category: e.target.value as EmailCategoryApi })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300"
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={form.status ?? "A_TRAITER"}
              onChange={(e) => onChange({ status: e.target.value as EmailStatusApi })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300"
            >
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={form.assigneeId ?? ""}
              onChange={(e) => onChange({ assigneeId: e.target.value || null })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300"
            >
              <option value="">Non assigné</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
            <select
              value={form.patientId ?? ""}
              onChange={(e) => onChange({ patientId: e.target.value || null })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300"
            >
              <option value="">Sans patient lié</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </select>
            <textarea
              value={form.comment ?? ""}
              onChange={(e) => onChange({ comment: e.target.value })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
              rows={3}
              placeholder="Commentaire interne"
            />
          </div>
        </form>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="email-compose-form"
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Enregistrement…" : editing ? "Enregistrer" : "Créer"}
          </button>
        </footer>
      </div>
    </div>
  );
}
