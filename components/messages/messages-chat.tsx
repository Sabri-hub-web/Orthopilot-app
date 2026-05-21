"use client";

import {
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
import { MessagesRecipientSelect } from "@/components/messages/messages-recipient-select";
import { MessagesMessageAttachments } from "@/components/messages/messages-message-attachments";
import type { FormEvent, RefObject } from "react";
import type { InternalMessageLine, PresenceTeamMember, RecipientOption } from "@/types/domain";

interface MessagesChatProps {
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
  recipients: RecipientOption[];
  presenceMap: Map<string, PresenceTeamMember>;
  onRecipientChange: (peerId: string) => void;
  onDraftChange: (v: string) => void;
  onSend: (e: FormEvent) => void;
  onPickFiles: () => void;
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
}

function DayLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="shrink-0 text-[11px] font-medium text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export function MessagesChat({
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
  recipients,
  presenceMap,
  onRecipientChange,
  onDraftChange,
  onSend,
  onPickFiles,
  onFilesSelected,
  onRemoveFile,
  messagesEndRef,
}: MessagesChatProps) {
  const online = presence?.isOnline && presence.presenceStatus === "DISPONIBLE";
  const statusLabel = online ? "En ligne" : presenceStatusLabel(presence);
  const dayGroups = groupMessagesByDay(messages);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {peerId ? (
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-2.5">
          <span className="relative shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-[10px] font-bold text-white">
              {initialsFromName(peerName ?? "")}
            </span>
            {online ? (
              <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{peerName}</p>
            <p className={`text-xs ${online ? "font-medium text-emerald-600" : "text-slate-400"}`}>
              {statusLabel}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            {[Phone, Video, Info, MoreHorizontal].map((Icon, i) => (
              <button
                key={i}
                type="button"
                disabled
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:opacity-45"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </header>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8f9fb] px-4">
        {!peerId ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Choisissez un collègue dans la liste déroulante ci-dessous.
          </p>
        ) : loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Chargement…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Aucun message. Écrivez ci-dessous.</p>
        ) : (
          <div className="pb-2 pt-1">
            {dayGroups.map((group) => (
              <div key={group.dayKey}>
                <DayLine label={group.label} />
                <div className="space-y-3">
                  {group.items.map((m) => {
                    const hasBody = m.body.trim().length > 0;
                    const hasAtt = m.attachments.length > 0;
                    const read = m.isMine && m.readAt != null;

                    if (m.isMine) {
                      return (
                        <div key={m.id} className="flex items-end justify-end gap-2">
                          <div className="flex max-w-[60%] flex-col items-end">
                            <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-[#5D5CDE] to-[#6b6be8] px-4 py-2.5 text-white shadow-sm">
                              {hasBody ? (
                                <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.body}</p>
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
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5D5CDE] to-indigo-600 text-[8px] font-bold text-white">
                            {initialsFromName(currentUserName)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={m.id} className="flex items-end gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-600">
                          {initialsFromName(peerName ?? "")}
                        </span>
                        <div className="max-w-[60%]">
                          <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-slate-800 shadow-sm">
                            {hasBody ? (
                              <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{m.body}</p>
                            ) : null}
                            {hasAtt ? (
                              <MessagesMessageAttachments attachments={m.attachments} variant="received" />
                            ) : null}
                          </div>
                          <p className="mt-1 text-[10px] text-slate-400">{formatBubbleTime(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} className="h-1 shrink-0" aria-hidden />
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-4 pt-2.5">
        <MessagesRecipientSelect
          id="chat-recipient"
          recipients={recipients}
          value={peerId}
          presenceMap={presenceMap}
          onChange={onRecipientChange}
          compact
        />
      </div>
      <MessagesComposer
        value={draft}
        sending={sending}
        disabled={!peerId}
        pendingFiles={pendingFiles}
        fileInputRef={fileInputRef}
        onChange={onDraftChange}
        onSubmit={onSend}
        onPickFiles={onPickFiles}
        onFilesSelected={onFilesSelected}
        onRemoveFile={onRemoveFile}
      />
    </div>
  );
}
