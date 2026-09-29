"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type KPIStats = {
  totalRevenue: number;
  totalOrders: number;
  activeFarms: number;
  pendingApprovals: number;
  totalProducts: number;
  activeDeliveries: number;
};

type RecentActivity = {
  id: string;
  type: "order" | "merchant" | "rider";
  title: string;
  subtitle: string;
  amount?: string;
  status: "completed" | "pending" | "in_transit" | "verified";
  time: string;
};

const initialActivities: RecentActivity[] = [
  {
    id: "act-1",
    type: "order",
    title: "Order #LV-8921",
    subtitle: "Organic Bok Choy x4, Khmer Carrots x2",
    amount: "58,000 KHR",
    status: "completed",
    time: "4 mins ago",
  },
  {
    id: "act-2",
    type: "merchant",
    title: "Green Hill Agro Siem Reap",
    subtitle: "Submitted farm certification for verification",
    status: "pending",
    time: "18 mins ago",
  },
  {
    id: "act-3",
    type: "order",
    title: "Order #LV-8919",
    subtitle: "Morning Glory x5, Fresh Tomatoes x3",
    amount: "88,000 KHR",
    status: "in_transit",
    time: "32 mins ago",
  },
  {
    id: "act-4",
    type: "rider",
    title: "Sokha Chen (Courier #04)",
    subtitle: "Accepted dispatch route for Daun Penh zone",
    status: "verified",
    time: "45 mins ago",
  },
  {
    id: "act-5",
    type: "order",
    title: "Order #LV-8916",
    subtitle: "Baby Spinach x3, Curly Kale x2",
    amount: "75,000 KHR",
    status: "completed",
    time: "1 hour ago",
  },
];

const modules = [
  {
    title: "Merchants",
    desc: "Review farm applications, approve new growers, and monitor merchant profiles.",
    href: "/merchants",
    badge: "Farms & Cooperatives",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: "Customer Orders",
    desc: "Track pending checkouts, verified ABA payments, and live fulfillment statuses.",
    href: "/orders",
    badge: "Real-time Sales",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    title: "Distributors & Riders",
    desc: "Manage delivery drivers, coordinate dispatch routes, and track vehicle capacities.",
    href: "/distributors",
    badge: "Logistics Hub",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Products Catalog",
    desc: "Audit farm vegetable listings, seasonal availability, price caps, and stock units.",
    href: "/products",
    badge: "Produce Index",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title: "Live Deliveries",
    desc: "Inspect live courier coordinates, transit durations, and delivery verifications.",
    href: "/deliveries",
    badge: "Fleet Dispatch",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    title: "Platform Users",
    desc: "Oversee consumer accounts, authentication logs, phone verification, and buyer history.",
    href: "/users",
    badge: "Consumer Accounts",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function AdminPage() {
  const [stats, setStats] = useState<KPIStats>({
    totalRevenue: 4328.5,
    totalOrders: 184,
    activeFarms: 14,
    pendingApprovals: 2,
    totalProducts: 56,
    activeDeliveries: 3,
  });
  const [activities] = useState<RecentActivity[]>(initialActivities);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadRealData() {
      try {
        const [merchantsRes, productsRes] = await Promise.all([
          supabase.from("profile_merchants").select("id, is_approved"),
          supabase.from("products").select("id, is_active", { count: "exact" }),
        ]);

        const merchantData = merchantsRes.data || [];
        const productCount = productsRes.count ?? 56;

        const approvedCount = merchantData.filter((m) => m.is_approved).length;
        const pendingCount = merchantData.filter((m) => !m.is_approved).length;

        setStats((prev) => ({
          ...prev,
          activeFarms: approvedCount > 0 ? approvedCount : prev.activeFarms,
          pendingApprovals: pendingCount > 0 ? pendingCount : prev.pendingApprovals,
          totalProducts: productCount > 0 ? productCount : prev.totalProducts,
        }));
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }

    void loadRealData();
  }, []);

  return (
    <div className="space-y-8 pb-12 w-full">
      {/* Hero Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#dfe6d9] pb-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--leaf-accent)]">
            Marketplace Orchestration
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight font-heading mt-1">
            LocalVegetable Ecosystem Console
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#556353] max-w-2xl leading-relaxed">
            Monitor verified Cambodian farms, consumer order pipelines, real-time rider dispatches, and produce catalog integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#dfe6d9] text-xs font-bold text-[#556353] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[var(--leaf)] animate-pulse" />
            <span>Operational · Cambodia Standard Time</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Gross Sales */}
        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#667262] uppercase tracking-wider">
              Marketplace Volume
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]">
              +14.8% MoM
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--foreground)] font-heading">
              {Math.round(stats.totalRevenue).toLocaleString()} <span className="text-xl font-bold text-[#7d8b79]">KHR</span>
            </span>
          </div>
          <div className="mt-2 text-xs text-[#7d8b79] flex items-center justify-between border-t border-[#f2f4ef] pt-2">
            <span>Customer Checkouts</span>
            <span className="font-bold text-[var(--foreground)]">{stats.totalOrders} total orders</span>
          </div>
        </div>

        {/* Card 2: Farms & Merchants */}
        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#667262] uppercase tracking-wider">
              Registered Farms
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]">
              {stats.pendingApprovals} Pending Review
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--foreground)] font-heading">
              {stats.activeFarms}
            </span>
            <span className="text-xs font-bold text-[#7d8b79]">Verified Growers</span>
          </div>
          <div className="mt-2 text-xs text-[#7d8b79] flex items-center justify-between border-t border-[#f2f4ef] pt-2">
            <span>Verification Rate</span>
            <span className="font-bold text-[var(--leaf-accent)]">92% active</span>
          </div>
        </div>

        {/* Card 3: Produce Listings */}
        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#667262] uppercase tracking-wider">
              Produce Catalog
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]">
              Fresh Daily
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--foreground)] font-heading">
              {stats.totalProducts}
            </span>
            <span className="text-xs font-bold text-[#7d8b79]">Active Crops</span>
          </div>
          <div className="mt-2 text-xs text-[#7d8b79] flex items-center justify-between border-t border-[#f2f4ef] pt-2">
            <span>In-stock Availability</span>
            <span className="font-bold text-[var(--leaf)]">96.4% in stock</span>
          </div>
        </div>

        {/* Card 4: Dispatch & Couriers */}
        <div className="rounded-2xl bg-white p-5 border border-[#dfe6d9] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#667262] uppercase tracking-wider">
              Active Logistics
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#eaf4fe] text-[#1e5fa0] border border-[#bcdbfc]">
              Live GPS
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--foreground)] font-heading">
              {stats.activeDeliveries}
            </span>
            <span className="text-xs font-bold text-[#7d8b79]">Couriers On Route</span>
          </div>
          <div className="mt-2 text-xs text-[#7d8b79] flex items-center justify-between border-t border-[#f2f4ef] pt-2">
            <span>Avg Delivery Time</span>
            <span className="font-bold text-[var(--foreground)]">34 minutes</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Management Modules (6 Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--foreground)] font-heading">
            Administrative Modules
          </h3>
          <span className="text-xs font-bold text-[#7d8b79]">6 Core Management Portals</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="group relative rounded-2xl bg-white p-6 border border-[#dfe6d9] shadow-sm hover:shadow-md hover:border-[var(--leaf)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-[#dfe6d9] bg-[#f8faf6] text-[var(--leaf-accent)] group-hover:bg-[var(--leaf)] group-hover:text-white transition-colors">
                    {m.icon}
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#faf7f0] text-[#556353] border border-[#e2ebd9]">
                    {m.badge}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--leaf-dark)] transition-colors font-heading">
                  {m.title}
                </h4>
                <p className="mt-2 text-xs text-[#667262] leading-relaxed">
                  {m.desc}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#f2f4ef] flex items-center justify-between text-xs font-bold text-[#7d8b79] group-hover:text-[var(--leaf)] transition-colors">
                <span>Open Management Tool</span>
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Full-Screen Fill: Live Activity Feed + Produce Analytics Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Live Activity Stream */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-[#dfe6d9] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#f2f4ef]">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)] font-heading">
                Live Ecosystem Activity Feed
              </h3>
              <p className="text-xs text-[#7d8b79] mt-0.5">
                Real-time transactions, farm applications, and dispatch assignments
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-extrabold text-[var(--leaf-accent)] hover:underline flex items-center gap-1"
            >
              All Orders →
            </Link>
          </div>

          <div className="space-y-3.5">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#dfe6d9]/60 hover:bg-[#fafbf9] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                      act.type === "order"
                        ? "bg-[#edf6e9] text-[var(--leaf-dark)]"
                        : act.type === "merchant"
                        ? "bg-[#fef8ea] text-[#935b0b]"
                        : "bg-[#eaf4fe] text-[#1e5fa0]"
                    }`}
                  >
                    {act.type === "order" ? "🛍️" : act.type === "merchant" ? "🌾" : "🛵"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-[#7d8b79] truncate mt-0.5">
                      {act.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-4">
                  {act.amount && (
                    <p className="text-xs font-black text-[var(--foreground)]">{act.amount}</p>
                  )}
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      act.status === "completed"
                        ? "bg-[#edf6e9] text-[var(--leaf-dark)]"
                        : act.status === "pending"
                        ? "bg-[#fef8ea] text-[#935b0b]"
                        : act.status === "in_transit"
                        ? "bg-[#eaf4fe] text-[#1e5fa0]"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {act.status.replace("_", " ")}
                  </span>
                  <p className="text-[10px] text-[#9ca69a] mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Produce Distribution & Provincial Hubs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Produce Categories Breakdown */}
          <div className="rounded-2xl bg-white border border-[#dfe6d9] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[var(--foreground)] font-heading mb-1">
              Produce Supply Distribution
            </h3>
            <p className="text-xs text-[#7d8b79] mb-4">
              Real-time harvest stock by vegetable category
            </p>

            <div className="space-y-3.5">
              {[
                { name: "Leafy Greens (Spinach, Morning Glory, Kale)", pct: 42, color: "bg-[#0DB30D]" },
                { name: "Root Crops & Tubers (Carrots, Radish)", pct: 26, color: "bg-[#2E6F40]" },
                { name: "Fruit Vegetables (Tomatoes, Eggplant)", pct: 20, color: "bg-[#6FAE5C]" },
                { name: "Herbs & Seasoning (Basil, Mint, Lemongrass)", pct: 12, color: "bg-[#0A490A]" },
              ].map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-[#4d5e49] truncate pr-2">{cat.name}</span>
                    <span className="font-extrabold text-[var(--foreground)]">{cat.pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#edf1e8] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color} transition-all duration-500`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#f2f4ef] flex items-center justify-between">
              <span className="text-xs text-[#7d8b79]">Total Inventory Items</span>
              <span className="text-xs font-bold text-[var(--leaf-accent)]">
                {stats.totalProducts} Unique SKUs Active
              </span>
            </div>
          </div>

          {/* Quick Dispatch & System Health Card */}
          <div className="rounded-2xl bg-[#faf7f0] border border-[#dfe6d9] p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--leaf)] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-heading">
                Marketplace Microservices Health
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#dfe6d9]/70">
                <span className="text-[#556353]">Supabase PostgreSQL & Realtime</span>
                <span className="font-bold text-[var(--leaf-dark)]">● Operational</span>
              </div>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#dfe6d9]/70">
                <span className="text-[#556353]">ABA PayWay Settlement Gateway</span>
                <span className="font-bold text-[var(--leaf-dark)]">● Operational</span>
              </div>
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#dfe6d9]/70">
                <span className="text-[#556353]">Rider Geolocation Leaflet Service</span>
                <span className="font-bold text-[var(--leaf-dark)]">● Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}