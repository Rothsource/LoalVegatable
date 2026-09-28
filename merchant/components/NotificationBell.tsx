"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  product_id?: string;
  name?: string;
  product_name?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
};

type OrderNotif = {
  id: string;
  total_amount: number;
  created_at: string;
  status: string;
  items?: OrderItem[];
};

function getDenied(): string[] {
  try { return JSON.parse(localStorage.getItem("distributor-denied-orders") || "[]"); } catch { return []; }
}

// role="distributor" → can Accept/Deny from the dropdown.
// role="merchant"    → view customer orders for their produce with item details.
export default function NotificationBell({ role }: { role: "distributor" | "merchant" }) {
  const [orders, setOrders] = useState<OrderNotif[]>([]);
  const [open, setOpen] = useState(false);
  const [distributorId, setDistributorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (role === "distributor") {
      setDistributorId(user.id);
      try {
        const res = await fetch(`/api/distributor/orders?distributorId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const denied = getDenied();
          const pending = (data.pending || []).filter((o: OrderNotif) => !denied.includes(o.id));
          setOrders(pending);
        }
      } catch (err) {
        console.error("Distributor bell load error:", err);
      }
    } else {
      // Merchant: fetch orders for this merchant
      try {
        const res = await fetch(`/api/merchant/orders?merchantId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Merchant bell load error:", err);
      }
    }
  }, [role]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notif-bell-${role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, role]);

  const accept = async (orderId: string) => {
    if (role === "merchant") {
      try {
        await fetch("/api/merchant/orders/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "accept" }),
        });
      } catch {
        await supabase
          .from("orders")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", orderId);
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      load();
      return;
    }

    if (!distributorId) return;
    const { data } = await supabase
      .from("orders")
      .update({ status: "accepted", distributor_id: distributorId, accepted_at: new Date().toISOString() })
      .eq("id", orderId).eq("status", "pending").is("distributor_id", null)
      .select("id");
    if (data && data.length > 0) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      load();
    }
  };

  const deny = async (orderId: string) => {
    if (role === "merchant") {
      try {
        await fetch("/api/merchant/orders/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, action: "deny", reason: "Merchant unable to accept order" }),
        });
      } catch {
        await supabase
          .from("orders")
          .update({ status: "cancelled", payment_status: "refunded" })
          .eq("id", orderId);
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      load();
      return;
    }

    const denied = getDenied();
    localStorage.setItem("distributor-denied-orders", JSON.stringify([...denied, orderId]));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
    load();
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-full p-2 hover:bg-gray-100 transition cursor-pointer">
        <Bell size={20} className="text-gray-600" />
        {pendingCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-84 rounded-2xl border border-[#dfe6d9] bg-white p-3 shadow-xl card-shadow">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-1">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--leaf-dark)]">
              {role === "distributor" ? "Pending Delivery Orders" : "Recent Store Orders"}
            </p>
            {pendingCount > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                {pendingCount} new
              </span>
            )}
          </div>

          {orders.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs font-semibold text-gray-400">No active orders right now</p>
          ) : (
            <div className="max-h-84 space-y-2 overflow-y-auto pr-1">
              {orders.slice(0, 10).map((o) => {
                const itemSummary = (o.items || [])
                  .map((i) => `${i.product_name || i.name || "Produce"} ×${i.quantity} ${i.unit || "kg"}`)
                  .join(", ");

                return (
                  <div key={o.id} className="rounded-xl p-3 bg-[#fafbf9] border border-[#e2e8dd] hover:border-[#c8dfc5] transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">#{o.id.slice(0, 8)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        o.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : o.status === "accepted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {o.status}
                      </span>
                    </div>

                    {itemSummary && (
                      <div className="mt-1 flex items-start gap-1.5 text-xs text-[#52604f]">
                        <Package size={13} className="text-[#2E6F40] shrink-0 mt-0.5" />
                        <span className="line-clamp-2 font-medium">{itemSummary}</span>
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs font-black text-[#0A490A]">
                        {Number(o.total_amount).toLocaleString()} KHR
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {o.status === "pending" && (
                      <div className="mt-2.5 flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => deny(o.id)}
                          className="flex-1 rounded-xl border border-red-200 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                        >
                          {role === "merchant" ? "Decline (Refund)" : "Pass"}
                        </button>
                        <button
                          onClick={() => accept(o.id)}
                          className="flex-1 rounded-xl bg-[#0DB30D] hover:bg-[#0A490A] py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}