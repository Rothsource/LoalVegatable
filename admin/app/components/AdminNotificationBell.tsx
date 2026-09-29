"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Bell, Truck, ShoppingBag, CheckCircle2, ChevronRight, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [pendingDistributors, setPendingDistributors] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadAlerts = useCallback(async () => {
    try {
      // 1. Pending distributors waiting for admin approval
      const { count: distCount } = await supabase
        .from("profile_distributors")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      if (distCount !== null) setPendingDistributors(distCount);

      // 2. Pending orders
      const { count: ordCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      if (ordCount !== null) setPendingOrders(ordCount);
    } catch (err) {
      console.error("Admin alerts load error:", err);
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    const channel = supabase
      .channel("admin-realtime-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "profile_distributors" }, () => {
        loadAlerts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadAlerts();
      })
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [loadAlerts]);

  const totalCount = pendingDistributors + pendingOrders;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfe6d9] bg-white text-[#556353] transition-all hover:border-[var(--leaf)] hover:bg-[#f6f9f4] hover:text-[var(--foreground)] cursor-pointer shadow-2xs"
        aria-label="Admin notifications"
        aria-expanded={open}
      >
        <Bell size={18} className={totalCount > 0 ? "text-[#c53929]" : "text-[#556353]"} />
        {totalCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-[#c53929] px-1 text-[9px] font-black text-white shadow-xs">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#dfe6d9] bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[#edf0ea] pb-2.5 px-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--leaf-dark)]">
                Admin Alerts
              </p>
              <p className="text-[11px] font-medium text-[#7a8c76]">
                {totalCount > 0 ? `${totalCount} item${totalCount === 1 ? "" : "s"} requiring attention` : "All systems normal"}
              </p>
            </div>
            {totalCount > 0 && (
              <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-black text-red-600">
                {totalCount} new
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1.5">
            {pendingDistributors > 0 && (
              <Link
                href="/distributors"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 transition hover:bg-amber-100/70"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500 text-white shadow-2xs">
                    <Truck size={16} />
                  </span>
                  <div>
                    <div className="text-xs font-black text-[#78350f]">
                      {pendingDistributors} Distributor{pendingDistributors === 1 ? "" : "s"}
                    </div>
                    <div className="text-[10px] font-medium text-[#92400e]">
                      Pending approval by admin
                    </div>
                  </div>
                </div>
                <ChevronRight size={15} className="text-[#b45309]" />
              </Link>
            )}

            {pendingOrders > 0 && (
              <Link
                href="/orders"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 transition hover:bg-emerald-100/70"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--leaf)] text-white shadow-2xs">
                    <ShoppingBag size={16} />
                  </span>
                  <div>
                    <div className="text-xs font-black text-[var(--leaf-dark)]">
                      {pendingOrders} Order{pendingOrders === 1 ? "" : "s"}
                    </div>
                    <div className="text-[10px] font-medium text-[#446538]">
                      Awaiting fulfillment
                    </div>
                  </div>
                </div>
                <ChevronRight size={15} className="text-[var(--leaf)]" />
              </Link>
            )}

            {totalCount === 0 && (
              <div className="py-6 text-center">
                <CheckCircle2 size={28} className="mx-auto text-[var(--leaf)] opacity-60" />
                <p className="mt-2 text-xs font-bold text-[#556353]">No pending alerts</p>
                <p className="text-[11px] text-[#8a9987]">Ecosystem operations are up to date</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
