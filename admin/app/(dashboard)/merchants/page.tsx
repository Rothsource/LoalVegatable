// admin/app/(dashboard)/merchants/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  profile_pic_url: string | null;
};

type Merchant = {
  id: string;
  full_name: string | null;
  community_name: string | null;
  province: string | null;
  fav_vegetable: string | null;
  profile_url: string | null;
  certificate_url: string | null;
  background_urls: string[] | null;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  products: Product[];
  product_count: number;
  active_product_count: number;
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved">("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Merchant | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/merchants");
    const json = await res.json();
    setMerchants(json.merchants ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setApproval = async (id: string, is_approved: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_approved }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Update failed."); return; }
      setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, is_approved } : m)));
      setSelected((prev) => (prev && prev.id === id ? { ...prev, is_approved } : prev));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this merchant? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch("/api/merchants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Delete failed."); return; }
      setMerchants((prev) => prev.filter((m) => m.id !== id));
      setSelected((prev) => (prev && prev.id === id ? null : prev));
    } finally {
      setBusyId(null);
    }
  };

  const filtered = merchants.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (m.full_name ?? "").toLowerCase().includes(q) ||
      (m.community_name ?? "").toLowerCase().includes(q) ||
      (m.province ?? "").toLowerCase().includes(q);
    const matchesFilter =
      filter === "All" ||
      (filter === "Pending" && !m.is_approved) ||
      (filter === "Approved" && m.is_approved);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-[var(--foreground)] font-heading">Merchants & Farms</h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#667262]">Review credentials, manage certifications, and approve grower shop applications.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Registered Producers</h3>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search farms or provinces..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] placeholder-[#9ca69a] focus:bg-white focus:border-[var(--leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--leaf)]/20"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] focus:bg-white focus:border-[var(--leaf)] focus:outline-none"
            >
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
            <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">Loading verified farms…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b border-[#dfe6d9] text-xs font-bold text-[#667262] uppercase tracking-wider">
                  <th className="w-[20%] py-3.5">Shop / Owner</th>
                  <th className="w-[16%] py-3.5">Community</th>
                  <th className="w-[13%] py-3.5">Province</th>
                  <th className="w-[12%] py-3.5">Products</th>
                  <th className="w-[13%] py-3.5">Status</th>
                  <th className="w-[26%] py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4ef] text-sm">
                {filtered.map((m) => (
                  <tr key={m.id} onClick={() => setSelected(m)} className="cursor-pointer hover:bg-[#fafbf9] transition-colors">
                    <td className="truncate py-4 font-bold text-[var(--foreground)]">{m.full_name || "—"}</td>
                    <td className="truncate py-4 text-[#556353]">{m.community_name || "—"}</td>
                    <td className="truncate py-4 text-[#556353]">{m.province || "—"}</td>
                    <td className="py-4 text-xs font-semibold text-[#556353]">
                      {m.active_product_count}/{m.product_count} active
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                        m.is_approved ? "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]" : "bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]"
                      }`}>
                        {m.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        {!m.is_approved ? (
                          <button disabled={busyId === m.id} onClick={() => setApproval(m.id, true)} className="rounded-xl bg-[var(--leaf)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--leaf-dark)] transition-colors disabled:opacity-50 cursor-pointer">
                            Approve
                          </button>
                        ) : (
                          <button disabled={busyId === m.id} onClick={() => setApproval(m.id, false)} className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer">
                            Revoke
                          </button>
                        )}
                        <button disabled={busyId === m.id} onClick={() => handleDelete(m.id)} className="rounded-xl bg-[#fee2e2] px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer">
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

        {!loading && filtered.length === 0 && <p className="mt-8 text-center text-sm text-[#7d8b79] py-4">No merchants found.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 border border-[#dfe6d9] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between border-b border-[#f2f4ef] pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--leaf-accent)]">Merchant Profile</span>
                <h3 className="text-xl font-black text-[var(--foreground)] font-heading mt-0.5">{selected.full_name || "Unnamed merchant"}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-[#faf7f0] text-[#556353] hover:text-black flex items-center justify-center cursor-pointer">✕</button>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              {selected.profile_url && (
                <img src={selected.profile_url} alt="Profile" className="h-24 w-24 shrink-0 rounded-2xl object-cover border border-[#dfe6d9]" />
              )}
              <dl className="flex-1 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Merchant ID</dt><dd className="font-mono text-[11px] text-[var(--foreground)]">{selected.id}</dd></div>
                <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Community</dt><dd className="font-bold text-[var(--foreground)]">{selected.community_name || "—"}</dd></div>
                <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Province</dt><dd className="font-bold text-[var(--foreground)]">{selected.province || "—"}</dd></div>
                <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Favorite vegetable</dt><dd className="font-bold text-[var(--foreground)]">{selected.fav_vegetable || "—"}</dd></div>
                <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Verified Status</dt><dd className="font-bold text-[var(--leaf-dark)]">{selected.is_verified ? "Yes" : "No"}</dd></div>
                <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Approval Status</dt><dd className="font-bold text-[var(--foreground)]">{selected.is_approved ? "Approved" : "Pending"}</dd></div>
                <div className="flex justify-between py-1"><dt className="text-[#7d8b79]">Joined</dt><dd className="font-bold text-[var(--foreground)]">{new Date(selected.created_at).toLocaleDateString()}</dd></div>
              </dl>
            </div>

            {selected.certificate_url && (
              <a href={selected.certificate_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--leaf-dark)] hover:underline">
                📄 View official certificate →
              </a>
            )}

            {selected.background_urls?.length ? (
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#7d8b79]">Farm Photos</p>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {selected.background_urls.map((url, i) => (
                    <img key={i} src={url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover border border-[#dfe6d9]" />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 border-t border-[#f2f4ef] pt-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#7d8b79]">
                Produce Listings ({selected.active_product_count}/{selected.product_count} active)
              </p>
              {selected.products.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selected.products.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#dfe6d9] p-2.5 bg-[#fafbf9]">
                      {p.profile_pic_url && <img src={p.profile_pic_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />}
                      <span className="flex-1 truncate text-xs font-bold text-[var(--foreground)]">{p.name}</span>
                      <span className="text-xs font-extrabold text-[var(--foreground)]">{Math.round(Number(p.price)).toLocaleString()} KHR</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${p.is_active ? "bg-[#edf6e9] text-[var(--leaf-dark)]" : "bg-gray-100 text-gray-500"}`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#7d8b79]">No products listed.</p>
              )}
            </div>

            <div className="mt-6 flex gap-3 border-t border-[#f2f4ef] pt-4">
              {!selected.is_approved ? (
                <button disabled={busyId === selected.id} onClick={() => setApproval(selected.id, true)} className="rounded-xl bg-[var(--leaf)] px-4 py-2.5 text-xs font-bold text-white hover:bg-[var(--leaf-dark)] disabled:opacity-50 cursor-pointer">
                  Approve Farm
                </button>
              ) : (
                <button disabled={busyId === selected.id} onClick={() => setApproval(selected.id, false)} className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer">
                  Revoke Approval
                </button>
              )}
              <button disabled={busyId === selected.id} onClick={() => handleDelete(selected.id)} className="rounded-xl bg-[#fee2e2] px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 cursor-pointer">
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}