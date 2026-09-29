"use client";

import { useEffect, useState } from "react";

type Distributor = {
  id: string;
  merchant_id: string;
  merchant_name: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
};

export default function AdminDistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Distributor | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/distributors");
      const data = await res.json();
      setDistributors(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function act(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm("Reject and delete this distributor request?")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/distributors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Action failed."); return; }

      if (action === "reject") {
        setDistributors((prev) => prev.filter((d) => d.id !== id));
        setSelected(null);
      } else {
        setDistributors((prev) => prev.map((d) => (d.id === id ? { ...d, status: "active" } : d)));
        setSelected((prev) => (prev && prev.id === id ? { ...prev, status: "active" } : prev));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this distributor account? This also deletes their login.")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/distributors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Delete failed."); return; }
      setDistributors((prev) => prev.filter((d) => d.id !== id));
      setSelected((prev) => (prev && prev.id === id ? null : prev));
    } finally {
      setBusyId(null);
    }
  }

  const filtered = distributors.filter((d) => filter === "All" || d.status === filter.toLowerCase());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-[var(--foreground)] font-heading">Distributors & Couriers</h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#667262]">Authorize merchant-linked distributors and manage fleet dispatch accounts.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Distributor Registry</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] focus:bg-white focus:border-[var(--leaf)] focus:outline-none"
          >
            <option>All</option>
            <option>Pending</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
            <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">Loading distributors…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b border-[#dfe6d9] text-xs font-bold text-[#667262] uppercase tracking-wider">
                  <th className="w-[18%] py-3.5">Name</th>
                  <th className="w-[22%] py-3.5">Email</th>
                  <th className="w-[18%] py-3.5">Assigned Merchant</th>
                  <th className="w-[12%] py-3.5">Status</th>
                  <th className="w-[30%] py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4ef] text-sm">
                {filtered.map((d) => (
                  <tr key={d.id} onClick={() => setSelected(d)} className="cursor-pointer hover:bg-[#fafbf9] transition-colors">
                    <td className="py-4 font-bold text-[var(--foreground)]">{d.full_name}</td>
                    <td className="py-4 text-xs font-medium text-[#556353]">{d.email}</td>
                    <td className="py-4 text-xs font-semibold text-[#556353]">{d.merchant_name}</td>
                    <td className="py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                        d.status === "pending" ? "bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]" :
                        d.status === "active" ? "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        {d.status === "pending" ? (
                          <>
                            <button onClick={() => act(d.id, "approve")} disabled={busyId === d.id} className="rounded-xl bg-[var(--leaf)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--leaf-dark)] transition-colors disabled:opacity-50 cursor-pointer">
                              Approve
                            </button>
                            <button onClick={() => act(d.id, "reject")} disabled={busyId === d.id} className="rounded-xl bg-[#fee2e2] px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer">
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleDelete(d.id)} disabled={busyId === d.id} className="rounded-xl bg-[#fee2e2] hover:bg-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors disabled:opacity-50 cursor-pointer">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && <p className="mt-8 text-center text-sm text-[#7d8b79] py-4">No distributors found.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-7 border border-[#dfe6d9] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between border-b border-[#f2f4ef] pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--leaf-accent)]">Courier Account</span>
                <h3 className="text-xl font-black text-[var(--foreground)] font-heading mt-0.5">{selected.full_name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-[#faf7f0] text-[#556353] hover:text-black flex items-center justify-center cursor-pointer">✕</button>
            </div>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Email Address</dt><dd className="font-semibold text-[var(--foreground)]">{selected.email}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Distributor ID</dt><dd className="font-mono text-[11px] text-[var(--foreground)]">{selected.id}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Merchant Partner</dt><dd className="font-bold text-[var(--foreground)]">{selected.merchant_name}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Status</dt><dd className="font-bold text-[var(--leaf-dark)] capitalize">{selected.status}</dd></div>
              <div className="flex justify-between py-1"><dt className="text-[#7d8b79]">Requested On</dt><dd className="font-bold text-[var(--foreground)]">{new Date(selected.created_at).toLocaleDateString()}</dd></div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2.5 border-t border-[#f2f4ef] pt-4">
              {selected.status === "pending" ? (
                <>
                  <button onClick={() => act(selected.id, "approve")} disabled={busyId === selected.id} className="rounded-xl bg-[var(--leaf)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--leaf-dark)] disabled:opacity-50 cursor-pointer">
                    Approve
                  </button>
                  <button onClick={() => act(selected.id, "reject")} disabled={busyId === selected.id} className="rounded-xl bg-[#fee2e2] px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 cursor-pointer">
                    Reject
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleDelete(selected.id)} disabled={busyId === selected.id} className="rounded-xl bg-[#fee2e2] px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 cursor-pointer">
                    Delete Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}