"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";

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

const PRODUCTS = [
  { id: 1, name: "Tomatoes",      khmer: "ប៉េងប៉ោះ",     img: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=400&h=300&fit=crop", price: "$2.00/kg",    stock: 25 },
  { id: 2, name: "Morning Glory", khmer: "ត្រកួន",        img: "https://images.unsplash.com/photo-1637858868799-7f26a0640eb6?w=400&h=300&fit=crop", price: "$1.50/bunch", stock: 8  },
  { id: 3, name: "Spinach",       khmer: "បន្លែបៃតង",    img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop", price: "$1.80/bag",   stock: 0  },
];

const SOLD: Record<Filter, { id: number; qty: number; revenue: string }[]> = {
  day:   [{ id: 1, qty: 8,   revenue: "$16.00"  }, { id: 2, qty: 12,  revenue: "$18.00"  }, { id: 3, qty: 5,   revenue: "$9.00"   }],
  week:  [{ id: 1, qty: 54,  revenue: "$108.00" }, { id: 2, qty: 80,  revenue: "$120.00" }, { id: 3, qty: 32,  revenue: "$57.60"  }],
  month: [{ id: 1, qty: 215, revenue: "$430.00" }, { id: 2, qty: 310, revenue: "$465.00" }, { id: 3, qty: 128, revenue: "$230.40" }],
};

const RECENT_ORDERS = [
  { id: "#0041", customer: "Sophea K.", items: "Tomatoes x3, Morning Glory x2", total: "$9.00",  status: "Delivered", time: "2h ago"    },
  { id: "#0040", customer: "Dara M.",   items: "Spinach x2, Tomatoes x1",       total: "$5.60",  status: "Pending",   time: "4h ago"    },
  { id: "#0039", customer: "Bopha S.",  items: "Morning Glory x4",              total: "$6.00",  status: "Preparing", time: "5h ago"    },
  { id: "#0038", customer: "Vanna T.",  items: "Tomatoes x5, Spinach x1",       total: "$11.80", status: "Delivered", time: "Yesterday" },
];

function stockStatus(stock: number) {
  if (stock === 0)  return { label: "Out of stock", cls: "bg-red-50 text-red-600 border border-red-100"         };
  if (stock <= 10)  return { label: "Low stock",    cls: "bg-amber-50 text-amber-600 border border-amber-100"   };
  return              { label: "In stock",          cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" };
}

function orderBadge(status: string) {
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "Pending")   return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17)            return "Good evening";
  return "Good morning";
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [filter, setFilter]   = useState<Filter>("week");
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");

  // only run on client — fixes the hydration mismatch
  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());
  }, []);

  const stats    = STATS[filter];
  const soldData = SOLD[filter];
  const chart    = stats.revenueData;
  const chartMax = Math.max(...chart);
  const lowStock = PRODUCTS.filter((p) => p.stock <= 10);
  const getProduct = (id: number) => PRODUCTS.find((p) => p.id === id)!;
  const maxQty = Math.max(...soldData.map((s) => s.qty));

  return (
    <div
      className="min-h-screen bg-[#f5f9f3]"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}
    >
      <Header lowStock={lowStock} merchantName="Dara" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-6 pb-20">

        {/* HERO */}
        <section className="relative rounded-3xl overflow-hidden h-56 sm:h-64 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1400&h=600&fit=crop"
            alt="Fresh vegetables"
            className="absolute inset-0 w-full h-full object-cover scale-105"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/85 via-green-900/60 to-transparent" />

          {/* only render greeting + animation after mount to prevent hydration mismatch */}
          {mounted && (
            <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-green-300 text-xs font-semibold tracking-widest uppercase mb-2">
                {greeting}
              </p>
              <h1 className="text-white text-2xl sm:text-3xl font-black leading-tight">
                Dara&apos;s Fresh Market
              </h1>
              <p className="text-green-200/80 text-sm mt-1 font-medium">
                Phnom Penh · Green Farm Community
              </p>
              <div className="flex gap-3 mt-5 flex-wrap">
                <Link href="/product"
                  className="px-5 py-2.5 bg-white text-green-800 rounded-xl text-sm font-bold hover:bg-green-50 transition shadow-sm">
                  Manage products
                </Link>
                <Link href="/orders"
                  className="px-5 py-2.5 bg-white/15 backdrop-blur text-white border border-white/25 rounded-xl text-sm font-semibold hover:bg-white/25 transition">
                  View orders
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* STATS + CHART */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sales overview</h2>
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden text-xs font-bold shadow-sm">
              {(["day", "week", "month"] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 transition capitalize ${
                    filter === f ? "bg-green-600 text-white" : "text-gray-400 hover:bg-gray-50"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Revenue",    value: stats.revenue,           color: "text-green-600" },
              { label: "Orders",     value: String(stats.orders),    color: "text-gray-900"  },
              { label: "Items sold", value: String(stats.sold),      color: "text-gray-900"  },
              { label: "Customers",  value: String(stats.customers), color: "text-gray-900"  },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-bold text-gray-700 mb-1">Revenue trend</p>
            <p className="text-xs text-gray-400 mb-4">
              Last 7 {filter === "day" ? "days" : filter === "week" ? "weeks" : "months"}
            </p>
            <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: "120px" }}>
              {chart.map((val, i) => {
                const pct  = chartMax > 0 ? Math.round((val / chartMax) * 100) : 0;
                const last = i === chart.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex items-end" style={{ height: "96px" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          last ? "bg-green-500" : "bg-green-100 group-hover:bg-green-200"
                        }`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {WEEK_LABELS[filter][i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SOLD + RECENT ORDERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Products sold</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {soldData.map((s, i) => {
                const p = getProduct(s.id);
                return (
                  <div key={p.id}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-green-50/50 transition ${
                      i < soldData.length - 1 ? "border-b border-gray-50" : ""
                    }`}>
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400"
                          style={{ fontFamily: "'Noto Sans Khmer', 'Khmer OS', sans-serif" }}>
                          {p.khmer}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                          <div className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${Math.round((s.qty / maxQty) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{s.qty} sold</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-green-600 flex-shrink-0">{s.revenue}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent orders</h2>
              <Link href="/orders" className="text-xs text-green-600 font-bold hover:underline">View all</Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id}
                  className={`px-4 py-3.5 hover:bg-green-50/50 transition ${
                    i < RECENT_ORDERS.length - 1 ? "border-b border-gray-50" : ""
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black text-gray-400">{o.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${orderBadge(o.status)}`}>
                          {o.status}
                        </span>
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
        </div>

        {/* PRODUCTS ON SALE */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Products on sale</h2>
            <Link href="/product" className="text-xs text-green-600 font-bold hover:underline">Manage all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRODUCTS.map((p) => {
              const { label, cls } = stockStatus(p.stock);
              return (
                <div key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="relative h-40 overflow-hidden bg-gray-100">
                    <img src={p.img} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy" />
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${cls}`}>
                      {label}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <p className="text-base font-bold text-gray-800">{p.name}</p>
                      <p className="text-sm text-gray-400 font-medium"
                        style={{ fontFamily: "'Noto Sans Khmer', 'Khmer OS', sans-serif" }}>
                        {p.khmer}
                      </p>
                    </div>
                    <p className="text-green-600 font-black text-sm">{p.price}</p>
                    <div className="flex items-center justify-between mt-3 gap-2">
                      <span className="text-xs text-gray-500">
                        Stock: <span className={`font-bold ${p.stock === 0 ? "text-red-500" : p.stock <= 10 ? "text-amber-500" : "text-gray-700"}`}>
                          {p.stock}
                        </span>
                      </span>
                      <Link href="/product"
                        className="text-xs text-gray-500 hover:text-green-700 border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-lg px-3 py-1 transition font-semibold">
                        Manage →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
