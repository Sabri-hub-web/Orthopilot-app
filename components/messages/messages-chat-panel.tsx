"use client";

import {
  ArrowLeft,
  CheckCheck,
  Info,
  MoreHorizontal,
  Phone,
  Video,
} from "lucide-react";
import {
  formatBubbleTime,
  groupMessagesByDay,
  initialsFromName,
  presenceStatusLabel,
} from "@/lib/messages-ui";
import { MessagesComposer, type PendingMessageFile } from "@/components/messages/messages-composer";
import { MessagesMessageAttachments } from "@/components/messages/messages-message-attachments";
import type { FormEvent, RefObject } from "react";
import type { InternalMessageLine, PresenceTeamMember } from "@/types/domain";

interface MessagesChatPanelProps {
  peerId: string | null;
  peerName: string | null;
  currentUserName: string;
  messages: InternalMessageLine[];
  loading: boolean;
  sending: boolean;
  draft: string;
  pendingFiles: PendingMessageFile[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  presence?: PresenceTeamMember;
  showMobileBack?: boolean;
  onBack?: () => void;
  onDraftChange: (v: string) => void;
  onSend: (e: FormEvent) => void;
  onPickFiles: () => void;
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="shrink-0 text-[11px] font-medium text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </li>
  );
}

export function MessagesChatPanel({
  peerId,
  peerName,
  currentUserName,
  messages,
  loading,
  sending,
  draft,
  pendingFiles,
  fileInputRef,
  presence,
  showMobileBack,
  onBack,
  onDraftChange,
  onSend,
  onPickFiles,
  onFilesSelected,
  onRemoveFile,
  messagesEndRef,
}: MessagesChatPanelProps) {
  const statusLabel = presenceStatusLabel(presence);
  const online = presence?.isOnline && presence.presenceStatus === "DISPONIBLE";
  const dayGroups = groupMessagesByDay(messages);

  if (!peerId) {
    return (
      <section className="flex h-full min-h-0 flex-col items-center justify-center bg-slate-50/30 p-8 text-center">
        <p className="text-sm font-medium text-slate-600">Sélectionnez une conversation</p>
        <p className="mt-1 text-xs text-slate-400">Choisissez un collègue dans la liste à gauche.</p>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-2.5">
        {showMobileBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
        <span className="relative shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[10px] font-bold text-white">
            {initialsFromName(peerName ?? "")}
          </span>
          {online ? (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{peerName}</p>
          <p className={`text-xs ${online ? "text-emerald-600" : "text-slate-400"}`}>{statusLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled
            title="Appel — bientôt disponible"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-50"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            title="Visio — bientôt disponible"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-50"
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            title="Informations — panneau à droite"
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-50 xl:flex"
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-50"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#fafbfc] px-4 py-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Chargement des messages…</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Aucun message. Envoyez le premier.</p>
        ) : (
          <ul className="space-y-1">
            {dayGroups.map((group) => (
              <li key={group.dayKey}>
                <ul>
                  <DateSeparator label={group.label} />
                  {group.items.map((m) => {
                    const hasBody = m.body.trim().length > 0;
                    const hasAtt = m.attachments.length > 0;
                    const read = m.isMine && m.readAt != null;

                    if (m.isMine) {
                      return (
                        <li key={m.id} className="mb-3 flex items-end justify-end gap-2">
                          <div className="flex max-w-[72%] flex-col items-end">
                            <div className="rounded-2xl rounded-br-md bg-[#5D5CDE] px-3.5 py-2 text-white shadow-sm">
                              {hasBody ? (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                              ) : null}
                              {hasAtt ? (
                                <MessagesMessageAttachments attachments={m.attachments} variant="sent" />
                              ) : null}
                            </div>
                            <span className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                              {formatBubbleTime(m.createdAt)}
                              <CheckCheck
                                className={`h-3.5 w-3.5 ${read ? "text-[#5D5CDE]" : "text-slate-300"}`}
                                strokeWidth={2.5}
                              />
                            </span>
                          </div>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5CDE] to-indigo-600 text-[9px] font-bold text-white">
                            {initialsFromName(currentUserName)}
                          </span>
                        </li>
                      );
                    }

                    return (
                      <li key={m.id} className="mb-3 flex items-end gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
                          {initialsFromName(peerName ?? "")}
                        </span>
                        <div className="max-w-[72%]">
                          <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2 text-slate-800 shadow-sm">
                            {hasBody ? (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                            ) : null}
                            {hasAtt ? (
                              <MessagesMessageAttachments attachments={m.attachments} variant="received" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">{formatBubbleTime(m.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
      </div>

      <MessagesComposer
        value={draft}
        sending={sending}
        pendingFiles={pendingFiles}
        fileInputRef={fileInputRef}
        onChange={onDraftChange}
        onSubmit={onSend}
        onPickFiles={onPickFiles}
        onFilesSelected={onFilesSelected}
        onRemoveFile={onRemoveFile}
      />
    </section>
  );
}
