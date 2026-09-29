"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDashboard } from "@/lib/dashboardContext";
import { supabase } from "@/lib/supabase";

type Filter = "day" | "week" | "month";

type FilterStats = {
  revenue: string;
  revenueNumber: number;
  orders: number;
  sold: number;
  customers: number;
  revenueData: number[];
  labels: string[];
};

type RecentOrder = {
  id: string;
  fullId: string;
  customer: string;
  items: string;
  total: string;
  totalNumber: number;
  status: string;
  rawStatus: string;
  time: string;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock_quantity: number;
  profile_pic_url: string;
  is_active: boolean;
};

type DashboardData = {
  stats: Record<Filter, FilterStats> & {
    allTime: { revenue: string; revenueNumber: number; orders: number; sold: number; customers: number };
  };
  recentOrders: RecentOrder[];
  products: Product[];
  lowStockProducts: Product[];
  allProductsCount: number;
};

const EMPTY_FILTER_STATS: FilterStats = {
  revenue: "0 KHR",
  revenueNumber: 0,
  orders: 0,
  sold: 0,
  customers: 0,
  revenueData: [0, 0, 0, 0, 0, 0, 0],
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
};

const DEFAULT_DATA: DashboardData = {
  stats: {
    day: EMPTY_FILTER_STATS,
    week: { ...EMPTY_FILTER_STATS, labels: ["W1", "W2", "W3", "W4", "W5", "W6", "This"] },
    month: { ...EMPTY_FILTER_STATS, labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "This"] },
    allTime: { revenue: "0 KHR", revenueNumber: 0, orders: 0, sold: 0, customers: 0 },
  },
  recentOrders: [],
  products: [],
  lowStockProducts: [],
  allProductsCount: 0,
};

function stockStatus(stock: number) {
  if (stock === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-700 border border-red-200" };
  if (stock <= 10) return { label: "Low Stock", cls: "bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]" };
  return { label: "In Stock", cls: "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]" };
}

function orderBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("delivered")) return "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]";
  if (s.includes("pending")) return "bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]";
  if (s.includes("preparing") || s.includes("accepted")) return "bg-[#eaf4fe] text-[#1e5fa0] border border-[#bcdbfc]";
  if (s.includes("delivery")) return "bg-[#f2ebfd] text-[#5b21b6] border border-[#ddd6fe]";
  if (s.includes("cancel")) return "bg-red-50 text-red-700 border border-red-200";
  return "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]";
}

export default function HomePage() {
  const { merchantName } = useDashboard();
  const [filter, setFilter] = useState<Filter>("week");
  const [data, setData] = useState<DashboardData>(DEFAULT_DATA);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/merchant/dashboard?merchantId=${user.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17) setGreeting("Good evening");

    fetchDashboard();

    // Realtime sync for instant updates when orders or products change
    const channel = supabase
      .channel("merchant-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchDashboard())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboard]);

  const stats = data.stats[filter] || EMPTY_FILTER_STATS;
  const chart = stats.revenueData;
  const chartMax = Math.max(...chart, 1);
  const labels = stats.labels;
  const products = data.products;
  const lowStockProducts = data.lowStockProducts;
  const recentOrders = data.recentOrders;

  const saveStock = async (id: string) => {
    const val = parseInt(editVal);
    if (!isNaN(val) && val >= 0) {
      await supabase.from("products").update({ stock_quantity: val }).eq("id", id);
      setData((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === id ? { ...p, stock_quantity: val } : p)),
        lowStockProducts:
          val <= 10
            ? prev.lowStockProducts.some((p) => p.id === id)
              ? prev.lowStockProducts.map((p) => (p.id === id ? { ...p, stock_quantity: val } : p))
              : [...prev.lowStockProducts, { ...prev.products.find((p) => p.id === id)!, stock_quantity: val }]
            : prev.lowStockProducts.filter((p) => p.id !== id),
      }));
    }
    setEditingId(null);
  };

  return (
    <div className={`w-full transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-20">

        {/* HERO BANNER */}
        <section className="relative rounded-[28px] overflow-hidden h-56 sm:h-64 card-shadow border border-[#dfe6d9]">
          <Image
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1400&h=600&fit=crop"
            alt="Fresh vegetables"
            fill
            className="object-cover scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#172813]/90 via-[#23381d]/80 to-transparent" />
          <div
            className={`absolute inset-0 flex flex-col justify-center px-8 sm:px-12 transition-all duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <span className="text-[#9fe39a] text-[10px] font-extrabold tracking-[0.2em] uppercase mb-1.5">
              {greeting}, Grower
            </span>
            <h1 className="text-white text-2xl sm:text-4xl font-black leading-tight font-heading">
              {merchantName}&apos;s Harvest Market
            </h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-lg">
              Manage real-time produce stock, accept customer orders, and coordinate daily dispatches.
            </p>
            <div className="flex gap-3 mt-5 flex-wrap">
              <Link
                href="/product"
                className="px-5 py-2.5 bg-[var(--leaf-dark)] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[var(--leaf)] transition shadow-sm border border-[#2e6f40]"
              >
                + Add New Crop
              </Link>
              <Link
                href="/order"
                className="px-5 py-2.5 bg-white/15 backdrop-blur text-white border border-white/25 rounded-xl text-xs sm:text-sm font-bold hover:bg-white/25 transition"
              >
                View Customer Orders
              </Link>
            </div>
          </div>
        </section>

        {/* FULL-WIDTH RESPONSIVE 2-COLUMN GRID */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">

          {/* LEFT PRIMARY COLUMN (7 Cols): Sales Overview & Produce Catalog */}
          <div className="lg:col-span-7 space-y-8">

            {/* SALES OVERVIEW */}
            <section className="bg-white rounded-[24px] p-6 border border-[#dfe6d9] card-shadow">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)] mb-1">
                    Financial Insights
                  </p>
                  <h2 className="text-lg font-black text-[var(--foreground)] font-heading">Sales & Revenue Metrics</h2>
                  <p className="text-xs text-[#556353] mt-0.5">Overview of customer checkouts and produce volume in KHR</p>
                </div>
                <div className="flex bg-[#faf7f0] border border-[#dfe6d9] rounded-xl overflow-hidden text-xs font-bold p-0.5">
                  {(["day", "week", "month"] as Filter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer ${
                        filter === f
                          ? "bg-[var(--leaf-dark)] text-white shadow-2xs"
                          : "text-[#667262] hover:bg-white"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  {
                    label: "Revenue",
                    value: stats.revenue,
                    accent: "text-[var(--leaf-dark)]",
                    bg: "bg-[#0DB30D]",
                  },
                  {
                    label: "Orders",
                    value: String(stats.orders),
                    accent: "text-[#1e5fa0]",
                    bg: "bg-blue-500",
                  },
                  {
                    label: "Items Sold",
                    value: String(stats.sold),
                    accent: "text-[#2E6F40]",
                    bg: "bg-[#2E6F40]",
                  },
                  {
                    label: "Customers",
                    value: String(stats.customers),
                    accent: "text-[#b96a1d]",
                    bg: "bg-amber-500",
                  },
                ].map((s) => (
                  <div key={s.label} className="bg-[#fafbf9] rounded-2xl p-4 border border-[#dfe6d9]/80 shadow-2xs">
                    <div className={`w-6 h-1.5 ${s.bg} rounded-full mb-2.5`} />
                    <p className="text-[10px] text-[#7d8b79] font-extrabold uppercase tracking-wider">{s.label}</p>
                    <p className={`text-base sm:text-lg font-black mt-1 font-heading leading-tight ${s.accent}`}>
                      {loading ? "..." : s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Revenue Trend Chart */}
              <div className="rounded-2xl border border-[#dfe6d9]/80 bg-[#fbf8f2]/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--foreground)]">Revenue Trend (KHR)</span>
                  <span className="text-[10px] text-[#7d8b79] font-semibold">
                    {filter === "day" ? "Last 7 days" : filter === "week" ? "Last 7 weeks" : "Last 7 months"}
                  </span>
                </div>
                <div key={filter} className="flex items-end gap-2 sm:gap-3" style={{ height: "130px" }}>
                  {chart.map((val, i) => {
                    const pct = chartMax > 0 ? Math.round((val / chartMax) * 100) : 0;
                    const last = i === chart.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                        <span className="text-[9px] font-extrabold text-[var(--leaf-dark)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {val.toLocaleString()} KHR
                        </span>
                        <div className="w-full flex items-end" style={{ height: "85px" }}>
                          <div
                            className={`w-full rounded-t-lg transition-all duration-300 ${
                              last ? "bg-[var(--leaf-dark)] shadow-xs" : "bg-[#c8dfc5] group-hover:bg-[var(--leaf-dark)]"
                            }`}
                            style={{ height: `${val > 0 ? Math.max(pct, 10) : 4}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#7d8b79] font-bold">{labels[i] || ""}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* PRODUCE INVENTORY MANAGER */}
            <section className="bg-white rounded-[24px] p-6 border border-[#dfe6d9] card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)] mb-1">
                    Live Inventory
                  </p>
                  <h2 className="text-lg font-black text-[var(--foreground)] font-heading">Produce on Sale</h2>
                  <p className="text-xs text-[#556353] mt-0.5">Quick stock quantity management and availability</p>
                </div>
                <Link href="/product" className="text-xs text-[var(--leaf-accent)] font-bold hover:underline">
                  Manage Full Catalog ({data.allProductsCount}) →
                </Link>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
                  <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">
                    Loading farm products…
                  </span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-10 bg-[#fafbf9] rounded-2xl border border-[#dfe6d9]">
                  <p className="text-xs text-[#7d8b79]">No harvest produce listed yet.</p>
                  <Link href="/product" className="mt-2 inline-block text-xs text-[var(--leaf)] font-bold hover:underline">
                    + Add your first vegetable
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((p) => {
                    const { label, cls } = stockStatus(p.stock_quantity);
                    return (
                      <div
                        key={p.id}
                        className="bg-[#fafbf9] rounded-2xl border border-[#dfe6d9] p-3.5 card-lift group flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[#eaf0e6] border border-[#dfe6d9]">
                            {p.profile_pic_url ? (
                              <img
                                src={p.profile_pic_url}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9ca69a] text-xs">
                                🥬
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--foreground)] truncate">{p.name}</p>
                            <p className="text-xs font-black text-[var(--leaf-dark)] mt-0.5">
                              {Number(p.price).toLocaleString()} KHR / {p.unit}
                            </p>
                            <span className={`inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${cls}`}>
                              {label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-[#dfe6d9]/60 flex items-center justify-between text-xs">
                          {editingId === p.id ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="number"
                                value={editVal}
                                onChange={(e) => setEditVal(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && saveStock(p.id)}
                                className="w-16 border border-[var(--leaf)] rounded-lg px-2 py-1 text-xs text-[var(--foreground)] bg-white focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => saveStock(p.id)}
                                className="text-[11px] bg-[var(--leaf)] text-white px-2.5 py-1 rounded-lg hover:bg-[var(--leaf-dark)] transition font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-[11px] text-[#7d8b79] hover:text-[var(--foreground)] transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-[11px] text-[#556353]">
                                Available:{" "}
                                <strong className="text-[var(--foreground)]">
                                  {p.stock_quantity} {p.unit}
                                </strong>
                              </span>
                              <button
                                onClick={() => {
                                  setEditingId(p.id);
                                  setEditVal(String(p.stock_quantity));
                                }}
                                className="text-[10px] text-[var(--leaf-dark)] bg-white hover:bg-[#edf6e9] border border-[#dfe6d9] hover:border-[#c8dfc5] rounded-lg px-2.5 py-1 transition font-bold cursor-pointer"
                              >
                                Edit Units
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN (5 Cols): Inventory Alerts & Recent Orders */}
          <div className="lg:col-span-5 space-y-6">

            {/* CRITICAL LOW-STOCK ALERTS */}
            <section className="bg-white rounded-[24px] border border-[#dfe6d9] card-shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--foreground)] font-heading">
                  Inventory Alerts
                </h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]">
                  {lowStockProducts.length} Needs Restock
                </span>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="p-4 bg-[#edf6e9]/50 rounded-2xl border border-[#c8dfc5] text-center">
                  <p className="text-xs font-bold text-[var(--leaf-dark)]">All crop inventory levels healthy</p>
                  <p className="text-[11px] text-[#556353] mt-0.5">No critical shortages across active listings.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-[#dfe6d9] bg-[#fafbf9]">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{p.name}</p>
                        <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                          {p.stock_quantity === 0 ? "Out of stock!" : `Only ${p.stock_quantity} ${p.unit} left`}
                        </p>
                      </div>
                      <Link href="/product" className="shrink-0 text-[11px] font-bold text-[var(--leaf-accent)] hover:underline ml-2">
                        Restock →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* RECENT ORDERS FEED */}
            <section className="bg-white rounded-[24px] border border-[#dfe6d9] card-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--foreground)] font-heading">
                    Recent Customer Orders
                  </h3>
                  <p className="text-xs text-[#7d8b79] mt-0.5">Live transaction log in KHR</p>
                </div>
                <Link href="/order" className="text-xs text-[var(--leaf-accent)] font-bold hover:underline">
                  All Orders →
                </Link>
              </div>

              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
                  <span className="text-[11px] text-[#7d8b79]">Loading orders…</span>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="py-8 text-center bg-[#fafbf9] rounded-2xl border border-[#dfe6d9]">
                  <p className="text-xs text-[#7d8b79]">No customer orders received yet.</p>
                  <p className="text-[11px] text-[#9ca69a] mt-1">New incoming customer orders will appear here automatically.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#f2f4ef]">
                  {recentOrders.map((o) => (
                    <div
                      key={o.fullId || o.id}
                      className="py-3 first:pt-0 last:pb-0 hover:bg-[#fafbf9] transition-colors rounded-xl px-1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-black text-[#7d8b79]">{o.id}</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${orderBadge(o.status)}`}>
                              {o.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[var(--foreground)]">{o.customer}</p>
                          <p className="text-[11px] text-[#556353] truncate mt-0.5">{o.items}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-[var(--foreground)]">{o.total}</p>
                          <p className="text-[10px] text-[#9ca69a] mt-0.5">{o.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}