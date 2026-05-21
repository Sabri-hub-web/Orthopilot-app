"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PendingMessageFile } from "@/components/messages/messages-composer";
import { MessagesChatPanel } from "@/components/messages/messages-chat-panel";
import {
  MessagesConversationList,
  type ConversationTab,
} from "@/components/messages/messages-conversation-list";
import { MessagesDetailsPanel } from "@/components/messages/messages-details-panel";
import { MessagesNewMessageModal } from "@/components/messages/messages-new-message-modal";
import { MessagesToolbar } from "@/components/messages/messages-toolbar";
import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  MESSAGE_ATTACHMENT_MAX_FILES,
  presenceByUserId,
} from "@/lib/messages-ui";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import type {
  ConversationsResponse,
  MessagesThreadResponse,
  PresenceTeamResponse,
  RecipientOption,
} from "@/types/domain";

interface MessagesViewProps {
  currentUserName: string;
}

export function MessagesView({ currentUserName }: MessagesViewProps) {
  const [conversations, setConversations] = useState<ConversationsResponse["conversations"]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [presenceMembers, setPresenceMembers] = useState<PresenceTeamResponse["members"]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessagesThreadResponse | null>(null);
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [listTab, setListTab] = useState<ConversationTab>("all");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingMessageFile[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presenceMap = useMemo(() => presenceByUserId(presenceMembers), [presenceMembers]);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/messages/conversations", { cache: "no-store" });
    if (!res.ok) throw new Error("Conversations");
    const data: ConversationsResponse = await res.json();
    setConversations(data.conversations);
    return data.conversations;
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/messages?with=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Thread");
    const data: MessagesThreadResponse = await res.json();
    setThread({
      ...data,
      messages: data.messages.map((m) => ({
        ...m,
        attachments: m.attachments ?? [],
      })),
    });
    await fetch("/api/messages/read-peer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ peerId: id }),
    });
    await loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingList(true);
        const [cRes, rRes, pRes] = await Promise.all([
          fetch("/api/messages/conversations", { cache: "no-store" }),
          fetch("/api/messages/recipients", { cache: "no-store" }),
          fetch("/api/presence", { cache: "no-store" }),
        ]);
        if (!cRes.ok || !rRes.ok) throw new Error("load");
        const cData: ConversationsResponse = await cRes.json();
        const rData: { items: RecipientOption[] } = await rRes.json();
        if (!cancelled) {
          setConversations(cData.conversations);
          setRecipients(rData.items);
          if (pRes.ok) {
            const pData: PresenceTeamResponse = await pRes.json();
            setPresenceMembers(pData.members);
          }
          if (cData.conversations.length > 0 && !peerId) {
            setPeerId(cData.conversations[0]!.peerId);
          }
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les messages.");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init only
  }, []);

  const threadToShow = peerId ? thread : null;

  useEffect(() => {
    if (!peerId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingThread(true);
        setError(null);
        await loadThread(peerId);
      } catch {
        if (!cancelled) setError("Impossible de charger la conversation.");
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [peerId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadToShow?.messages.length]);

  function clearPendingFiles() {
    setPendingFiles((prev) => {
      for (const p of prev) {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      }
      return [];
    });
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    const next: PendingMessageFile[] = [];
    const room = MESSAGE_ATTACHMENT_MAX_FILES - pendingFiles.length;

    for (let i = 0; i < files.length && next.length < room; i++) {
      const file = files[i]!;
      if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
        setError(`« ${file.name} » dépasse 5 Mo.`);
        continue;
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      next.push({ id: `${file.name}-${file.size}-${Date.now()}-${i}`, file, previewUrl });
    }

    if (files.length > room) {
      setError(`Maximum ${MESSAGE_ATTACHMENT_MAX_FILES} fichiers par message.`);
    }

    if (next.length) setPendingFiles((prev) => [...prev, ...next]);
  }

  function handleRemoveFile(id: string) {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!peerId) return;
    const trimmed = body.trim();
    if (!trimmed && pendingFiles.length === 0) return;

    setSending(true);
    setError(null);
    try {
      let res: Response;

      if (pendingFiles.length > 0) {
        const formData = new FormData();
        formData.append("recipientId", peerId);
        formData.append("body", trimmed);
        for (const pf of pendingFiles) {
          formData.append("files", pf.file);
        }
        res = await fetch("/api/messages", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: peerId, body: trimmed }),
        });
      }

      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      setBody("");
      clearPendingFiles();
      await loadThread(peerId);
      await loadConversations();
    } finally {
      setSending(false);
    }
  }

  function pickPeer(id: string) {
    setPeerId(id);
    setThread(null);
    clearPendingFiles();
  }

  const activePresence = peerId ? presenceMap.get(peerId) : undefined;
  const peerName =
    threadToShow?.peer.fullName ?? recipients.find((r) => r.id === peerId)?.fullName ?? null;

  const messages = threadToShow?.messages ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-2 md:p-3">
      {error ? (
        <div className="mb-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_20px_rgba(15,23,42,0.06)]">
        <MessagesToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewMessage={() => setNewMessageOpen(true)}
        />

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(280px,300px)_minmax(0,1fr)] xl:grid-cols-[minmax(280px,300px)_minmax(0,1fr)_minmax(280px,300px)]">
          <div
            className={`min-h-0 border-slate-100 lg:border-r ${
              peerId ? "hidden lg:flex lg:flex-col" : "flex min-h-0 flex-col"
            }`}
          >
            <MessagesConversationList
              conversations={conversations}
              loading={loadingList}
              activePeerId={peerId}
              tab={listTab}
              searchQuery={searchQuery}
              presenceMap={presenceMap}
              onTabChange={setListTab}
              onSelect={pickPeer}
            />
          </div>

          <div
            className={`min-h-0 min-w-0 ${
              !peerId ? "hidden lg:flex lg:flex-col" : "flex min-h-0 flex-col"
            } ${peerId ? "lg:border-r lg:border-slate-100 xl:border-r" : ""}`}
          >
            <MessagesChatPanel
              peerId={peerId}
              peerName={peerName}
              currentUserName={currentUserName}
              messages={messages}
              loading={loadingThread}
              sending={sending}
              draft={body}
              pendingFiles={pendingFiles}
              fileInputRef={fileInputRef}
              presence={activePresence}
              showMobileBack={!!peerId}
              onBack={() => {
                setPeerId(null);
                clearPendingFiles();
              }}
              onDraftChange={setBody}
              onSend={handleSend}
              onPickFiles={() => fileInputRef.current?.click()}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              messagesEndRef={bottomRef}
            />
          </div>

          <MessagesDetailsPanel
            peerId={peerId}
            peerName={peerName}
            messages={messages}
            presence={activePresence}
          />
        </div>
      </div>

      <MessagesNewMessageModal
        open={newMessageOpen}
        recipients={recipients}
        onClose={() => setNewMessageOpen(false)}
        onSelect={pickPeer}
      />
    </div>
  );
}
