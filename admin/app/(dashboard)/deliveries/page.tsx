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
    <>
      <h2 className="text-3xl font-bold text-gray-900">Deliveries</h2>
      <p className="mt-2 text-gray-600">Manage delivery rider accounts.</p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-xl font-bold text-gray-900">Rider List</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ Add Rider"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
            <input
              required
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
            <input
              required
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
            <input
              required
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            />
            {formError && <p className="text-sm font-semibold text-red-600 sm:col-span-2">{formError}</p>}
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 sm:col-span-2"
            >
              {actionLoading ? "Creating..." : "Create Rider Account"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="py-8 text-center text-gray-500">Loading deliveries...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-b last:border-b-0">
                    <td className="px-3 py-4 font-medium text-gray-900">{d.first_name} {d.last_name}</td>
                    <td className="px-3 py-4 text-gray-600">{d.email}</td>
                    <td className="px-3 py-4 text-gray-600">{d.phone}</td>
                    <td className="px-3 py-4">
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {d.is_active ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(d)}
                          disabled={actionLoading}
                          className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${d.is_active ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                        >
                          {d.is_active ? "Block" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50"
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

        {!loading && deliveries.length === 0 && <p className="mt-6 text-center text-gray-500">No riders yet.</p>}
      </div>
    </>
  );
}