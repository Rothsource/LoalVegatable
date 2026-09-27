"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDashboard } from "@/lib/dashboardContext";
import { supabase } from "@/lib/supabase";

type Filter = "day" | "week" | "month";

const STATS: Record<Filter, { revenue: string; orders: number; sold: number; customers: number; revenueData: number[] }> = {
  day:   { revenue: "510,000 KHR",    orders: 8,   sold: 34,  customers: 7,   revenueData: [82000, 185000, 120000, 245000, 155000, 225000, 510000] },
  week:  { revenue: "3,575,000 KHR",  orders: 53,  sold: 210, customers: 41,  revenueData: [860000, 1390000, 1140000, 1720000, 1600000, 2130000, 3575000] },
  month: { revenue: "13,980,000 KHR", orders: 198, sold: 847, customers: 132, revenueData: [4900000, 7380000, 8610000, 6560000, 9840000, 11890000, 13980000] },
};

const WEEK_LABELS: Record<Filter, string[]> = {
  day:   ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
  week:  ["W1",  "W2",  "W3",  "W4",  "W5",  "W6",  "This" ],
  month: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "This"  ],
};

const RECENT_ORDERS = [
  { id: "#0041", customer: "Sophea K.", items: "Organic Bok Choy x3, Morning Glory x2", total: "36,000 KHR", status: "Delivered", time: "2h ago"  },
  { id: "#0040", customer: "Dara M.",   items: "Khmer Spinach x2, Farm Tomatoes x1",      total: "22,400 KHR", status: "Pending",   time: "4h ago"  },
  { id: "#0039", customer: "Bopha S.",  items: "Fresh Morning Glory x4",                 total: "24,000 KHR", status: "Preparing", time: "5h ago"  },
  { id: "#0038", customer: "Vanna T.",  items: "Hydroponic Lettuce x5, Spinach x1",       total: "47,200 KHR", status: "Delivered", time: "Yesterday" },
];

type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock_quantity: number;
  profile_pic_url: string;
  is_active: boolean;
};

function stockStatus(stock: number) {
  if (stock === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-700 border border-red-200" };
  if (stock <= 10) return { label: "Low Stock",    cls: "bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]" };
  return             { label: "In Stock",      cls: "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]" };
}

function orderBadge(status: string) {
  if (status === "Delivered") return "bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]";
  if (status === "Pending")   return "bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]";
  return "bg-[#eaf4fe] text-[#1e5fa0] border border-[#bcdbfc]";
}

export default function HomePage() {
  const { merchantName } = useDashboard();
  const [filter, setFilter]     = useState<Filter>("week");
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal]   = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [mounted, setMounted]   = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        setMounted(true);
        const hour = new Date().getHours();
        if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
        else if (hour >= 17) setGreeting("Good evening");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (active) setLoading(false); return; }
        const { data } = await supabase
          .from("products")
          .select("id, name, price, unit, stock_quantity, profile_pic_url, is_active")
          .eq("merchant_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6);
        if (active) { setProducts(data ?? []); setLoading(false); }
      })();
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  const stats    = STATS[filter];
  const chart    = stats.revenueData;
  const chartMax = Math.max(...chart);
  const saveStock = async (id: string) => {
    const val = parseInt(editVal);
    if (!isNaN(val) && val >= 0) {
      await supabase.from("products").update({ stock_quantity: val }).eq("id", id);
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stock_quantity: val } : p));
    }
    setEditingId(null);
  };

  const lowStockProducts = products.filter((p) => p.stock_quantity <= 10);

  return (
    <div className={`w-full transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-20">

        {/* HERO BANNER */}
        <section className="relative rounded-[28px] overflow-hidden h-56 sm:h-64 card-shadow border border-[#dfe6d9]">
          <Image src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1400&h=600&fit=crop" alt="Fresh vegetables" fill className="object-cover scale-105" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#172813]/90 via-[#23381d]/80 to-transparent" />
          <div className={`absolute inset-0 flex flex-col justify-center px-8 sm:px-12 transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
            <span className="text-[#9fe39a] text-[10px] font-extrabold tracking-[0.2em] uppercase mb-1.5">{greeting}, Grower</span>
            <h1 className="text-white text-2xl sm:text-4xl font-black leading-tight font-heading">{merchantName}&apos;s Harvest Market</h1>
            <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-lg">Manage real-time produce stock, accept customer orders, and coordinate daily dispatches.</p>
            <div className="flex gap-3 mt-5 flex-wrap">
              <Link href="/product" className="px-5 py-2.5 bg-[var(--leaf-dark)] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[var(--leaf)] transition shadow-sm border border-[#2e6f40]">+ Add New Crop</Link>
              <Link href="/order" className="px-5 py-2.5 bg-white/15 backdrop-blur text-white border border-white/25 rounded-xl text-xs sm:text-sm font-bold hover:bg-white/25 transition">View Customer Orders</Link>
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
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)] mb-1">Financial Insights</p>
                  <h2 className="text-lg font-black text-[var(--foreground)] font-heading">Sales & Revenue Metrics</h2>
                  <p className="text-xs text-[#556353] mt-0.5">Overview of customer checkouts and produce volume in KHR</p>
                </div>
                <div className="flex bg-[#faf7f0] border border-[#dfe6d9] rounded-xl overflow-hidden text-xs font-bold p-0.5">
                  {(["day", "week", "month"] as Filter[]).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer ${filter === f ? "bg-[var(--leaf-dark)] text-white shadow-2xs" : "text-[#667262] hover:bg-white"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Revenue",    value: stats.revenue,           accent: "text-[var(--leaf-dark)]",  bg: "bg-[#0DB30D]"  },
                  { label: "Orders",     value: String(stats.orders),    accent: "text-[#1e5fa0]",   bg: "bg-blue-500"   },
                  { label: "Items Sold", value: String(stats.sold),      accent: "text-[#2E6F40]",   bg: "bg-[#2E6F40]" },
                  { label: "Customers",  value: String(stats.customers), accent: "text-[#b96a1d]",   bg: "bg-amber-500" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#fafbf9] rounded-2xl p-4 border border-[#dfe6d9]/80 shadow-2xs">
                    <div className={`w-6 h-1.5 ${s.bg} rounded-full mb-2.5`} />
                    <p className="text-[10px] text-[#7d8b79] font-extrabold uppercase tracking-wider">{s.label}</p>
                    <p className={`text-base sm:text-lg font-black mt-1 font-heading leading-tight ${s.accent}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Revenue Trend Chart */}
              <div className="rounded-2xl border border-[#dfe6d9]/80 bg-[#fbf8f2]/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--foreground)]">Revenue Trend (KHR)</span>
                  <span className="text-[10px] text-[#7d8b79] font-semibold">Last 7 {filter === "day" ? "days" : filter === "week" ? "weeks" : "months"}</span>
                </div>
                <div key={filter} className="flex items-end gap-2 sm:gap-3" style={{ height: "130px" }}>
                  {chart.map((val, i) => {
                    const pct  = chartMax > 0 ? Math.round((val / chartMax) * 100) : 0;
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
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#7d8b79] font-bold">{WEEK_LABELS[filter][i]}</span>
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
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)] mb-1">Live Inventory</p>
                  <h2 className="text-lg font-black text-[var(--foreground)] font-heading">Produce on Sale</h2>
                  <p className="text-xs text-[#556353] mt-0.5">Quick stock quantity management and availability</p>
                </div>
                <Link href="/product" className="text-xs text-[var(--leaf-accent)] font-bold hover:underline">
                  Manage Full Catalog →
                </Link>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-3 border-[#dfe6d9] border-t-[var(--leaf)] animate-spin" />
                  <span className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">Loading farm products…</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-10 bg-[#fafbf9] rounded-2xl border border-[#dfe6d9]">
                  <p className="text-xs text-[#7d8b79]">No harvest produce listed yet.</p>
                  <Link href="/product" className="mt-2 inline-block text-xs text-[var(--leaf)] font-bold hover:underline">+ Add your first vegetable</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((p) => {
                    const { label, cls } = stockStatus(p.stock_quantity);
                    return (
                      <div key={p.id} className="bg-[#fafbf9] rounded-2xl border border-[#dfe6d9] p-3.5 card-lift group flex flex-col justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[#eaf0e6] border border-[#dfe6d9]">
                            {p.profile_pic_url ? (
                              <img src={p.profile_pic_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9ca69a] text-xs">🥬</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--foreground)] truncate">{p.name}</p>
                            <p className="text-xs font-black text-[var(--leaf-dark)] mt-0.5">{Number(p.price).toLocaleString()} KHR / {p.unit}</p>
                            <span className={`inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
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
                              <button onClick={() => saveStock(p.id)} className="text-[11px] bg-[var(--leaf)] text-white px-2.5 py-1 rounded-lg hover:bg-[var(--leaf-dark)] transition font-bold cursor-pointer">Save</button>
                              <button onClick={() => setEditingId(null)} className="text-[11px] text-[#7d8b79] hover:text-[var(--foreground)] transition cursor-pointer">Cancel</button>
                            </div>
                          ) : (
                            <>
                              <span className="text-[11px] text-[#556353]">
                                Available: <strong className="text-[var(--foreground)]">{p.stock_quantity} {p.unit}</strong>
                              </span>
                              <button
                                onClick={() => { setEditingId(p.id); setEditVal(String(p.stock_quantity)); }}
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

          {/* RIGHT COLUMN (5 Cols): Dispatch Beacon, Low Stock Alerts, Orders Stream, Checklist */}
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
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-[#dfe6d9] bg-[#fafbf9]">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{p.name}</p>
                        <p className="text-[10px] text-amber-700 font-bold mt-0.5">{p.stock_quantity === 0 ? "Out of stock!" : `Only ${p.stock_quantity} left`}</p>
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

              <div className="divide-y divide-[#f2f4ef]">
                {RECENT_ORDERS.map((o) => (
                  <div key={o.id} className="py-3 first:pt-0 last:pb-0 hover:bg-[#fafbf9] transition-colors rounded-xl px-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-black text-[#7d8b79]">{o.id}</span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${orderBadge(o.status)}`}>{o.status}</span>
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
            </section>



          </div>
        </div>
      </main>
    </div>
  );
}