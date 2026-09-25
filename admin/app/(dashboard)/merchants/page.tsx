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

    if (selected?.id === id) {
      setSelected((prev) => (prev ? { ...prev, is_approved: approve } : null));
    }

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
    const keyword = search.toLowerCase();

    const matchesSearch =
      m.full_name?.toLowerCase().includes(keyword) ||
      m.community_name?.toLowerCase().includes(keyword) ||
      m.province?.toLowerCase().includes(keyword);

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
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-gray-900">Merchants</h2>
        <p className="text-gray-600">Manage and approve merchant accounts.</p>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Merchant List</h3>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              type="text"
              placeholder="Search merchants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
            >
              <option>All Merchants</option>
              <option>Approved</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">Loading...</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead>
                <tr className="border-b border-gray-300 text-sm font-semibold text-gray-600">
                  <th className="w-[22%] px-4 py-3">Name</th>
                  <th className="w-[24%] px-4 py-3">Community</th>
                  <th className="w-[20%] px-4 py-3">Province</th>
                  <th className="w-[14%] px-4 py-3">Status</th>
                  <th className="w-[20%] px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 align-middle">
                      <p className="truncate font-medium text-gray-900">
                        {m.full_name || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-gray-600">
                        {m.community_name || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="truncate text-gray-600">
                        {m.province || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                          m.is_approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {m.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-middle text-right">
                      <div className="flex w-full justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelected(m)}
                          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                        >
                          View
                        </button>

                        {m.is_approved ? (
                          <button
                            onClick={() => handleApprove(m.id, false)}
                            disabled={actionLoading}
                            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApprove(m.id, true)}
                            disabled={actionLoading}
                            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={actionLoading}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
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

        {!loading && filtered.length === 0 && (
          <p className="mt-6 rounded-lg bg-gray-50 py-8 text-center text-gray-500">
            No merchants found.
          </p>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {selected.full_name}
              </h3>

              <button
                onClick={() => setSelected(null)}
                className="text-xl font-bold text-gray-400 hover:text-gray-600"
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
                  value: selected.created_at
                    ? new Date(selected.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—",
                },
                { label: "Verified", value: selected.is_verified ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 border-b pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-right font-medium text-gray-800">
                    {value || "—"}
                  </span>
                </div>
              ))}
            </div>

            {selected.certificate_url && (
              <a
                href={selected.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center rounded-lg border border-blue-200 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
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