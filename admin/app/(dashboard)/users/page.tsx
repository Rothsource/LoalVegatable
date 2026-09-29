// admin/app/(dashboard)/users/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

type Order = {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
};

type Address = {
  label: string | null;
  recipient_name: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  province: string | null;
  is_default: boolean;
};

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  orders: Order[];
  order_count: number;
  total_spent: number;
  default_address: Address | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    const json = await res.json();
    setUsers(json.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Delete failed."); return; }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelected((prev) => (prev && prev.id === id ? null : prev));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase();
    return name.includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.location ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-[var(--foreground)] font-heading">Consumer Accounts</h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#667262]">Audit registered consumers, purchasing frequency, and residential addresses.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Registered Buyers</h3>
          <input
            type="text"
            placeholder="Search buyers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] placeholder-[#9ca69a] focus:bg-white focus:border-[var(--leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--leaf)]/20"
          />
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
            <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">Loading user accounts…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b border-[#dfe6d9] text-xs font-bold text-[#667262] uppercase tracking-wider">
                  <th className="w-[22%] py-3.5">Full Name</th>
                  <th className="w-[26%] py-3.5">Email</th>
                  <th className="w-[16%] py-3.5">Location</th>
                  <th className="w-[12%] py-3.5">Orders</th>
                  <th className="w-[12%] py-3.5">Spent</th>
                  <th className="w-[12%] py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4ef] text-sm">
                {filtered.map((u) => (
                  <tr key={u.id} onClick={() => setSelected(u)} className="cursor-pointer hover:bg-[#fafbf9] transition-colors">
                    <td className="truncate py-4 font-bold text-[var(--foreground)]">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="truncate py-4 text-xs font-medium text-[#556353]">{u.email || "—"}</td>
                    <td className="truncate py-4 text-xs font-semibold text-[#556353]">{u.location || "—"}</td>
                    <td className="py-4 text-xs font-extrabold text-[var(--foreground)]">{u.order_count}</td>
                    <td className="py-4 text-xs font-bold text-[var(--leaf-dark)]">{Math.round(u.total_spent).toLocaleString()} KHR</td>
                    <td className="py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={busyId === u.id}
                        onClick={() => handleDelete(u.id)}
                        className="rounded-xl bg-[#fee2e2] px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && <p className="mt-8 text-center text-sm text-[#7d8b79] py-4">No consumer accounts found.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 border border-[#dfe6d9] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between border-b border-[#f2f4ef] pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--leaf-accent)]">User Account</span>
                <h3 className="text-xl font-black text-[var(--foreground)] font-heading mt-0.5">
                  {[selected.first_name, selected.last_name].filter(Boolean).join(" ") || "Unnamed user"}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-[#faf7f0] text-[#556353] hover:text-black flex items-center justify-center cursor-pointer">✕</button>
            </div>

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">User ID</dt><dd className="font-mono text-[11px] text-[var(--foreground)]">{selected.id}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Email</dt><dd className="font-semibold text-[var(--foreground)]">{selected.email || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Location</dt><dd className="font-bold text-[var(--foreground)]">{selected.location || "—"}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Joined</dt><dd className="font-medium text-[var(--foreground)]">{new Date(selected.created_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Total Orders</dt><dd className="font-bold text-[var(--foreground)]">{selected.order_count}</dd></div>
              <div className="flex justify-between py-1"><dt className="text-[#7d8b79]">Lifetime Spent</dt><dd className="font-extrabold text-[var(--leaf-dark)]">{Math.round(selected.total_spent).toLocaleString()} KHR</dd></div>
            </dl>

            {selected.default_address && (
              <div className="mt-5 rounded-2xl border border-[#dfe6d9] bg-[#fafbf9] p-4 text-xs">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--leaf-accent)]">Delivery Address</p>
                <p className="font-bold text-[var(--foreground)]">{selected.default_address.recipient_name} · {selected.default_address.phone}</p>
                <p className="text-[#556353] mt-0.5">
                  {selected.default_address.street}, {selected.default_address.city}, {selected.default_address.province}
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-[#f2f4ef] pt-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#7d8b79]">Recent Orders ({selected.orders.length})</p>
              {selected.orders.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selected.orders
                    .slice()
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-xl border border-[#dfe6d9] bg-[#fafbf9] p-2.5 text-xs">
                        <span className="font-mono text-[11px] text-[#7d8b79]">#{o.id.slice(0, 8)}</span>
                        <span className="font-bold text-[var(--foreground)]">{Math.round(Number(o.total_amount)).toLocaleString()} KHR</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          o.status === "delivered" ? "bg-[#edf6e9] text-[var(--leaf-dark)]" :
                          o.status === "cancelled" ? "bg-red-50 text-red-700" :
                          "bg-[#fef8ea] text-[#935b0b]"
                        }`}>
                          {o.status}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          o.payment_status === "paid" ? "bg-[#eaf4fe] text-[#1e5fa0]" : "bg-gray-100 text-gray-600"
                        }`}>
                          {o.payment_status}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-[#7d8b79]">No orders placed yet.</p>
              )}
            </div>

            <div className="mt-6 border-t border-[#f2f4ef] pt-4">
              <button
                disabled={busyId === selected.id}
                onClick={() => handleDelete(selected.id)}
                className="rounded-xl bg-[#fee2e2] px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}