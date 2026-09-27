// merchant/app/distributors/orders/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  Package, Truck, Phone, MapPin, CheckCircle2, Clock, 
  ArrowRight, AlertCircle, RefreshCw, ChevronRight, Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DistributorSpinner, OrderCardSkeleton } from "@/components/distributors/DistributorUI";

type PendingOrder = {
  id: string;
  total_amount: number;
  created_at: string;
  address: { street: string | null; province: string | null; phone: string | null } | null;
  items: { product_id: string; quantity: number; unit_price: number }[];
};

type ActiveOrder = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  address: { street: string | null; province: string | null; phone: string | null } | null;
};

const STATUS_FLOW = ["accepted", "preparing", "packaged", "out_for_delivery"] as const;

const STATUS_META: Record<string, { label: string; nextLabel: string; bg: string; text: string; step: number }> = {
  accepted: {
    label: "Accepted — Waiting Prep",
    nextLabel: "Start Preparing Produce",
    bg: "bg-[#e8f5e5] border-[#c4e3be]",
    text: "text-[#1b5e20]",
    step: 1,
  },
  preparing: {
    label: "In Preparation",
    nextLabel: "Mark as Packaged & Ready",
    bg: "bg-[#fef9c3] border-[#fef08a]",
    text: "text-[#854d0e]",
    step: 2,
  },
  packaged: {
    label: "Packaged & Ready",
    nextLabel: "Dispatch: Out For Delivery",
    bg: "bg-[#e0f2fe] border-[#bae6fd]",
    text: "text-[#0369a1]",
    step: 3,
  },
  out_for_delivery: {
    label: "Out For Delivery",
    nextLabel: "With Rider",
    bg: "bg-[#ecfdf5] border-[#a7f3d0]",
    text: "text-[#065f46]",
    step: 4,
  },
};

function nextStatus(current: string): string | null {
  const i = STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number]);
  return i === -1 || i === STATUS_FLOW.length - 1 ? null : STATUS_FLOW[i + 1];
}

const DENY_KEY = "distributor-denied-orders";
function getDenied(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DENY_KEY) || "[]");
  } catch {
    return [];
  }
}
function addDenied(id: string) {
  const cur = getDenied();
  localStorage.setItem(DENY_KEY, JSON.stringify([...cur, id]));
}

export default function DistributorOrdersPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [distributorId, setDistributorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again to access orders.");
      setLoading(false);
      return;
    }

    setDistributorId(user.id);

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select(`
        id, total_amount, created_at,
        address:address_id ( street, province, phone ),
        items:order_items ( product_id, quantity, unit_price )
      `)
      .eq("status", "pending")
      .is("distributor_id", null)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const denied = getDenied();
    const pendingFiltered = ((data as any[]) || []).filter((o) => !denied.includes(o.id));
    setOrders(pendingFiltered);

    const { data: active, error: activeError } = await supabase
      .from("orders")
      .select(`id, status, total_amount, created_at, address:address_id ( street, province, phone )`)
      .eq("distributor_id", user.id)
      .in("status", STATUS_FLOW as unknown as string[])
      .order("accepted_at", { ascending: true });

    if (!activeError) {
      setActiveOrders((active as any[]) || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("distributor-pending-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const accept = async (orderId: string) => {
    if (!distributorId) {
      setError("Your distributor account is not linked. Please sign in again.");
      return;
    }
    setAcceptingId(orderId);
    setError("");

    const { data, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "accepted",
        distributor_id: distributorId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending")
      .is("distributor_id", null)
      .select("id");

    setAcceptingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("Another distributor just claimed this order.");
      load();
      return;
    }

    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setActiveTab("active");
    load();
  };

  const deny = async (orderId: string) => {
    addDenied(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    const { error: cancelError } = await supabase.rpc("cancel_pending_order", { p_order_id: orderId });
    if (cancelError) {
      alert("Error passing order: " + cancelError.message);
    }
  };

  const advance = async (orderId: string, current: string) => {
    const next = nextStatus(current);
    if (!next) return;
    setAdvancingId(orderId);
    setError("");

    const { error: advanceError } = await supabase.rpc("advance_order_status", {
      order_id: orderId,
      new_status: next,
    });

    setAdvancingId(null);
    if (advanceError) {
      setError(advanceError.message);
      return;
    }

    if (next === "out_for_delivery") {
      fetch(`${process.env.NEXT_PUBLIC_CUSTOMER_APP_URL}/api/notify-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
    }

    load();
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Tab Switcher ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#dfe6d9] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182216] tracking-tight">
            Order Management
          </h1>
          <p className="mt-1 text-sm font-medium text-[#52604f]">
            Accept new vegetable customer orders and update packing progress.
          </p>
        </div>

        <button
          onClick={() => load()}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 rounded-xl border border-[#dfe6d9] bg-white px-4 py-2 text-xs font-bold text-[#182216] shadow-sm hover:bg-[#f6faf3] active:scale-95 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#0DB30D]" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#eedbd7] bg-[#fff5f4] p-4 text-sm font-bold text-[#c53929]">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Big Segments: Easy For Non-Tech Guys To Switch ── */}
      <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-[#edf3ea] border border-[#d8e3d4]">
        <button
          onClick={() => setActiveTab("pending")}
          className={`relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-black transition-all ${
            activeTab === "pending"
              ? "bg-white text-[#182216] shadow-sm"
              : "text-[#52604f] hover:text-[#182216]"
          }`}
        >
          <Clock size={18} className={activeTab === "pending" ? "text-[#E08D3C]" : ""} />
          <span>New Orders</span>
          {orders.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E08D3C] px-1.5 text-[11px] font-black text-white shadow-sm">
              {orders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("active")}
          className={`relative flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-black transition-all ${
            activeTab === "active"
              ? "bg-white text-[#182216] shadow-sm"
              : "text-[#52604f] hover:text-[#182216]"
          }`}
        >
          <Truck size={18} className={activeTab === "active" ? "text-[#0DB30D]" : ""} />
          <span>My Deliveries</span>
          {activeOrders.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0DB30D] px-1.5 text-[11px] font-black text-white shadow-sm">
              {activeOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        <div className="py-6 space-y-4">
          <div className="flex justify-center">
            <DistributorSpinner size={42} label="Checking for new orders…" />
          </div>
          <OrderCardSkeleton />
        </div>
      ) : activeTab === "pending" ? (
        /* ── Pending Orders Tab ── */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-[#dfe6d9] bg-white/70 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf4e7] text-[#0DB30D] mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-[#182216]">All Caught Up!</h3>
              <p className="mt-1 text-sm text-[#52604f] max-w-md mx-auto">
                There are no new pending orders waiting right now. When a customer orders fresh produce, it will pop up here instantly.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const itemCount = order.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
              const phone = order.address?.phone;

              return (
                <div
                  key={order.id}
                  className="rounded-[26px] border-2 border-[#e3ebe0] bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                >
                  {/* Card Header: Order #, Amount, Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f4ee] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black text-[#182216]">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="rounded-full bg-[#fef3c7] border border-[#fde68a] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#92400e]">
                          ⚡ New Request
                        </span>
                      </div>
                      <p className="text-xs text-[#647060] mt-0.5">
                        Received {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-[#0A490A]">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                      <p className="text-[11px] font-bold text-[#647060]">
                        {itemCount} units total
                      </p>
                    </div>
                  </div>

                  {/* Address & Call Customer Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-[#fafbf9] border border-[#ecf1ea] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5e5] text-[#2E6F40] flex-shrink-0 mt-0.5">
                        <MapPin size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-[#2E6F40]">
                          Delivery Destination
                        </p>
                        <p className="text-sm font-extrabold text-[#182216] truncate">
                          {order.address?.province ?? "Phnom Penh"}
                        </p>
                        <p className="text-xs text-[#52604f] mt-0.5 line-clamp-1">
                          {order.address?.street ?? "Street address on file"}
                        </p>
                      </div>
                    </div>

                    {phone ? (
                      <div className="flex sm:justify-end items-center">
                        <a
                          href={`tel:${phone}`}
                          className="flex items-center gap-2 rounded-xl bg-white border border-[#cbe4c6] px-4 py-2.5 text-xs font-black text-[#1b5e20] shadow-sm hover:bg-[#e8f5e5] active:scale-95 transition-all"
                        >
                          <Phone size={15} className="text-[#0DB30D]" />
                          <span>Call: {phone}</span>
                        </a>
                      </div>
                    ) : (
                      <div className="flex sm:justify-end items-center text-xs text-[#8c9b88] font-medium">
                        No phone provided
                      </div>
                    )}
                  </div>

                  {/* Items Chips */}
                  <div>
                    <p className="text-xs font-bold text-[#52604f] mb-2 uppercase tracking-wider">
                      Ordered Vegetables ({order.items.length} items):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-1.5 rounded-xl border border-[#e2e8dd] bg-[#fdfdfc] px-3 py-1.5 text-xs font-bold text-[#182216]"
                        >
                          <Package size={13} className="text-[#2E6F40]" />
                          <span>Qty: {it.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Giant Touch Buttons: Big Accept & Pass */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => deny(order.id)}
                      className="rounded-2xl border-2 border-[#eedbd7] bg-white py-3.5 px-5 text-sm font-extrabold text-[#c53929] hover:bg-[#fff5f4] active:scale-95 transition-all text-center"
                    >
                      Pass / Deny
                    </button>

                    <button
                      onClick={() => accept(order.id)}
                      disabled={acceptingId === order.id}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#0DB30D] hover:bg-[#0A490A] py-3.5 px-6 text-base font-black text-white shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {acceptingId === order.id ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Claiming Order…</span>
                        </>
                      ) : (
                        <>
                          <Check size={20} strokeWidth={3} />
                          <span>ACCEPT & CLAIM ORDER</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── Active Orders Tab ── */
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div className="rounded-[28px] border-2 border-dashed border-[#dfe6d9] bg-white/70 p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf4e7] text-[#0DB30D] mb-4">
                <Truck size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-[#182216]">No Active Orders In Progress</h3>
              <p className="mt-1 text-sm text-[#52604f] max-w-md mx-auto">
                You haven&apos;t accepted any orders right now. Switch to &quot;New Orders&quot; to claim one!
              </p>
              <button
                onClick={() => setActiveTab("pending")}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#2E6F40] px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-[#1b5e20] active:scale-95 transition-all"
              >
                <span>View New Orders</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            activeOrders.map((order) => {
              const meta = STATUS_META[order.status] ?? {
                label: order.status,
                nextLabel: "Update Status",
                bg: "bg-gray-100 border-gray-200",
                text: "text-gray-800",
                step: 1,
              };
              const next = nextStatus(order.status);
              const phone = order.address?.phone;

              return (
                <div
                  key={order.id}
                  className="rounded-[26px] border-2 border-[#dbe6d7] bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f4ee] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black text-[#182216]">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${meta.bg} ${meta.text}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#647060] mt-0.5">
                        Destination: {order.address?.province ?? "Local"}, {order.address?.street ?? "Street"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-[#0A490A]">
                        ${Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Tracker Steps */}
                  <div className="py-2">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: "1. Accepted", active: meta.step >= 1 },
                        { label: "2. Preparing", active: meta.step >= 2 },
                        { label: "3. Packaged", active: meta.step >= 3 },
                        { label: "4. Out for Delivery", active: meta.step >= 4 },
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1.5">
                          <div
                            className={`h-2.5 w-full rounded-full transition-all duration-300 ${
                              step.active ? "bg-[#0DB30D]" : "bg-[#e2e8dd]"
                            }`}
                          />
                          <span
                            className={`text-[10px] sm:text-xs font-bold ${
                              step.active ? "text-[#0A490A]" : "text-[#94a390]"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phone call pill */}
                  {phone && (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fafbf9] border border-[#ecf1ea]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#52604f]">
                        <MapPin size={15} className="text-[#2E6F40]" />
                        <span>Customer Contact</span>
                      </div>
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-2 rounded-xl bg-[#e8f5e5] px-3.5 py-1.5 text-xs font-extrabold text-[#1b5e20] hover:bg-[#d8eed4]"
                      >
                        <Phone size={13} className="text-[#0DB30D]" />
                        <span>Call Customer</span>
                      </a>
                    </div>
                  )}

                  {/* Big Step Forward Button */}
                  {next ? (
                    <button
                      onClick={() => advance(order.id, order.status)}
                      disabled={advancingId === order.id}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#2E6F40] hover:bg-[#1b5e20] py-4 px-6 text-base font-black text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                      {advancingId === order.id ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Updating status…</span>
                        </>
                      ) : (
                        <>
                          <span>Mark as: {STATUS_META[next]?.nextLabel ?? next}</span>
                          <ChevronRight size={18} />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#e8f5e5] border border-[#c4e3be] p-3 text-sm font-extrabold text-[#1b5e20]">
                      <CheckCircle2 size={18} />
                      <span>Order dispatched with delivery rider</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}