"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessagesChatPanel } from "@/components/messages/messages-chat-panel";
import { MessagesConversationList } from "@/components/messages/messages-conversation-list";
import { MessagesNewMessageModal } from "@/components/messages/messages-new-message-modal";
import { presenceByUserId } from "@/lib/messages-ui";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import type {
  ConversationsResponse,
  MessagesThreadResponse,
  PresenceTeamResponse,
  RecipientOption,
} from "@/types/domain";

export function MessagesView() {
  const [conversations, setConversations] = useState<ConversationsResponse["conversations"]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [presenceMembers, setPresenceMembers] = useState<PresenceTeamResponse["members"]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessagesThreadResponse | null>(null);
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const presenceMap = useMemo(() => presenceByUserId(presenceMembers), [presenceMembers]);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/messages/conversations", { cache: "no-store" });
    if (!res.ok) throw new Error("Conversations");
    const data: ConversationsResponse = await res.json();
    setConversations(data.conversations);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/messages?with=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Thread");
    const data: MessagesThreadResponse = await res.json();
    setThread(data);
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!peerId || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: peerId, body: body.trim() }),
      });
      if (!res.ok) {
        setError(await errorMessageFromResponse(res));
        return;
      }
      setBody("");
      await loadThread(peerId);
      await loadConversations();
    } finally {
      setSending(false);
    }
  }

  function pickPeer(id: string) {
    setPeerId(id);
    setThread(null);
  }

  const activePresence = peerId ? presenceMap.get(peerId) : undefined;
  const peerName = threadToShow?.peer.fullName ?? recipients.find((r) => r.id === peerId)?.fullName ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f8fb]">
      {error ? (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 md:grid-cols-[35%_65%] md:p-4 lg:grid-cols-[minmax(280px,30%)_minmax(0,70%)]">
        <div
          className={`min-h-0 ${peerId ? "hidden md:flex md:flex-col" : "flex min-h-0 flex-col"}`}
        >
          <MessagesConversationList
            conversations={conversations}
            loading={loadingList}
            activePeerId={peerId}
            searchQuery={searchQuery}
            presenceMap={presenceMap}
            onSearchChange={setSearchQuery}
            onSelect={pickPeer}
            onNewMessage={() => setNewMessageOpen(true)}
          />
        </div>

        <div
          className={`min-h-0 ${!peerId ? "hidden md:flex md:flex-col" : "flex min-h-0 flex-col"}`}
        >
          <MessagesChatPanel
            peerId={peerId}
            peerName={peerName}
            messages={threadToShow?.messages ?? []}
            loading={loadingThread}
            sending={sending}
            draft={body}
            presence={activePresence}
            showMobileBack={!!peerId}
            onBack={() => setPeerId(null)}
            onDraftChange={setBody}
            onSend={handleSend}
            onNewMessage={() => setNewMessageOpen(true)}
            messagesEndRef={bottomRef}
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
