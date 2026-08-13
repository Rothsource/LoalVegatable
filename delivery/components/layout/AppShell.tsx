"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Bike, History, Home, UserRound } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { PageSkeleton } from "@/components/ui/StateViews";
import { NotificationPanel } from "@/components/layout/NotificationPanel";
import { useDelivery } from "@/context/DeliveryProvider";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/current", label: "Current", icon: Bike },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, notifications, markNotificationsRead } = useDelivery();
  const [notificationPath, setNotificationPath] = useState<string | null>(null);
  const notificationOpen = notificationPath === pathname;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><PageSkeleton /></div>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#dfe6d9]/80 bg-[#f7f8f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-1 rounded-2xl border border-[#e1e7dd] bg-white/80 p-1 md:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition ${active ? "bg-[var(--leaf)] text-white shadow-sm" : "text-[#667262] hover:bg-[#eff4ec] hover:text-[var(--ink)]"}`}>
                  <Icon size={16} aria-hidden="true" />{item.label}
                </Link>
              );
            })}
          </nav>
          <div className="relative flex items-center gap-2">
            <button type="button" onClick={() => setNotificationPath(notificationOpen ? null : pathname)} className="relative grid h-11 w-11 place-items-center rounded-[14px] border border-[var(--line)] bg-white text-[#52604f] transition hover:border-[#bdccb5] hover:bg-[#f5f9f2]" aria-label={`${unreadCount} unread notifications`} aria-expanded={notificationOpen}>
              <Bell size={19} aria-hidden="true" />
              {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#f7f8f2] bg-[#d7624f] px-1 text-[9px] font-black text-white">{unreadCount}</span>}
            </button>
            <Link href="/profile" className="hidden h-11 items-center gap-2 rounded-[14px] border border-[var(--line)] bg-white px-2 pr-3 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-[var(--leaf)] text-[10px] font-black text-white">SC</span>
              <span className="max-w-28 truncate text-xs font-extrabold">{user.name}</span>
            </Link>
            {notificationOpen && <NotificationPanel notifications={notifications} onClose={() => setNotificationPath(null)} onMarkRead={() => void markNotificationsRead()} />}
          </div>
        </div>
      </header>

      <main className="safe-bottom mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:pb-10">{children}</main>

      <nav className="bottom-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#dbe3d7] bg-white/95 px-2 pt-1.5 shadow-[0_-8px_30px_rgba(32,54,29,0.08)] backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold transition ${active ? "text-[var(--leaf)]" : "text-[#7c8878]"}`}>
              {active && <span className="absolute top-0 h-1 w-7 rounded-full bg-[var(--leaf)]" />}
              <Icon size={20} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
