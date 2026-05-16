"use client";

import { useEffect, useState } from "react";

type Merchant = {
  id: string;
  full_name: string;
  community_name: string;
  province: string;
  fav_vegetable: string;
  is_approved: boolean;
  is_verified: boolean;
  created_at: string;
  certificate_url: string;
  profile_url: string;
  background_urls: string[];
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Merchants");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Merchant | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  async function fetchMerchants() {
    setLoading(true);
    const res = await fetch("/api/merchants");
    const data = await res.json();
    setMerchants(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleApprove(id: string, approve: boolean) {
    setActionLoading(true);
    await fetch("/api/merchants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved: approve }),
    });
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_approved: approve } : m))
    );
    if (selected?.id === id)
      setSelected((prev) => (prev ? { ...prev, is_approved: approve } : null));
    setActionLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this merchant account?")) return;
    setActionLoading(true);
    await fetch("/api/merchants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMerchants((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
    setActionLoading(false);
  }

  const filtered = merchants.filter((m) => {
    const matchesSearch =
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.community_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.province?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All Merchants"
        ? true
        : filter === "Approved"
        ? m.is_approved
        : !m.is_approved;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900">Merchants</h2>
      <p className="mt-2 text-gray-600">Manage and approve merchant accounts.</p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-bold text-gray-900">Merchant List</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-900"
            >
              <option>All Merchants</option>
              <option>Approved</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="py-3">Name</th>
                <th className="py-3">Community</th>
                <th className="py-3">Province</th>
                <th className="py-3">Status</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-4 font-medium text-gray-900">{m.full_name}</td>
                  <td className="py-4 text-gray-600">{m.community_name}</td>
                  <td className="py-4 text-gray-600">{m.province}</td>
                  <td className="py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        m.is_approved
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {m.is_approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelected(m)}
                        className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                      >
                        View
                      </button>
                      {m.is_approved ? (
                        <button
                          onClick={() => handleApprove(m.id, false)}
                          disabled={actionLoading}
                          className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(m.id, true)}
                          disabled={actionLoading}
                          className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={actionLoading}
                        className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <p className="mt-6 text-center text-gray-500">No merchants found.</p>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selected.full_name}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: "Community", value: selected.community_name },
                { label: "Province", value: selected.province },
                { label: "Favourite vegetable", value: selected.fav_vegetable },
                {
                  label: "Registered",
                  value: new Date(selected.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                },
                { label: "Verified", value: selected.is_verified ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{value || "—"}</span>
                </div>
              ))}
            </div>

            {selected.certificate_url && (
              <a
                href={selected.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center w-full py-2 text-sm text-blue-600 font-semibold border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                View certificate
              </a>
            )}

            <div className="mt-4 flex gap-2">
              {!selected.is_approved ? (
                <button
                  onClick={() => handleApprove(selected.id, true)}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-green-500 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Approve"}
                </button>
              ) : (
                <button
                  onClick={() => handleApprove(selected.id, false)}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-yellow-500 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Revoke"}
                </button>
              )}
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={actionLoading}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}