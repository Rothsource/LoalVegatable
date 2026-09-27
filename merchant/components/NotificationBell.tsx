"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PendingOrder = {
  id: string;
  total_amount: number;
  created_at: string;
  status: string;
};

function getDenied(): string[] {
  try { return JSON.parse(localStorage.getItem("distributor-denied-orders") || "[]"); } catch { return []; }
}

// role="distributor" → can Accept/Deny from the dropdown.
// role="merchant"    → same list, read-only, no action buttons.
export default function NotificationBell({ role }: { role: "distributor" | "merchant" }) {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [open, setOpen] = useState(false);
  const [distributorId, setDistributorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (role === "distributor") {
      // profile_distributors.id IS the auth user id directly.
      setDistributorId(user.id);

      const { data } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, status")
        .eq("status", "pending")
        .is("distributor_id", null)
        .order("created_at", { ascending: true });

      const denied = getDenied();
      setOrders((data || []).filter((o) => !denied.includes(o.id)));
    } else {
      // Merchant: read-only view — recent activity on their own orders
      // (RLS's "merchants view own orders" policy already scopes this).
      const { data } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, status")
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(10);
      setOrders(data || []);
    }
  }, [role]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notif-bell-${role}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, role]);

  const accept = async (orderId: string) => {
    if (!distributorId) return;
    const { data } = await supabase
      .from("orders")
      .update({ status: "accepted", distributor_id: distributorId, accepted_at: new Date().toISOString() })
      .eq("id", orderId).eq("status", "pending").is("distributor_id", null)
      .select("id");
    if (data && data.length > 0) setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const deny = async (orderId: string) => {
    const denied = getDenied();
    localStorage.setItem("distributor-denied-orders", JSON.stringify([...denied, orderId]));
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    };
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-full p-2 hover:bg-gray-100">
        <Bell size={20} className="text-gray-600" />
        {pendingCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
          <p className="px-2 py-1 text-xs font-black uppercase tracking-wide text-gray-400">
            {role === "distributor" ? "Pending orders" : "Recent orders"}
          </p>
          {orders.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-gray-400">Nothing new</p>
          ) : (
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl p-2.5 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">#{o.id.slice(0, 8)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      o.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>{o.status}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-black text-gray-900">${Number(o.total_amount).toFixed(2)}</p>

                  {role === "distributor" && o.status === "pending" && (
                    <div className="mt-2 flex gap-1.5">
                      <button onClick={() => deny(o.id)}
                        className="flex-1 rounded-lg border border-red-200 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50">
                        Deny
                      </button>
                      <button onClick={() => accept(o.id)}
                        className="flex-1 rounded-lg bg-green-600 py-1.5 text-[11px] font-bold text-white hover:bg-green-700">
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}