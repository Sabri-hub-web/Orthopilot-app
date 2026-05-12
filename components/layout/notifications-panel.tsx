"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export function NotificationsPanel({ open, onClose, onUnreadCountChange }: NotificationsPanelProps) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const data = (await response.json()) as NotificationsListResponse;
      if (!response.ok) throw new Error(data && "message" in data ? String((data as { message?: string }).message) : "");
      setItems(data.items);
      syncUnread(data.unreadCount);
    } catch {
      setError("Impossible de charger les notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [syncUnread]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, loadNotifications]);

  const unreadIds = useMemo(() => new Set(items.filter((item) => !item.isRead).map((item) => item.id)), [items]);

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, { method: "PATCH" });
      if (!response.ok) throw new Error("failed");
      setItems((prev) => prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)));
      if (unreadIds.has(notificationId)) {
        syncUnread(Math.max(0, unreadCount - 1));
      }
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
    } catch {
      setError("Impossible de tout marquer comme lu.");
    }
  }

  return (
    <aside
      className={`fixed right-0 top-0 z-20 h-screen w-80 border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!open}
    >
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
            aria-label="Fermer les notifications"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Traiter rapidement les alertes internes</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-600">{unreadCount} non lue(s)</span>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {isLoading ? <p className="text-sm text-slate-500">Chargement...</p> : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {!isLoading && !items.length ? (
          <p className="text-sm text-slate-500">Aucune notification pour le moment.</p>
        ) : null}
        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border p-3 ${item.isRead ? "border-slate-200 bg-slate-50" : "border-amber-200 bg-amber-50"}`}
          >
            <p className="text-sm font-medium text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-700">{item.message}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">{relativeTimeLabel(item.createdAt)}</p>
              {!item.isRead ? (
                <button
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 transition hover:bg-white"
                >
                  Marquer comme lu
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
