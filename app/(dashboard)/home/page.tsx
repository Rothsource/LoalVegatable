"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDashboard } from "@/lib/dashboardContext";
import { supabase } from "@/lib/supabase";

type Filter = "day" | "week" | "month";

const STATS: Record<Filter, { revenue: string; orders: number; sold: number; customers: number; revenueData: number[] }> = {
  day:   { revenue: "$124.50",   orders: 8,   sold: 34,  customers: 7,   revenueData: [20, 45, 30, 60, 38, 55, 124]             },
  week:  { revenue: "$872.00",   orders: 53,  sold: 210, customers: 41,  revenueData: [210, 340, 280, 420, 390, 520, 872]        },
  month: { revenue: "$3,410.00", orders: 198, sold: 847, customers: 132, revenueData: [1200, 1800, 2100, 1600, 2400, 2900, 3410] },
};

const WEEK_LABELS: Record<Filter, string[]> = {
  day:   ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
  week:  ["W1",  "W2",  "W3",  "W4",  "W5",  "W6",  "This" ],
  month: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "This"  ],
};

const RECENT_ORDERS = [
  { id: "#0041", customer: "Sophea K.", items: "Tomatoes x3, Morning Glory x2", total: "$9.00",  status: "Delivered", time: "2h ago"    },
  { id: "#0040", customer: "Dara M.",   items: "Spinach x2, Tomatoes x1",       total: "$5.60",  status: "Pending",   time: "4h ago"    },
  { id: "#0039", customer: "Bopha S.",  items: "Morning Glory x4",              total: "$6.00",  status: "Preparing", time: "5h ago"    },
  { id: "#0038", customer: "Vanna T.",  items: "Tomatoes x5, Spinach x1",       total: "$11.80", status: "Delivered", time: "Yesterday" },
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
  if (stock === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-600 border border-red-100" };
  if (stock <= 10) return { label: "Low Stock",    cls: "bg-amber-50 text-amber-600 border border-amber-100" };
  return             { label: "In Stock",      cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" };
}

function orderBadge(status: string) {
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "Pending")   return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
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

  return (
    <div className={`min-h-screen bg-[#f5f9f3] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-6 pb-20">

        {/* HERO */}
        <section className="relative rounded-3xl overflow-hidden h-56 sm:h-64 shadow-md">
          <Image src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1400&h=600&fit=crop" alt="Fresh vegetables" fill className="object-cover scale-105" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-900/60 to-transparent" />
          <div className={`absolute inset-0 flex flex-col justify-center px-8 sm:px-12 transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
            <p className="text-green-300 text-xs font-semibold tracking-widest uppercase mb-2">{greeting}</p>
            <h1 className="text-white text-2xl sm:text-3xl font-black leading-tight">{merchantName}&apos;s Fresh Market</h1>
            <div className="flex gap-3 mt-5 flex-wrap">
              <Link href="/product" className="px-5 py-2.5 bg-white text-green-800 rounded-xl text-sm font-bold hover:bg-green-50 transition shadow-sm">+ Add Product</Link>
              <Link href="/order" className="px-5 py-2.5 bg-white/15 backdrop-blur text-white border border-white/25 rounded-xl text-sm font-semibold hover:bg-white/25 transition">View Orders</Link>
            </div>
          </div>
        </section>

        {/* STATS + CHART */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Sales Overview</h2>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden text-xs font-bold shadow-sm">
              {(["day", "week", "month"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 transition capitalize ${filter === f ? "bg-green-600 text-white" : "text-gray-400 hover:bg-gray-50"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Revenue",    value: stats.revenue,           accent: "text-green-600",  bg: "bg-green-100"  },
              { label: "Orders",     value: String(stats.orders),    accent: "text-blue-600",   bg: "bg-blue-100"   },
              { label: "Items Sold", value: String(stats.sold),      accent: "text-violet-600", bg: "bg-violet-100" },
              { label: "Customers",  value: String(stats.customers), accent: "text-orange-500", bg: "bg-orange-100" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-8 h-1.5 ${s.bg} rounded-full mb-3`} />
                <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                <p className={`text-2xl font-black mt-0.5 ${s.accent}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-700 mb-1">Revenue Trend</p>
            <p className="text-xs text-gray-400 mb-4">Last 7 {filter === "day" ? "days" : filter === "week" ? "weeks" : "months"}</p>
            <div key={filter} className="flex items-end gap-1.5 sm:gap-2" style={{ height: "120px" }}>
              {chart.map((val, i) => {
                const pct  = chartMax > 0 ? Math.round((val / chartMax) * 100) : 0;
                const last = i === chart.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="w-full flex items-end" style={{ height: "96px" }}>
                      <div className={`w-full rounded-t-lg transition-all duration-300 ${last ? "bg-green-500" : "bg-green-100 group-hover:bg-green-200"}`} style={{ height: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{WEEK_LABELS[filter][i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RECENT ORDERS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Recent Orders</h2>
            <Link href="/order" className="text-xs text-green-600 font-bold hover:underline">View all</Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {RECENT_ORDERS.map((o, i) => (
              <div key={o.id} className={`px-4 py-3.5 hover:bg-green-50/50 transition ${i < RECENT_ORDERS.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-gray-400">{o.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${orderBadge(o.status)}`}>{o.status}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{o.customer}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{o.items}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-gray-900">{o.total}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{o.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCTS ON SALE */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Products on Sale</h2>
            <Link href="/product" className="text-xs text-green-600 font-bold hover:underline">Manage all</Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading products...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-400">No products yet.</p>
              <Link href="/product" className="mt-3 inline-block text-sm text-green-600 font-bold hover:underline">Add your first product</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.map((p) => {
                const { label, cls } = stockStatus(p.stock_quantity);
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      {p.profile_pic_url ? (
                        <img src={p.profile_pic_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
                      )}
                      <span className={`absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${cls}`}>{label}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-base font-bold text-gray-800">{p.name}</p>
                      <p className="text-green-600 font-black text-sm">${p.price}/{p.unit}</p>
                      <div className="flex items-center justify-between mt-3 gap-2">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveStock(p.id)}
                              className="w-16 border border-green-400 rounded-lg px-2 py-1 text-xs text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-green-400" autoFocus />
                            <button onClick={() => saveStock(p.id)} className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition font-bold">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600 transition">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs text-gray-500">Stock: <span className="font-bold text-gray-700">{p.stock_quantity}</span></span>
                            <button onClick={() => { setEditingId(p.id); setEditVal(String(p.stock_quantity)); }}
                              className="text-xs text-gray-500 hover:text-green-700 border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-lg px-3 py-1 transition font-semibold">
                              Edit Stock
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
