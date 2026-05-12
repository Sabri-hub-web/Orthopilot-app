"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import type {
  ConversationsResponse,
  MessagesThreadResponse,
  RecipientOption,
} from "@/types/domain";

export function MessagesView() {
  const [conversations, setConversations] = useState<ConversationsResponse["conversations"]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [thread, setThread] = useState<MessagesThreadResponse | null>(null);
  const [body, setBody] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        const [cRes, rRes] = await Promise.all([
          fetch("/api/messages/conversations", { cache: "no-store" }),
          fetch("/api/messages/recipients", { cache: "no-store" }),
        ]);
        if (!cRes.ok || !rRes.ok) throw new Error("load");
        const cData: ConversationsResponse = await cRes.json();
        const rData: { items: RecipientOption[] } = await rRes.json();
        if (!cancelled) {
          setConversations(cData.conversations);
          setRecipients(rData.items);
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

  useEffect(() => {
    if (!peerId) {
      setThread(null);
      return;
    }
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
  }, [thread?.messages.length]);

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
  }

  return (
    <div className="flex min-h-[420px] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:w-72">
        <h3 className="text-sm font-semibold text-slate-900">Conversations</h3>
        <label className="mt-2 block text-xs text-slate-500">Ecrire a</label>
        <select
          value={peerId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v) pickPeer(v);
            else setPeerId(null);
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value="">— Choisir un collegue —</option>
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.fullName}
            </option>
          ))}
        </select>
        <div className="mt-4 max-h-64 space-y-1 overflow-y-auto">
          {loadingList ? (
            <p className="text-xs text-slate-500">Chargement...</p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune conversation encore.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.peerId}
                type="button"
                onClick={() => pickPeer(c.peerId)}
                className={`flex w-full flex-col rounded-lg border px-2 py-2 text-left text-sm transition ${
                  peerId === c.peerId
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <span className="font-medium text-slate-900">{c.peerName}</span>
                <span className="truncate text-xs text-slate-500">{c.lastPreview}</span>
                {c.unreadCount > 0 ? (
                  <span className="mt-0.5 inline-flex w-fit rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {c.unreadCount} non lu
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex min-h-[360px] flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!peerId ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
            Selectionnez un collegue pour afficher la conversation.
          </div>
        ) : loadingThread ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
            Chargement...
          </div>
        ) : thread ? (
          <>
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-base font-semibold text-slate-900">{thread.peer.fullName}</h3>
              <p className="text-xs text-slate-500">Messages internes — visibles uniquement par vous et ce contact.</p>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {thread.messages.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun message. Envoyez le premier ci-dessous.</p>
              ) : (
                thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.isMine
                          ? "bg-slate-900 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          m.isMine ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="border-t border-slate-200 p-3">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Votre message..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !body.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {sending ? "..." : "Envoyer"}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </section>

      {error ? (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 lg:order-last">
          {error}
        </div>
      ) : null}
    </div>
  );
}
