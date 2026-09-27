"use client";

import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
import type { DeliveryNotification } from "@/lib/types";

type NotificationPanelProps = {
  notifications: DeliveryNotification[];
  onClose: () => void;
  onMarkRead: () => void;
};

export function NotificationPanel({ notifications, onClose, onMarkRead }: NotificationPanelProps) {
  return (
    <>
      <button className="fixed inset-0 z-40 cursor-default bg-[#152012]/20 backdrop-blur-[1px] md:hidden" onClick={onClose} aria-label="Close notifications" />
      <section className="enter-up fixed inset-x-3 top-[72px] z-50 max-h-[calc(100vh-100px)] overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-[370px]" aria-label="Notifications">
        <header className="flex items-center justify-between border-b border-[#edf0ea] px-5 py-4">
          <div>
            <h2 className="font-black tracking-[-0.02em]">Notifications</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Delivery updates and requests</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl text-[var(--muted)] hover:bg-[#f1f4ee]" aria-label="Close notifications"><X size={19} /></button>
        </header>
        {notifications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-soft)] text-[var(--leaf)]"><CheckCheck size={22} /></span>
            <p className="mt-4 font-extrabold">All clear</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">New delivery notifications will appear here.</p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto p-2">
            {notifications.map((notification) => (
              <Link key={notification.id} href={`/request/${notification.deliveryId}`} onClick={onClose} className={`flex gap-3 rounded-2xl p-3.5 transition hover:bg-[#f4f8f1] ${notification.read ? "" : "bg-[#eef5e9]"}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${notification.read ? "bg-[#edf0ea] text-[#73806f]" : "bg-[var(--leaf)] text-white"}`}><Bell size={17} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <strong className="text-sm font-extrabold">{notification.title}</strong>
                    {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--leaf)]" aria-label="Unread" />}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{notification.message}</span>
                  <span className="mt-1.5 block text-[11px] font-bold text-[#8a9686]">{formatRelativeTime(notification.createdAt)}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
        {notifications.some((item) => !item.read) && (
          <footer className="border-t border-[#edf0ea] p-3">
            <button onClick={onMarkRead} className="min-h-11 w-full rounded-xl text-sm font-extrabold text-[var(--leaf)] transition hover:bg-[#eef5e9]">Mark all as read</button>
          </footer>
        )}
      </section>
    </>
  );
}
