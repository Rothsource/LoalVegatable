"use client";

import { useEffect, useMemo, useState } from "react";
import { formatKHR } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import type { MerchantProduct } from "@/types/delivery";

export default function DistributorProductsPage() {
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<"All" | "Available" | "Out">("All");

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      setLoading(true);
      setError("");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) { setError("Sign in again to view merchant products."); setLoading(false); }
        return;
      }

      const profileResult = await supabase
        .from("profile_distributors")
        .select("merchant_id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profileResult.error || !profileResult.data?.merchant_id) {
        if (active) {
          setError(profileResult.error?.message || "This distributor is not linked to a merchant.");
          setLoading(false);
        }
        return;
      }

      const result = await supabase
        .from("products")
        .select("id, name, description, price, unit, stock_quantity, profile_pic_url, is_active")
        .eq("merchant_id", profileResult.data.merchant_id)
        .eq("is_active", true)
        .order("name");

      if (!active) return;
      if (result.error) {
        setError(result.error.message);
      } else {
        setProducts((result.data ?? []).map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          price: Number(product.price) || 0,
          unit: product.unit ?? "units",
          stock: Number(product.stock_quantity) || 0,
          imageUrl: product.profile_pic_url ?? "",
          active: Boolean(product.is_active),
        })));
      }
      setLoading(false);
    }
    void loadProducts();
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) =>
      (availability === "All" || (availability === "Available" ? product.stock > 0 : product.stock === 0)) &&
      (!query || product.name.toLowerCase().includes(query) || product.description.toLowerCase().includes(query))
    );
  }, [availability, products, search]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6">
      <section className="rounded-3xl bg-gradient-to-br from-green-900 to-emerald-700 px-6 py-7 text-white shadow-lg sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">Merchant catalog</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Available products</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-green-100">Check live availability before confirming or preparing an order.</p>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[{ label: "Listed", value: products.length }, { label: "Available", value: products.filter((product) => product.stock > 0).length }, { label: "Out of stock", value: products.filter((product) => product.stock === 0).length }].map((item) => <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-gray-400">{item.label}</p><p className="mt-1 text-2xl font-black text-gray-900">{item.value}</p></div>)}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          {(["All", "Available", "Out"] as const).map((item) => <button key={item} type="button" onClick={() => setAvailability(item)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-black sm:flex-none ${availability === item ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>{item === "Out" ? "Out of stock" : item}</button>)}
        </div>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products…" aria-label="Search merchant products"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 sm:max-w-sm" />
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <p className="font-black">The merchant catalog is not available yet</p>
          <p className="mt-1 leading-6">The product service or its distributor permissions are not ready. Contact the merchant if this continues.</p>
          <details className="mt-2 text-xs"><summary className="cursor-pointer font-black">Technical details</summary><p className="mt-1 break-words font-mono">{error}</p></details>
        </div>
      )}

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading products">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white shadow-sm" />)}</div>
      ) : !error && visible.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-gray-100 bg-white px-6 py-20 text-center shadow-sm">
          <p className="font-black text-gray-700">No products found</p>
          <p className="mt-1 text-sm text-gray-400">The merchant has no matching active products.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex h-36 items-center justify-center bg-green-50">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : <span className="text-3xl font-black text-green-300">{product.name.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h2 className="truncate font-black text-gray-900">{product.name}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{product.description || "No description"}</p></div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${product.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {product.stock > 0 ? "Available" : "Out of stock"}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
                  <p className="font-black text-green-700">{formatKHR(product.price)} <span className="text-xs font-semibold text-gray-400">/ {product.unit}</span></p>
                  <p className="text-xs font-bold text-gray-500">{product.stock} {product.unit}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
