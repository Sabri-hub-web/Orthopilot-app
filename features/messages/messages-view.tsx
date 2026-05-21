"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PendingMessageFile } from "@/components/messages/messages-composer";
import { MessagesChat } from "@/components/messages/messages-chat";
import { MessagesDetails } from "@/components/messages/messages-details";
import { MessagesLayout } from "@/components/messages/messages-layout";
import { MessagesSidebar, type MessagesListTab } from "@/components/messages/messages-sidebar";
import {
  MESSAGE_ATTACHMENT_MAX_BYTES,
  MESSAGE_ATTACHMENT_MAX_FILES,
  mergeMessageRecipients,
  presenceByUserId,
} from "@/lib/messages-ui";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import type {
  ConversationSummary,
  ConversationsResponse,
  InternalMessageLine,
  MessagesThreadResponse,
  PresenceTeamResponse,
  RecipientOption,
} from "@/types/domain";

interface MessagesViewProps {
  currentUserId: string;
  currentUserName: string;
}

export function MessagesView({ currentUserId, currentUserName }: MessagesViewProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [recipientsRaw, setRecipientsRaw] = useState<RecipientOption[]>([]);
  const [presenceMembers, setPresenceMembers] = useState<PresenceTeamResponse["members"]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessagesThreadResponse | null>(null);
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [listTab, setListTab] = useState<MessagesListTab>("all");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingMessageFile[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presenceMap = useMemo(() => presenceByUserId(presenceMembers), [presenceMembers]);

  const recipients = useMemo(
    () => mergeMessageRecipients(recipientsRaw, presenceMembers, currentUserId),
    [recipientsRaw, presenceMembers, currentUserId],
  );

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/messages/conversations", { cache: "no-store" });
    if (!res.ok) throw new Error("Conversations");
    const data: ConversationsResponse = await res.json();
    setConversations(data.conversations);
    return data.conversations;
  }, []);

  const loadRecipients = useCallback(async () => {
    const res = await fetch("/api/messages/recipients", { cache: "no-store" });
    if (!res.ok) throw new Error("Recipients");
    const data: { items: RecipientOption[] } = await res.json();
    setRecipientsRaw(data.items ?? []);
    return data.items ?? [];
  }, []);

  const loadThread = useCallback(
    async (id: string) => {
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
    },
    [loadConversations],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      setLoadingRecipients(true);
      setError(null);

      const results = await Promise.allSettled([
        fetch("/api/messages/conversations", { cache: "no-store" }),
        fetch("/api/messages/recipients", { cache: "no-store" }),
        fetch("/api/presence", { cache: "no-store" }),
      ]);

      if (cancelled) return;

      try {
        const [cRes, rRes, pRes] = results.map((r) =>
          r.status === "fulfilled" ? r.value : null,
        );

        if (cRes?.ok) {
          const cData: ConversationsResponse = await cRes.json();
          setConversations(cData.conversations);
        }

        if (rRes?.ok) {
          const rData: { items: RecipientOption[] } = await rRes.json();
          setRecipientsRaw(rData.items ?? []);
        } else if (rRes) {
          setError("Impossible de charger la liste des collègues.");
        }

        if (pRes?.ok) {
          const pData: PresenceTeamResponse = await pRes.json();
          setPresenceMembers(pData.members);
        }

        if (!cRes?.ok && !rRes?.ok) {
          setError("Impossible de charger les messages.");
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
          setLoadingRecipients(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (peerId || recipients.length === 0) return;
    setPeerId(recipients[0]!.id);
  }, [recipients, peerId]);

  useEffect(() => {
    if (!peerId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingThread(true);
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
  }, [thread?.messages.length]);

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
        setError(`« ${file.name} » dépasse 10 Mo.`);
        continue;
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      next.push({ id: `${file.name}-${Date.now()}-${i}`, file, previewUrl });
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

    const peerLabel =
      thread?.peer.fullName ?? recipients.find((r) => r.id === peerId)?.fullName ?? "Collègue";
    const tempId = `temp-${Date.now()}`;
    const optimistic: InternalMessageLine = {
      id: tempId,
      senderId: currentUserId,
      recipientId: peerId,
      body: trimmed || (pendingFiles.length > 0 ? "" : ""),
      readAt: null,
      createdAt: new Date().toISOString(),
      isMine: true,
      attachments: [],
    };

    setThread((prev) => ({
      peer: prev?.peer ?? { id: peerId, fullName: peerLabel },
      messages: [...(prev?.messages ?? []), optimistic],
    }));

    setSending(true);
    setError(null);
    try {
      const res =
        pendingFiles.length > 0
          ? await (() => {
              const fd = new FormData();
              fd.append("recipientId", peerId);
              fd.append("body", trimmed);
              for (const pf of pendingFiles) fd.append("files", pf.file);
              return fetch("/api/messages", { method: "POST", body: fd });
            })()
          : await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ recipientId: peerId, body: trimmed }),
            });

      if (!res.ok) {
        setThread((prev) =>
          prev
            ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) }
            : prev,
        );
        setError(await errorMessageFromResponse(res));
        return;
      }

      const data: { id: string; message?: InternalMessageLine } = await res.json();
      setBody("");
      clearPendingFiles();

      if (data.message) {
        setThread((prev) => {
          const peer = prev?.peer ?? { id: peerId, fullName: peerLabel };
          const rest = (prev?.messages ?? []).filter((m) => m.id !== tempId);
          return {
            peer,
            messages: [...rest, { ...data.message!, isMine: true, attachments: data.message!.attachments ?? [] }],
          };
        });
      } else {
        await loadThread(peerId);
      }

      await loadConversations();
    } catch {
      setThread((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev,
      );
      setError("Impossible d’envoyer le message.");
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
    thread?.peer.fullName ?? recipients.find((r) => r.id === peerId)?.fullName ?? null;
  const messages = thread?.messages ?? [];

  return (
    <MessagesLayout
      error={error}
      sidebar={
        <MessagesSidebar
          conversations={conversations}
          loading={loadingList}
          activePeerId={peerId}
          tab={listTab}
          searchQuery={searchQuery}
          presenceMap={presenceMap}
          recipients={recipients}
          recipientsLoading={loadingRecipients}
          onTabChange={setListTab}
          onSearchChange={setSearchQuery}
          onSelect={pickPeer}
          onRecipientChange={pickPeer}
        />
      }
      chat={
        <MessagesChat
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
          recipients={recipients}
          recipientsLoading={loadingRecipients}
          presenceMap={presenceMap}
          onRecipientChange={pickPeer}
          onDraftChange={setBody}
          onSend={handleSend}
          onPickFiles={() => fileInputRef.current?.click()}
          onFilesSelected={handleFilesSelected}
          onRemoveFile={handleRemoveFile}
          messagesEndRef={bottomRef}
        />
      }
      details={
        <MessagesDetails
          peerId={peerId}
          peerName={peerName}
          messages={messages}
          presence={activePresence}
        />
      }
    />
  );
}
