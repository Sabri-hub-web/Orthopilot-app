"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

interface PatientHubViewProps {
  patientId: string;
}

export function PatientHubView({ patientId }: PatientHubViewProps) {
  const [hub, setHub] = useState<PatientHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PatientFormPayload | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setSuccess("Fiche enregistree avec succes.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <Link href="/patients" className="inline-block text-sm font-medium text-emerald-700 hover:underline">
        Retour a la liste patients
      </Link>
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Informations generales</h3>
        <form onSubmit={handleSave} className="mt-4 grid gap-2 md:grid-cols-2">
          <input
            value={form.firstName}
            onChange={(e) => setForm((f) => (f ? { ...f, firstName: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Prenom"
            required
          />
          <input
            value={form.lastName}
            onChange={(e) => setForm((f) => (f ? { ...f, lastName: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Nom"
            required
          />
          <input
            value={form.email ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Email"
          />
          <input
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, phone: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Telephone"
          />
          <input
            value={form.legalGuardian ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, legalGuardian: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
            placeholder="Responsable legal (si disponible)"
          />
          <input
            type="datetime-local"
            value={form.nextAppointmentAt ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, nextAppointmentAt: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.mutuelle ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, mutuelle: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Mutuelle (si disponible)"
          />
          <select
            value={form.hubStatus ?? "ACTIF"}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, hubStatus: e.target.value as PatientHubStatusApi } : f))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          >
            {hubStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <textarea
            value={form.internalComment ?? ""}
            onChange={(e) => setForm((f) => (f ? { ...f, internalComment: e.target.value } : f))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2"
            rows={3}
            placeholder="Commentaire interne (suivi administratif)"
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Reglements lies</h3>
          <Link href="/reglements" className="text-xs font-medium text-emerald-700 hover:underline">
            Ouvrir module Reglements
          </Link>
        </div>
        {hub.reglements.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun reglement lie.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {hub.reglements.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-slate-800">
                  {r.amountDue} EUR — echeance {r.dueDate} — {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Taches liees</h3>
          <Link href="/tasks" className="text-xs font-medium text-emerald-700 hover:underline">
            Ouvrir module Taches
          </Link>
        </div>
        {hub.tasks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucune tache liee.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {hub.tasks.map((t) => (
              <li key={t.id} className="py-2">
                <span className="font-medium text-slate-900">{t.title}</span>
                <span className="ml-2 text-slate-600">
                  {t.dueDate} — {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Emails lies</h3>
          <Link href="/emails" className="text-xs font-medium text-emerald-700 hover:underline">
            Ouvrir module Emails
          </Link>
        </div>
        {hub.emails.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun email lie.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {hub.emails.map((m) => (
              <li key={m.id} className="py-2">
                <span className="font-medium text-slate-900">{m.subject}</span>
                <span className="ml-2 text-slate-600">
                  {m.receivedDate} — {m.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Historique (logs patient)</h3>
          <Link href="/logs" className="text-xs font-medium text-emerald-700 hover:underline">
            Journal global
          </Link>
        </div>
        {hub.logs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucun log indexe sur ce patient pour le moment.</p>
        ) : (
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {hub.logs.map((log) => (
              <li key={log.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">
                  {formatLogDate(log.createdAt)} — {log.actor}
                </p>
                <p className="text-slate-800">{log.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
