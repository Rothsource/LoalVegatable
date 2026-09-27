// merchant/app/distributors/products/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Store, Search, Plus, Minus, Check, AlertCircle, 
  RotateCcw, Sparkles, RefreshCw, Box
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DistributorSpinner, ProductRowSkeleton } from "@/components/distributors/DistributorUI";

type Product = {
  id: string;
  name: string;
  unit: string;
  stock_quantity: number;
  profile_pic_url: string | null;
  is_active: boolean;
};

export default function DistributorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock">("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }

    const { data: dist, error: distError } = await supabase
      .from("profile_distributors")
      .select("merchant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (distError || !dist) {
      setError("Distributor profile not found.");
      setLoading(false);
      return;
    }

    const { data, error: prodError } = await supabase
      .from("products")
      .select("id, name, unit, stock_quantity, profile_pic_url, is_active")
      .eq("merchant_id", dist.merchant_id)
      .order("name");

    if (prodError) setError(prodError.message);
    setProducts(data ?? []);
    setLoading(false);
  }

  async function saveStock(id: string) {
    const raw = edits[id];
    if (raw === undefined) return;
    const value = Number(raw);
    if (isNaN(value) || value < 0) {
      alert("Please enter a valid positive stock number.");
      return;
    }

    setSavingId(id);
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: value })
      .eq("id", id);
    setSavingId(null);

    if (updateError) {
      alert("Could not update stock: " + updateError.message);
      return;
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_quantity: value } : p))
    );
    setEdits((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });

    setSavedSuccessId(id);
    setTimeout(() => {
      setSavedSuccessId((curr) => (curr === id ? null : curr));
    }, 2000);
  }

  const handleStep = (id: string, currentVal: number, delta: number) => {
    const currentEdit = edits[id] !== undefined ? Number(edits[id]) : currentVal;
    const nextVal = Math.max(0, currentEdit + delta);
    setEdits((prev) => ({ ...prev, [id]: String(nextVal) }));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase().trim());
      const currentQty = edits[p.id] !== undefined ? Number(edits[p.id]) : p.stock_quantity;
      if (stockFilter === "in_stock") return matchesSearch && currentQty > 5;
      if (stockFilter === "low_stock") return matchesSearch && currentQty <= 5;
      return matchesSearch;
    });
  }, [products, search, edits, stockFilter]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-2 border-b border-[#dfe6d9] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182216] tracking-tight">
          Vegetable Stock Counter
        </h1>
        <p className="text-sm font-medium text-[#52604f]">
          Check items in warehouse and tap <span className="font-bold text-[#0DB30D]">+</span> or <span className="font-bold text-[#c53929]">-</span> to adjust inventory quickly.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#eedbd7] bg-[#fff5f4] p-4 text-sm font-bold text-[#c53929]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c9b88]" />
          <input
            type="text"
            placeholder="Search vegetable by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#dfe6d9] bg-white pl-10 pr-4 py-3 text-sm font-bold text-[#182216] placeholder-[#8c9b88] shadow-sm outline-none focus:border-[#0DB30D] transition-all"
          />
        </div>

        <div className="flex gap-2">
          {[
            { id: "all", label: "All Items" },
            { id: "in_stock", label: "In Stock" },
            { id: "low_stock", label: "Low / Out (<5)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStockFilter(tab.id as any)}
              className={`rounded-2xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 ${
                stockFilter === tab.id
                  ? "bg-[#2E6F40] text-white shadow-sm"
                  : "bg-white border border-[#dfe6d9] text-[#52604f] hover:bg-[#edf3ea]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products List ── */}
      {loading ? (
        <div className="py-6 space-y-4">
          <div className="flex justify-center">
            <DistributorSpinner size={42} label="Loading merchant stock…" />
          </div>
          <ProductRowSkeleton />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-[28px] border-2 border-dashed border-[#dfe6d9] bg-white/70 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf4e7] text-[#0DB30D] mb-4">
            <Store size={30} />
          </div>
          <h3 className="text-xl font-extrabold text-[#182216]">No Vegetables Found</h3>
          <p className="mt-1 text-sm text-[#52604f]">
            {search ? `No results match "${search}". Try clearing search.` : "No produce assigned to your partner merchant yet."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 rounded-xl bg-[#2E6F40] px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredProducts.map((p) => {
            const hasChange = edits[p.id] !== undefined;
            const displayQty = hasChange ? Number(edits[p.id]) : p.stock_quantity;
            const isSaving = savingId === p.id;
            const isSaved = savedSuccessId === p.id;

            // Stock badge status
            const isLow = displayQty <= 5 && displayQty > 0;
            const isOut = displayQty === 0;

            return (
              <div
                key={p.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 p-4 sm:p-5 bg-white shadow-sm transition-all ${
                  hasChange
                    ? "border-[#0DB30D] ring-2 ring-[#0DB30D]/15"
                    : "border-[#e2e8dd] hover:border-[#ccd7c7]"
                }`}
              >
                {/* Left: Product Thumbnail & Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {p.profile_pic_url ? (
                    <img
                      src={p.profile_pic_url}
                      alt={p.name}
                      className="h-16 w-16 rounded-2xl object-cover border border-[#edf1ea] shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ec] text-[#2E6F40] border border-[#d6e5d3] flex-shrink-0">
                      <Box size={26} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-[#182216] truncate">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-[#647060]">
                        Unit: {p.unit}
                      </span>
                      {isOut ? (
                        <span className="rounded-full bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 text-[10px] font-black uppercase text-[#dc2626]">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="rounded-full bg-[#fffbeb] border border-[#fde68a] px-2 py-0.5 text-[10px] font-black uppercase text-[#b45309]">
                          Low Stock ({displayQty})
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 text-[10px] font-black uppercase text-[#047857]">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Big Stepper Controls + Save Button */}
                <div className="flex items-center gap-2.5 sm:self-center self-end">
                  {/* Stepper: Minus, Input, Plus */}
                  <div className="flex items-center rounded-2xl border-2 border-[#dfe6d9] bg-[#f9faf8] p-1">
                    <button
                      type="button"
                      onClick={() => handleStep(p.id, p.stock_quantity, -1)}
                      disabled={displayQty <= 0}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#182216] shadow-sm hover:bg-[#edf3ea] disabled:opacity-30 active:scale-95 transition-all"
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>

                    <input
                      type="number"
                      min={0}
                      value={edits[p.id] ?? p.stock_quantity}
                      onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-16 text-center font-black text-base text-[#182216] bg-transparent outline-none py-1"
                    />

                    <button
                      type="button"
                      onClick={() => handleStep(p.id, p.stock_quantity, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0DB30D] text-white shadow-sm hover:bg-[#0A490A] active:scale-95 transition-all"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Save Stock Button */}
                  <button
                    onClick={() => saveStock(p.id)}
                    disabled={isSaving || !hasChange}
                    className={`flex items-center gap-1.5 rounded-2xl px-5 py-3 text-xs font-black transition-all shadow-sm active:scale-95 ${
                      isSaved
                        ? "bg-[#0A490A] text-white"
                        : hasChange
                        ? "bg-[#0DB30D] text-white hover:bg-[#0A490A] animate-pulse"
                        : "bg-[#e8eee4] text-[#8c9b88] cursor-not-allowed"
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : isSaved ? (
                      <>
                        <Check size={14} strokeWidth={3} />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}