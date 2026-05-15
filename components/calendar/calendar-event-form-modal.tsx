"use client";

import { X } from "lucide-react";
import { CALENDAR_EVENT_TYPES, calendarEventTypeLabelMap } from "@/lib/calendar";
import type { CalendarEventItem, CalendarEventTypeApi } from "@/types/domain";

interface CalendarEventFormModalProps {
  open: boolean;
  editing: CalendarEventItem | null;
  canManage: boolean;
  saving: boolean;
  formTitle: string;
  formDescription: string;
  formStart: string;
  formEnd: string;
  formType: CalendarEventTypeApi;
  formAssigneeId: string;
  formPatientId: string;
  assignees: { id: string; fullName: string }[];
  patients: { id: string; fullName: string }[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onTypeChange: (v: CalendarEventTypeApi) => void;
  onAssigneeChange: (v: string) => void;
  onPatientChange: (v: string) => void;
}

export function CalendarEventFormModal({
  open,
  editing,
  canManage,
  saving,
  formTitle,
  formDescription,
  formStart,
  formEnd,
  formType,
  formAssigneeId,
  formPatientId,
  assignees,
  patients,
  onClose,
  onSubmit,
  onTitleChange,
  onDescriptionChange,
  onStartChange,
  onEndChange,
  onTypeChange,
  onAssigneeChange,
  onPatientChange,
}: CalendarEventFormModalProps) {
  if (!open || !canManage) return null;

  return (
    <section
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-event-form-title"
    >
      <article className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <header className="flex items-start justify-between gap-3">
          <h2 id="calendar-event-form-title" className="text-base font-semibold text-slate-900">
            {editing ? "Modifier l'événement" : "Nouvel événement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs sm:col-span-2">
            Titre
            <input
              required
              value={formTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Type
            <select
              value={formType}
              onChange={(e) => onTypeChange(e.target.value as CalendarEventTypeApi)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              {CALENDAR_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {calendarEventTypeLabelMap[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs sm:col-span-2">
            Description (optionnel)
            <textarea
              value={formDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Début
            <input
              type="datetime-local"
              required
              value={formStart}
              onChange={(e) => onStartChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Fin
            <input
              type="datetime-local"
              required
              value={formEnd}
              onChange={(e) => onEndChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Assigné à
            <select
              value={formAssigneeId}
              onChange={(e) => onAssigneeChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Patient (optionnel)
            <select
              value={formPatientId}
              onChange={(e) => onPatientChange(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="">—</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </label>
          <section className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700"
            >
              Annuler
            </button>
          </section>
        </form>
      </article>
    </section>
  );
}
