"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deliveryActionLabel, nextDeliveryStatus, normalizeDeliveryStatus } from "@/lib/delivery";
import { formatKHR } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import type { DeliveryOrder, DeliveryStatus } from "@/types/delivery";

type OrderRow = {
  id: unknown;
  customer_name: unknown;
  customer_phone: unknown;
  delivery_address: unknown;
  total: unknown;
  status: unknown;
  created_at: unknown;
};

function text(value: unknown) { return typeof value === "string" ? value : ""; }

function mapOrder(row: OrderRow): DeliveryOrder {
  return {
    id: text(row.id),
    customerName: text(row.customer_name) || "Customer",
    phone: text(row.customer_phone),
    address: text(row.delivery_address),
    total: Number(row.total) || 0,
    status: normalizeDeliveryStatus(row.status),
    createdAt: text(row.created_at),
  };
}

function badge(status: DeliveryStatus) {
  if (status === "Delivered") return "bg-green-50 text-green-700";
  if (status === "Pending") return "bg-amber-50 text-amber-700";
  if (status === "Delivering") return "bg-violet-50 text-violet-700";
  return "bg-sky-50 text-sky-700";
}

export default function DistributorOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState<"Open" | "Delivered" | "All">("Open");
  const [search, setSearch] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { setError("Sign in again to view orders."); setLoading(false); return; }

    const profile = await supabase.from("profile_distributors").select("merchant_id").eq("id", user.id).maybeSingle();
    if (profile.error || !profile.data?.merchant_id) {
      setError(profile.error?.message || "This distributor is not linked to a merchant.");
      setLoading(false);
      return;
    }

    const result = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, delivery_address, total, status, created_at")
      .eq("merchant_id", profile.data.merchant_id)
      .eq("distributor_id", user.id)
      .order("created_at", { ascending: false });

    if (result.error) setError(result.error.message);
    else setOrders((result.data ?? []).map((row) => mapOrder(row as OrderRow)));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadOrders(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadOrders]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) =>
      (filter === "All" || (filter === "Delivered" ? order.status === "Delivered" : order.status !== "Delivered")) &&
      (!query || order.id.toLowerCase().includes(query) || order.customerName.toLowerCase().includes(query) || order.address.toLowerCase().includes(query))
    );
  }, [filter, orders, search]);
  const pending = orders.filter((order) => order.status === "Pending").length;

  async function advance(order: DeliveryOrder) {
    const next = nextDeliveryStatus(order.status);
    if (!next) return;
    setBusyId(order.id);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setError("Sign in again to update this order."); setBusyId(""); return; }

    const result = await supabase
      .from("orders")
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("distributor_id", userData.user.id)
      .select("id")
      .maybeSingle();

    if (result.error || !result.data) {
      setError(result.error?.message || "The order was not updated. Check distributor order permissions.");
    } else {
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, status: next } : item));
      setNotice(`Order ${order.id} is now ${next.toLowerCase()}.`);
    }
    setBusyId("");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900 to-emerald-700 px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">Delivery queue</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Orders</h1><p className="mt-2 text-sm text-green-100">Confirm new orders and keep customers informed as delivery progresses.</p></div>
          <div className="flex items-center gap-2">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10" aria-label={`${pending} new orders`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" /></svg>
              {pending > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-amber-950">{pending}</span>}
            </div>
            <button type="button" onClick={() => void loadOrders()} disabled={loading} className="h-11 rounded-xl bg-white px-4 text-sm font-black text-green-800 disabled:opacity-60">Refresh</button>
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[{ label: "Assigned", value: orders.length }, { label: "New", value: pending }, { label: "Delivered", value: orders.filter((order) => order.status === "Delivered").length }].map((item) => (
          <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-gray-400">{item.label}</p><p className="mt-1 text-2xl font-black text-gray-900">{item.value}</p></div>
        ))}
      </div>

      {notice && <div role="status" className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">{notice}</div>}
      {error && (
        <div role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <p className="font-black">Live orders are not available yet</p>
          <p className="mt-1 leading-6">The order service or its distributor permissions are not ready. No order data has been replaced with demo content.</p>
          <details className="mt-2 text-xs"><summary className="cursor-pointer font-black">Technical details</summary><p className="mt-1 break-words font-mono">{error}</p></details>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1 sm:w-fit">
          {(["Open", "Delivered", "All"] as const).map((item) => {
            const count = item === "All" ? orders.length : item === "Delivered" ? orders.filter((order) => order.status === "Delivered").length : orders.filter((order) => order.status !== "Delivered").length;
            return <button key={item} type="button" onClick={() => setFilter(item)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-black sm:flex-none ${filter === item ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>{item} <span className="ml-1 opacity-70">{count}</span></button>;
          })}
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search assigned orders" placeholder="Search order, customer, address…" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 sm:max-w-sm" />
      </div>

      {loading ? <div className="mt-5 space-y-3" aria-label="Loading orders">{[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />)}</div> : !error && visible.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-gray-100 bg-white px-6 py-20 text-center shadow-sm"><p className="font-black text-gray-700">No {filter.toLowerCase()} orders</p><p className="mt-1 text-sm text-gray-400">Assigned customer orders will appear here.</p></div>
      ) : (
        <div className="mt-5 space-y-3">
          {visible.map((order) => {
            const next = nextDeliveryStatus(order.status);
            return (
              <article key={order.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-gray-900">Order {order.id}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${badge(order.status)}`}>{order.status}</span></div><p className="mt-1 text-sm font-bold text-gray-700">{order.customerName}</p><p className="mt-1 text-xs text-gray-500">{order.phone || "No phone"} · {order.address || "No delivery address"}</p><p className="mt-2 text-xs text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recently assigned"}</p><div className="mt-3 flex max-w-xs gap-1" aria-label={`Order progress: ${order.status}`}>{["Confirmed", "Preparing", "Packaging", "Delivering", "Delivered"].map((step) => { const reached = ["Pending", "Confirmed", "Preparing", "Packaging", "Delivering", "Delivered"].indexOf(order.status) >= ["Pending", "Confirmed", "Preparing", "Packaging", "Delivering", "Delivered"].indexOf(step as DeliveryStatus); return <span key={step} title={step} className={`h-1.5 flex-1 rounded-full ${reached ? "bg-green-500" : "bg-gray-100"}`} />; })}</div></div>
                  <div className="flex flex-shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end"><p className="font-black text-green-700">{formatKHR(order.total)}</p>{next && <button type="button" onClick={() => void advance(order)} disabled={busyId === order.id} className="rounded-xl bg-green-600 px-4 py-2.5 text-xs font-black text-white hover:bg-green-700 disabled:opacity-60">{busyId === order.id ? "Updating…" : deliveryActionLabel(order.status)}</button>}</div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
