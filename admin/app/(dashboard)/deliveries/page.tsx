"use client";

import { useEffect, useState } from "react";

type Delivery = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchDeliveries();
  }, []);

  async function fetchDeliveries() {
    setLoading(true);
    try {
      const res = await fetch("/api/deliveries");
      const data = await res.json();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to create delivery account.");
        return;
      }
      setForm({ email: "", first_name: "", last_name: "", phone: "" });
      setShowForm(false);
      fetchDeliveries();
    } catch (error) {
      console.error("Failed to create delivery:", error);
      setFormError("Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleStatus(delivery: Delivery) {
    setActionLoading(true);
    try {
      await fetch("/api/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: delivery.id, is_active: !delivery.is_active }),
      });
      setDeliveries((prev) =>
        prev.map((d) => (d.id === delivery.id ? { ...d, is_active: !d.is_active } : d))
      );
    } catch (error) {
      console.error("Failed to update delivery:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this delivery account? This also removes their login.")) return;
    setActionLoading(true);
    try {
      await fetch("/api/deliveries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Failed to delete delivery:", error);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-[var(--foreground)] font-heading">Courier Fleet & Riders</h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#667262]">Manage active delivery drivers, dispatch accounts, and field status.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Registered Drivers</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-[var(--leaf)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--leaf-dark)] transition-colors cursor-pointer"
          >
            {showForm ? "Cancel" : "+ Add Courier"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-2xl border border-[#dfe6d9] bg-[#fafbf9] p-5 sm:grid-cols-2">
            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-[#dfe6d9] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--leaf)] focus:outline-none"
            />
            <input
              required
              placeholder="Phone number (+855...)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-xl border border-[#dfe6d9] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--leaf)] focus:outline-none"
            />
            <input
              required
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="rounded-xl border border-[#dfe6d9] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--leaf)] focus:outline-none"
            />
            <input
              required
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="rounded-xl border border-[#dfe6d9] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--leaf)] focus:outline-none"
            />
            {formError && <p className="text-xs font-bold text-red-600 sm:col-span-2">{formError}</p>}
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-xl bg-[var(--leaf)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--leaf-dark)] disabled:opacity-50 sm:col-span-2 transition-colors cursor-pointer"
            >
              {actionLoading ? "Creating…" : "Register Courier Account"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
            <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">Loading courier fleet…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[#dfe6d9] text-xs font-bold text-[#667262] uppercase tracking-wider">
                  <th className="px-3 py-3.5">Name</th>
                  <th className="px-3 py-3.5">Email</th>
                  <th className="px-3 py-3.5">Phone</th>
                  <th className="px-3 py-3.5">Status</th>
                  <th className="px-3 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4ef] text-sm">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-[#fafbf9] transition-colors">
                    <td className="px-3 py-4 font-bold text-[var(--foreground)]">{d.first_name} {d.last_name}</td>
                    <td className="px-3 py-4 text-xs font-medium text-[#556353]">{d.email}</td>
                    <td className="px-3 py-4 text-xs font-semibold text-[#556353]">{d.phone}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${d.is_active ? "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {d.is_active ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(d)}
                          disabled={actionLoading}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition-colors cursor-pointer ${d.is_active ? "bg-amber-600 hover:bg-amber-700" : "bg-[var(--leaf)] hover:bg-[var(--leaf-dark)]"}`}
                        >
                          {d.is_active ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={actionLoading}
                          className="rounded-xl bg-[#fee2e2] px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && deliveries.length === 0 && <p className="mt-8 text-center text-sm text-[#7d8b79] py-4">No riders registered yet.</p>}
      </div>
    </div>
  );
}