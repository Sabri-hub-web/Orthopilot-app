"use client";

import Link from "next/link";
import { CheckCheck, ListTodo, MessageSquare, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppNotification, NotificationsListResponse } from "@/types/domain";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

function relativeTimeLabel(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

function hrefForNotification(item: AppNotification): string {
  if (item.type === "INTERNAL_MESSAGE" || item.relatedEntityType === "InternalMessage") {
    return "/messages";
  }
  if (item.type === "TASK_ASSIGNED" || item.relatedEntityType === "Task") {
    return item.relatedEntityId ? `/tasks/${item.relatedEntityId}` : "/tasks";
  }
  return "/";
}

export function NotificationsPanel({ open, onClose, onUnreadCountChange }: NotificationsPanelProps) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const syncUnread = useCallback(
    (count: number) => {
      setUnreadCount(count);
      onUnreadCountChange(count);
    },
    [onUnreadCountChange],
  );

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notifications?limit=20", { cache: "no-store" });
      const data = (await response.json()) as NotificationsListResponse & { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Erreur");
      setItems(data.items);
      syncUnread(data.unreadCount);
    } catch {
      setError("Impossible de charger les notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [syncUnread]);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();
  }, [open, loadNotifications]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      const bell = (target as HTMLElement).closest?.("[data-notifications-bell]");
      if (bell) return;
      onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, onClose]);

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(
        `/api/notifications/${encodeURIComponent(notificationId)}/read`,
        { method: "PATCH" },
      );
      if (!response.ok) throw new Error("failed");
      setItems((prev) => prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
      syncUnread(Math.max(0, unreadCount - 1));
    } catch {
      setError("Impossible de marquer cette notification.");
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (!response.ok) throw new Error("failed");
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      syncUnread(0);
      await loadNotifications();
    } catch {
      setError("Impossible de tout marquer comme lu.");
    }
  }

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <p className="text-[11px] text-slate-500">{unreadCount} non lue(s)</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout lu
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50"
              aria-label="Fermer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            href="/messages"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-2 py-1.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </Link>
          <Link
            href="/tasks"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ListTodo className="h-3.5 w-3.5" />
            Tâches
          </Link>
        </div>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto p-3">
        {isLoading ? <p className="px-1 py-4 text-center text-xs text-slate-500">Chargement…</p> : null}
        {error ? <p className="px-1 text-xs text-rose-600">{error}</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-slate-500">Aucune notification pour le moment.</p>
        ) : null}
        {items.map((item) => {
          const href = hrefForNotification(item);
          return (
            <article
              key={item.id}
              className={`rounded-xl border p-3 ${
                item.isRead ? "border-slate-200 bg-slate-50" : "border-amber-200 bg-amber-50/80"
              }`}
            >
              <Link href={href} onClick={onClose} className="block">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{item.message}</p>
              </Link>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500">{relativeTimeLabel(item.createdAt)}</p>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={href}
                    onClick={onClose}
                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ouvrir
                  </Link>
                  {!item.isRead && item.type === "INTERNAL_MESSAGE" ? (
                    <button
                      type="button"
                      onClick={() => void markAsRead(item.id)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
                    >
                      Lu
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
