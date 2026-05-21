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

interface MessagesDetailsProps {
  peerId: string | null;
  peerName: string | null;
  messages: InternalMessageLine[];
  presence?: PresenceTeamMember;
}

const DEMO_FILES = [
  { name: "releve_reglement_martin_lucas.pdf", type: "pdf" as const, size: 245760 },
  { name: "plan_traitement_martin_lucas.xlsx", type: "xlsx" as const, size: 189440 },
];

function uniqueAttachments(messages: InternalMessageLine[]): MessageAttachmentMeta[] {
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

export function MessagesDetails({ peerId, peerName, messages, presence }: MessagesDetailsProps) {
  const [notificationsOn, setNotificationsOn] = useState(true);

  const allAtt = useMemo(() => uniqueAttachments(messages), [messages]);
  const docAtt = allAtt.filter((a) => !a.mimeType.startsWith("image/"));
  const imgAtt = allAtt.filter((a) => a.mimeType.startsWith("image/"));
  const showDemoFiles = peerId && docAtt.length === 0;

  if (!peerId || !peerName) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-400">
        Détails de la conversation
      </div>
    );
  }

  const online = isPresenceOnline(presence);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-slate-100 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Détails de la conversation
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
          <span className="relative inline-block">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5CDE] to-indigo-600 text-sm font-bold text-white">
              {initialsFromName(peerName)}
            </span>
            {online ? (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            ) : null}
          </span>
          <p className="mt-2 text-sm font-semibold text-slate-900">{peerName}</p>
          {presence?.roleLabel ? (
            <p className="text-xs text-slate-500">{presence.roleLabel}</p>
          ) : null}
          <p className={`mt-0.5 text-xs font-medium ${online ? "text-emerald-600" : "text-slate-400"}`}>
            {online ? "En ligne" : presenceStatusLabel(presence)}
          </p>
        </div>

        <nav className="mt-4 space-y-0.5">
          {[
            { icon: User, label: "Voir le profil" },
            { icon: Search, label: "Rechercher dans la conversation" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              disabled
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-600 opacity-55"
            >
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              {label}
            </button>
          ))}
          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <span className="flex items-center gap-2 text-xs text-slate-600">
              <Bell className="h-3.5 w-3.5 text-slate-400" />
              Notifications
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsOn}
              onClick={() => setNotificationsOn((v) => !v)}
              className={`relative h-5 w-9 rounded-full ${notificationsOn ? "bg-[#5D5CDE]" : "bg-slate-200"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${notificationsOn ? "left-4" : "left-0.5"}`}
              />
            </button>
          </div>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-red-500 opacity-55"
          >
            <Archive className="h-3.5 w-3.5" />
            Archiver la conversation
          </button>
        </nav>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Fichiers partagés
            </h3>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
              {showDemoFiles ? DEMO_FILES.length : docAtt.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {showDemoFiles
              ? DEMO_FILES.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-2 py-2 opacity-75"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.type === "pdf" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      {f.type === "pdf" ? (
                        <FileText className="h-3.5 w-3.5" />
                      ) : (
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-slate-700">{f.name}</span>
                      <span className="text-[9px] text-slate-400">
                        {formatFileSize(f.size)} · Exemple
                      </span>
                    </span>
                  </div>
                ))
              : docAtt.map((f) => (
                  <a
                    key={f.id}
                    href={attachmentDownloadUrl(f.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-2 py-2 transition hover:bg-slate-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                      {f.fileName}
                    </span>
                    <Download className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </a>
                ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Médias partagés
            </h3>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
              {imgAtt.length > 0 ? imgAtt.length : 1}
            </span>
          </div>
          {imgAtt.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {imgAtt.map((img) => (
                <a
                  key={img.id}
                  href={attachmentDownloadUrl(img.id, true)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-lg border border-slate-200"
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
            <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
              <div className="text-center">
                <ImageIcon className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-1 text-[9px] text-slate-400">Radio / imagerie</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
