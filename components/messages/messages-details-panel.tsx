"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Bell,
  Download,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Search,
  User,
} from "lucide-react";
import {
  attachmentDownloadUrl,
  formatFileSize,
  initialsFromName,
  isPresenceOnline,
  presenceStatusLabel,
} from "@/lib/messages-ui";
import type { InternalMessageLine, MessageAttachmentMeta, PresenceTeamMember } from "@/types/domain";

interface MessagesDetailsPanelProps {
  peerId: string | null;
  peerName: string | null;
  messages: InternalMessageLine[];
  presence?: PresenceTeamMember;
}

const PLACEHOLDER_FILES = [
  {
    id: "demo-pdf",
    fileName: "releve_reglement_martin_lucas.pdf",
    mimeType: "application/pdf",
    sizeBytes: 245760,
    date: "12 mai",
    demo: true,
  },
  {
    id: "demo-xlsx",
    fileName: "plan_traitement_martin_lucas.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: 189440,
    date: "8 mai",
    demo: true,
  },
] as const;

function collectAttachments(messages: InternalMessageLine[]): MessageAttachmentMeta[] {
  const seen = new Set<string>();
  const out: MessageAttachmentMeta[] = [];
  for (const m of [...messages].reverse()) {
    for (const a of m.attachments) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        out.push(a);
      }
    }
  }
  return out;
}

function FileRow({
  fileName,
  mimeType,
  sizeBytes,
  href,
  demo,
}: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  href?: string;
  demo?: boolean;
}) {
  const isPdf = mimeType.includes("pdf");
  const Icon = isPdf ? FileText : FileSpreadsheet;
  const iconBg = isPdf ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600";

  const inner = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-slate-800">{fileName}</span>
        <span className="text-[10px] text-slate-400">
          {formatFileSize(sizeBytes)}
          {demo ? " · Exemple" : ""}
        </span>
      </span>
      {href ? <Download className="h-4 w-4 shrink-0 text-slate-400" /> : null}
    </>
  );

  if (href && !demo) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-2.5 py-2 transition hover:bg-slate-100"
      >
        {inner}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 px-2.5 py-2 opacity-80">
      {inner}
    </div>
  );
}

export function MessagesDetailsPanel({ peerId, peerName, messages, presence }: MessagesDetailsPanelProps) {
  const [notificationsOn, setNotificationsOn] = useState(true);

  const realFiles = useMemo(() => collectAttachments(messages), [messages]);
  const realImages = realFiles.filter((f) => f.mimeType.startsWith("image/"));
  const realDocs = realFiles.filter((f) => !f.mimeType.startsWith("image/"));

  type DocRow = MessageAttachmentMeta & { demo?: boolean };
  const displayDocs: DocRow[] =
    realDocs.length > 0
      ? realDocs
      : peerId
        ? PLACEHOLDER_FILES.map((p) => ({
            id: p.id,
            fileName: p.fileName,
            mimeType: p.mimeType,
            sizeBytes: p.sizeBytes,
            demo: true,
          }))
        : [];

  if (!peerId || !peerName) {
    return (
      <aside className="hidden h-full min-h-0 flex-col overflow-hidden bg-white xl:flex">
        <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-slate-400">
          Sélectionnez une conversation pour voir les détails.
        </div>
      </aside>
    );
  }

  const online = isPresenceOnline(presence);
  const statusLabel = presenceStatusLabel(presence);

  return (
    <aside className="hidden h-full min-h-0 w-full flex-col overflow-hidden bg-white xl:flex">
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Détails de la conversation</h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-5 text-center">
          <span className="relative">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5CDE] to-indigo-600 text-sm font-bold text-white">
              {initialsFromName(peerName)}
            </span>
            {online ? (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            ) : null}
          </span>
          <p className="mt-3 text-base font-semibold text-slate-900">{peerName}</p>
          {presence?.roleLabel ? (
            <p className="mt-0.5 text-sm text-slate-500">{presence.roleLabel}</p>
          ) : null}
          <p className={`mt-1 text-xs font-medium ${online ? "text-emerald-600" : "text-slate-400"}`}>
            {statusLabel}
          </p>
        </div>

        <nav className="mt-4 space-y-0.5">
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm text-slate-700 opacity-60"
          >
            <User className="h-4 w-4 text-slate-400" />
            Voir le profil
          </button>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm text-slate-700 opacity-60"
          >
            <Search className="h-4 w-4 text-slate-400" />
            Rechercher dans la conversation
          </button>
          <div className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2.5">
            <span className="flex items-center gap-2.5 text-sm text-slate-700">
              <Bell className="h-4 w-4 text-slate-400" />
              Notifications
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsOn}
              onClick={() => setNotificationsOn((v) => !v)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition ${notificationsOn ? "bg-[#5D5CDE]" : "bg-slate-200"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${notificationsOn ? "left-4" : "left-0.5"}`}
              />
            </button>
          </div>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm text-red-600 opacity-60"
          >
            <Archive className="h-4 w-4" />
            Archiver la conversation
          </button>
        </nav>

        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fichiers partagés
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {displayDocs.length}
            </span>
          </div>
          <div className="space-y-2">
            {displayDocs.map((f) => (
              <FileRow
                key={f.id}
                fileName={f.fileName}
                mimeType={f.mimeType}
                sizeBytes={f.sizeBytes}
                href={f.demo ? undefined : attachmentDownloadUrl(f.id)}
                demo={f.demo}
              />
            ))}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Médias partagés
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {realImages.length > 0 ? realImages.length : peerId ? 1 : 0}
            </span>
          </div>
          {realImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {realImages.map((img) => (
                <a
                  key={img.id}
                  href={attachmentDownloadUrl(img.id, true)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-xl border border-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachmentDownloadUrl(img.id, true)}
                    alt={img.fileName}
                    className="aspect-square w-full object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-1 text-[10px] text-slate-400">Aucun média · placeholder</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
