// app/(dashboard)/products/page.tsx
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price: number;
  stock_quantity: number;
  unit: string;
  category_id: string;
  category_name: string;
  is_organic: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_urls: string[] | null;
  merchant_id: string;
  merchant_name: string;
  profile_pic_url: string | null;
  background_pic_urls: string[] | null;
  harvest_date: string;
  expire_date: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Products");
  const [selected, setSelected] = useState<Product | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) { setProducts([]); return; }
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(product: Product) {
    setActionLoadingId(product.id);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, is_active: !product.is_active }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Update failed."); return; }

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
      );
      setSelected((prev) =>
        prev && prev.id === product.id ? { ...prev, is_active: !prev.is_active } : prev
      );
    } catch {
      alert("Network error — status not changed.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;

    setActionLoadingId(id);
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data?.error ?? "Delete failed."); return; }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => (prev && prev.id === id ? null : prev));
    } catch {
      alert("Network error — product not deleted.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const filtered = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "All Products" ? true : filter === "Active" ? p.is_active : !p.is_active;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-[var(--foreground)] font-heading">Produce Catalog</h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#667262]">Audit agricultural crops, fresh harvests, organic certifications, and inventory availability.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">Marketplace Inventory</h3>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search produce by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] placeholder-[#9ca69a] focus:bg-white focus:border-[var(--leaf)] focus:outline-none focus:ring-2 focus:ring-[var(--leaf)]/20"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-[#dfe6d9] bg-[#fafbf9] px-4 py-2 text-sm text-[var(--foreground)] focus:bg-white focus:border-[var(--leaf)] focus:outline-none"
            >
              <option>All Products</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
            <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">Loading harvest listings…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b border-[#dfe6d9] text-xs font-bold text-[#667262] uppercase tracking-wider">
                  <th className="w-[26%] py-3.5">Produce Item</th>
                  <th className="w-[16%] py-3.5">Farm Producer</th>
                  <th className="w-[12%] py-3.5">Unit Price</th>
                  <th className="w-[10%] py-3.5">Stock</th>
                  <th className="w-[9%] py-3.5">Organic</th>
                  <th className="w-[10%] py-3.5">Status</th>
                  <th className="w-[17%] py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f4ef] text-sm">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer hover:bg-[#fafbf9] transition-colors"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {p.profile_pic_url && (
                          <img src={p.profile_pic_url} alt={p.name} className="h-10 w-10 rounded-xl object-cover border border-[#dfe6d9]" />
                        )}
                        <span className="truncate font-bold text-[var(--foreground)]">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-medium text-[#556353] truncate">{p.merchant_name}</td>
                    <td className="py-4 text-xs font-bold text-[var(--foreground)]">
                      {Math.round(Number(p.price)).toLocaleString()} KHR<span className="ml-1 text-[10px] text-[#7d8b79] font-normal">/ {p.unit}</span>
                    </td>
                    <td className="py-4 text-xs font-semibold text-[#556353]">
                      {p.stock_quantity}<span className="ml-1 text-[10px] text-[#7d8b79]">{p.unit}</span>
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${p.is_organic ? "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]" : "bg-gray-100 text-gray-500"}`}>
                        {p.is_organic ? "Organic" : "Standard"}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${p.is_active ? "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={actionLoadingId === p.id}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition-colors cursor-pointer ${p.is_active ? "bg-amber-600 hover:bg-amber-700" : "bg-[var(--leaf)] hover:bg-[var(--leaf-dark)]"}`}
                        >
                          {p.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={actionLoadingId === p.id}
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

        {!loading && filtered.length === 0 && (
          <p className="mt-8 text-center text-sm text-[#7d8b79] py-4">No matching crops or vegetables found.</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-7 border border-[#dfe6d9] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between border-b border-[#f2f4ef] pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--leaf-accent)]">Crop Details</span>
                <h3 className="text-xl font-black text-[var(--foreground)] font-heading mt-0.5">{selected.name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl bg-[#faf7f0] text-[#556353] hover:text-black flex items-center justify-center cursor-pointer">✕</button>
            </div>

            {selected.profile_pic_url && (
              <img src={selected.profile_pic_url} alt={selected.name} className="mb-3 h-48 w-full rounded-2xl object-cover border border-[#dfe6d9]" />
            )}

            {selected.background_pic_urls?.length ? (
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {selected.background_pic_urls.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover border border-[#dfe6d9]" />
                ))}
              </div>
            ) : null}

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Grower / Merchant</dt><dd className="font-bold text-[var(--foreground)]">{selected.merchant_name}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Produce Category</dt><dd className="font-semibold text-[var(--foreground)]">{selected.category_name || "Vegetables"}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]">
                <dt className="text-[#7d8b79]">Marketplace Price</dt>
                <dd className="font-extrabold text-[var(--foreground)]">
                  {Math.round(Number(selected.price)).toLocaleString()} KHR
                  {selected.compare_price ? <span className="ml-2 text-[#9ca69a] line-through font-normal">{Math.round(Number(selected.compare_price)).toLocaleString()} KHR</span> : null}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Stock On Hand</dt><dd className="font-bold text-[var(--foreground)]">{selected.stock_quantity} {selected.unit}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Organic Verified</dt><dd className="font-bold text-[var(--leaf-dark)]">{selected.is_organic ? "Yes (Certified)" : "Standard"}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Listing Status</dt><dd className="font-bold text-[var(--foreground)]">{selected.is_active ? "Active" : "Inactive"}</dd></div>
              <div className="flex justify-between py-1 border-b border-[#f2f4ef]"><dt className="text-[#7d8b79]">Harvest Date</dt><dd className="font-medium text-[var(--foreground)]">{selected.harvest_date || "—"}</dd></div>
              <div className="flex justify-between py-1"><dt className="text-[#7d8b79]">Created</dt><dd className="font-medium text-[var(--foreground)]">{new Date(selected.created_at).toLocaleDateString()}</dd></div>
            </dl>

            {selected.description && <p className="mt-4 text-xs text-[#556353] leading-relaxed bg-[#fafbf9] p-3 rounded-xl border border-[#dfe6d9]">{selected.description}</p>}

            <div className="mt-6 flex gap-3 border-t border-[#f2f4ef] pt-4">
              <button
                onClick={() => toggleActive(selected)}
                disabled={actionLoadingId === selected.id}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 transition-colors cursor-pointer ${selected.is_active ? "bg-amber-600 hover:bg-amber-700" : "bg-[var(--leaf)] hover:bg-[var(--leaf-dark)]"}`}
              >
                {selected.is_active ? "Deactivate Listing" : "Activate Listing"}
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={actionLoadingId === selected.id}
                className="rounded-xl bg-[#fee2e2] px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Delete Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}