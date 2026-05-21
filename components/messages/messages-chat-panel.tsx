"use client";

import { ArrowLeft, Info, ListTodo } from "lucide-react";
import {
  formatMessageTime,
  initialsFromName,
  presenceStatusLabel,
} from "@/lib/messages-ui";
import { MessagesComposer } from "@/components/messages/messages-composer";
import { MessagesEmptyState } from "@/components/messages/messages-empty-state";
import type { FormEvent, RefObject } from "react";
import type { InternalMessageLine, PresenceTeamMember } from "@/types/domain";

interface MessagesChatPanelProps {
  peerId: string | null;
  peerName: string | null;
  messages: InternalMessageLine[];
  loading: boolean;
  sending: boolean;
  draft: string;
  presence?: PresenceTeamMember;
  showMobileBack?: boolean;
  onBack?: () => void;
  onDraftChange: (v: string) => void;
  onSend: (e: FormEvent) => void;
  onNewMessage: () => void;
  messagesEndRef?: RefObject<HTMLDivElement | null>;
}

export function MessagesChatPanel({
  peerId,
  peerName,
  messages,
  loading,
  sending,
  draft,
  presence,
  showMobileBack,
  onBack,
  onDraftChange,
  onSend,
  onNewMessage,
  messagesEndRef,
}: MessagesChatPanelProps) {
  if (!peerId) {
    return <MessagesEmptyState onNewMessage={onNewMessage} />;
  }

  const statusLabel = presenceStatusLabel(presence);
  const online = presence?.isOnline && presence.presenceStatus === "DISPONIBLE";

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-3 py-2.5">
        {showMobileBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Retour aux conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
        <span className="relative shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 text-[10px] font-bold text-white">
            {initialsFromName(peerName ?? "")}
          </span>
          {online ? (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{peerName}</p>
          {presence?.roleLabel ? (
            <p className="truncate text-[11px] text-slate-500">{presence.roleLabel}</p>
          ) : null}
          <p className={`text-[11px] ${online ? "text-emerald-600" : "text-slate-400"}`}>{statusLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled
            title="Informations — bientôt disponible"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-60"
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled
            title="Tâche rapide — bientôt disponible"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 opacity-60"
          >
            <ListTodo className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f8fb] px-4 py-4">
        {loading ? (
          <p className="text-center text-sm text-slate-500">Chargement des messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">Aucun message. Envoyez le premier.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) =>
              m.isMine ? (
                <li key={m.id} className="flex justify-end">
                  <div className="max-w-[60%] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-indigo-600 px-3.5 py-2 text-white shadow-sm">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                    <p className="mt-1 text-right text-[10px] text-white/70">
                      {formatMessageTime(m.createdAt)}
                    </p>
                  </div>
                </li>
              ) : (
                <li key={m.id} className="flex items-end gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
                    {initialsFromName(peerName ?? "")}
                  </span>
                  <div className="max-w-[60%] rounded-2xl rounded-bl-md border border-slate-200/80 bg-white px-3.5 py-2 shadow-sm">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{m.body}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{formatMessageTime(m.createdAt)}</p>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
        <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
      </div>

      <MessagesComposer value={draft} sending={sending} onChange={onDraftChange} onSubmit={onSend} />
    </section>
  );
}
