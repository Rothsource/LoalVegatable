"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, Store, User, LogOut, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/distributors/orders", label: "Orders", icon: Package },
  { href: "/distributors/products", label: "Vegetable Stock", icon: Store },
  { href: "/distributors/profile", label: "My Profile", icon: User },
];

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [distributorName, setDistributorName] = useState<string>("Distributor");
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Sync profile & pending orders count for navigation badge
  useEffect(() => {
    let active = true;

    async function syncHeader() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data: profile } = await supabase
        .from("profile_distributors")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name && active) {
        setDistributorName(profile.full_name);
      }

      // Check pending orders count
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .is("distributor_id", null);

      if (count !== null && active) {
        setPendingCount(count);
      }
    }

    syncHeader();

    const channel = supabase
      .channel("distributor-layout-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        syncHeader();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/distributor-login");
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#182216] font-sans flex flex-col">
      {/* ── Desktop & Mobile Top Header ── */}
      <header className="sticky top-0 z-40 border-b border-[#dfe6d9] bg-[#fbf8f2]/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(46,111,64,0.04)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Tag */}
          <Link href="/distributors/orders" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0DB30D] text-white shadow-sm transition-transform group-hover:scale-105">
              <Truck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#0A490A]">
                  LocalVegetable
                </span>
                <span className="rounded-full bg-[#e8f5e5] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#2E6F40] border border-[#cbe4c6]">
                  Distributor
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#647060]">
                Driver & Warehouse Operations
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Distributor navigation">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              const hasBadge = item.href.includes("orders") && pendingCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-extrabold transition-all duration-200 ${
                    active
                      ? "bg-[#2E6F40] text-white shadow-sm"
                      : "text-[#52604f] hover:bg-[#eef3ea] hover:text-[#182216]"
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                  {hasBadge && (
                    <span
                      className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                        active
                          ? "bg-[#E08D3C] text-white"
                          : "bg-[#0DB30D] text-white animate-pulse"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2">
            <NotificationBell role="distributor" />

            <div className="hidden items-center gap-2 rounded-xl border border-[#dfe6d9] bg-white px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#0DB30D] shadow-[0_0_8px_rgba(13,179,13,0.8)]" />
              <span className="max-w-28 truncate text-xs font-bold text-[#182216]">
                {distributorName}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out of distributor account"
              className="flex items-center gap-1.5 rounded-xl border border-[#eedbd7] bg-[#fffbfb] px-3 py-2 text-xs font-extrabold text-[#c53929] transition-all hover:bg-[#fdeeed] hover:border-[#e8b5ad] active:scale-95"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="mx-auto max-w-5xl flex-1 px-4 py-6 sm:py-8 w-full pb-24 md:pb-12">
        {children}
      </main>

      {/* ── Mobile Fixed Bottom Navigation Bar (Large 1-Thumb Friendly) ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#dfe6d9] bg-white/95 px-2 pt-1.5 pb-2 shadow-[0_-8px_30px_rgba(46,111,64,0.08)] backdrop-blur-xl md:hidden"
        aria-label="Mobile distributor navigation"
      >
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          const hasBadge = item.href.includes("orders") && pendingCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                active ? "text-[#0A490A]" : "text-[#647060]"
              }`}
            >
              <div
                className={`relative grid h-8 w-12 place-items-center rounded-xl transition-all duration-300 ${
                  active ? "bg-[#0DB30D]/15 text-[#0A490A]" : "text-[#647060]"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                {hasBadge && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#E08D3C] px-1 text-[9px] font-black text-white">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className={active ? "font-extrabold text-[#0A490A]" : "font-medium"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}