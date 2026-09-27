"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  CircleDot, 
  Clock3, 
  Power, 
  ShieldCheck, 
  Bell, 
  Zap, 
  Leaf, 
  Sparkles, 
  PhoneCall,
  MapPin
} from "lucide-react";
import { CurrentDeliveryCard } from "@/components/delivery/CurrentDeliveryCard";
import { DeliveryRequestCard } from "@/components/delivery/DeliveryRequestCard";
import { HistoryCard } from "@/components/delivery/HistoryCard";
import { EmptyState, PageSkeleton } from "@/components/ui/StateViews";
import { useDelivery } from "@/context/DeliveryProvider";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

export default function HomePage() {
  const router = useRouter();
  const { user, incoming, current, history, loading, acceptDelivery, setAvailability, refresh } = useDelivery();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("delivery-orders")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: "status=eq.out_for_delivery",
        },
        (payload) => {
          console.log('[realtime] event fired', payload);
          setToast("A new delivery is available in your zone.");
          void refresh?.();
        }
      )
      .subscribe((status) => {
        console.log('[realtime] channel status:', status);
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleAccept(id: string) {
    setAcceptingId(id);
    setError("");
    const result = await acceptDelivery(id);
    setAcceptingId(null);
    if (!result.ok) {
      setError(result.message ?? "Unable to accept this request.");
      return;
    }
    router.push("/current");
  }

  if (loading || !user) return <PageSkeleton />;

  return (
    <div className="enter-up space-y-8 pb-12 w-full">
      {toast && (
        <div className="fixed inset-x-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-[#c8dfc5] bg-[#edf6e9] px-4 py-3 text-sm font-extrabold text-[var(--leaf-dark)] shadow-lg sm:inset-x-auto sm:right-4 sm:w-80">
          <Bell size={16} />
          {toast}
        </div>
      )}

      {/* Hero Welcome & Availability Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#dfe6d9] pb-6">
        <div>
          <p className="text-xs font-bold text-[var(--leaf-accent)] uppercase tracking-wider">{greeting}, Courier {user.name.split(" ")[0]}</p>
          <h1 className="mt-1 text-2xl sm:text-4xl font-black tracking-tight font-heading text-[var(--foreground)]">
            Ready for your next dispatch?
          </h1>
          <p className="text-xs sm:text-sm text-[#556353] mt-1">Farm-fresh produce courier console · Phnom Penh Zone 1</p>
        </div>

        <button 
          type="button" 
          onClick={() => void setAvailability(!user.available)} 
          className={`hidden min-h-12 shrink-0 items-center gap-2.5 rounded-2xl border px-5 text-xs font-bold transition-all sm:flex cursor-pointer shadow-2xs ${
            user.available 
              ? "border-[#c8dfc5] bg-[#edf6e9] text-[var(--leaf-dark)] hover:bg-[#e4f1df]" 
              : "border-[#dfe6d9] bg-white text-[#556353] hover:bg-[#fafbf9]"
          }`} 
          aria-pressed={user.available}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${user.available ? "bg-[var(--leaf)] animate-pulse" : "bg-[#9ca69a]"}`} />
          <span>{user.available ? "Duty Status: Available" : "Duty Status: Offline"}</span>
        </button>

        <button 
          type="button" 
          onClick={() => void setAvailability(!user.available)} 
          className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 text-xs font-bold sm:hidden cursor-pointer ${
            user.available 
              ? "border-[#c8dfc5] bg-[#edf6e9] text-[var(--leaf-dark)]" 
              : "border-[#dfe6d9] bg-white text-[#556353]"
          }`} 
          aria-pressed={user.available}
        >
          <span className="flex items-center gap-2"><Power size={16} />Rider Availability</span>
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${user.available ? "bg-[var(--leaf)]" : "bg-[#9ca69a]"}`} />
            {user.available ? "Available" : "Offline"}
          </span>
        </button>
      </section>

      {/* Main Active / Incoming Request Section */}
      {current ? (
        <CurrentDeliveryCard delivery={current} />
      ) : incoming.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[var(--leaf-accent)] font-heading">
              Dispatch Waiting for You
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b96a1d]">
              <CircleDot size={13} />
              Accept promptly
            </span>
          </div>
          <DeliveryRequestCard delivery={incoming[0]} onAccept={() => void handleAccept(incoming[0].id)} accepting={acceptingId === incoming[0].id} emphasized />
          {error && <p role="alert" className="mt-3 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">{error}</p>}
        </section>
      ) : (
        <EmptyState variant="incoming" />
      )}

      {/* 4 Shift Metrics Cards (Fills Width) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#dfe6d9] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <ShieldCheck size={20} className="text-[var(--leaf)]" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]">
              GPS Sync
            </span>
          </div>
          <p className="mt-3 text-2xl font-black font-heading text-[var(--foreground)]">{user.available ? "Active" : "Paused"}</p>
          <p className="mt-1 text-xs font-bold text-[#7d8b79]">Rider Dispatch Duty</p>
        </div>

        <div className="rounded-2xl border border-[#dfe6d9] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <Clock3 size={20} className="text-[var(--leaf-accent)]" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#eaf4fe] text-[#1e5fa0] border border-[#bcdbfc]">
              Target: 35m
            </span>
          </div>
          <p className="mt-3 text-2xl font-black font-heading text-[var(--foreground)]">{current ? `${current.estimatedMinutes}m` : "28m"}</p>
          <p className="mt-1 text-xs font-bold text-[#7d8b79]">Average Transit Duration</p>
        </div>

        <div className="rounded-2xl border border-[#dfe6d9] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <CheckCircle2 size={20} className="text-[var(--leaf-dark)]" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]">
              99.4% On-Time
            </span>
          </div>
          <p className="mt-3 text-2xl font-black font-heading text-[var(--foreground)]">{history.length}</p>
          <p className="mt-1 text-xs font-bold text-[#7d8b79]">Completed Fresh Drops</p>
        </div>

        <div className="rounded-2xl border border-[#dfe6d9] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <Sparkles size={20} className="text-[#b96a1d]" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#fef8ea] text-[#935b0b] border border-[#f4dfab]">
              Rider Tier
            </span>
          </div>
          <p className="mt-3 text-2xl font-black font-heading text-[var(--foreground)]">4.96 ★</p>
          <p className="mt-1 text-xs font-bold text-[#7d8b79]">Customer Freshness Score</p>
        </div>
      </section>

      {/* 2-Column Responsive Layout for Activity & Field Guidelines */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (7 cols): Recent Completed Deliveries */}
        <section className="lg:col-span-7 rounded-3xl bg-white border border-[#dfe6d9] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3 pb-3 border-b border-[#f2f4ef]">
            <div>
              <h2 className="text-base font-bold tracking-tight font-heading text-[var(--foreground)]">Recent Dispatches</h2>
              <p className="mt-0.5 text-xs text-[#7d8b79]">Your latest completed farm-to-door deliveries</p>
            </div>
            <Link href="/history" className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--leaf-accent)] hover:underline">
              View History <ArrowRight size={14} />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7d8b79]">
              No past deliveries on record for this shift yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {history.slice(0, 4).map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Right Column (5 cols): Field Safety & Operational Hotline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fresh Produce Transport Protocol */}
          <section className="rounded-3xl bg-white border border-[#dfe6d9] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Leaf size={18} className="text-[var(--leaf)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)] font-heading">
                Produce Transport Guidelines
              </h3>
            </div>
            <p className="text-xs text-[#556353] leading-relaxed mb-4">
              Local vegetables lose crispness under direct tropical sunlight. Follow standard handling protocols:
            </p>

            <ul className="space-y-2.5 text-xs text-[#556353]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#edf6e9] text-[var(--leaf-dark)] font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Keep produce box zipped in insulated courier bag during transit.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#edf6e9] text-[var(--leaf-dark)] font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>Handle leafy greens (Bok Choy, Morning Glory) upright without squishing.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[#edf6e9] text-[var(--leaf-dark)] font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>Confirm customer arrival code or photo dropoff confirmation in app.</span>
              </li>
            </ul>
          </section>

          {/* Dispatch Hotline Help */}
          <section className="rounded-3xl bg-[#faf7f0] border border-[#dfe6d9] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--leaf)] text-white flex items-center justify-center shadow-xs">
                  <PhoneCall size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)] font-heading">Central Dispatch Assistance</h4>
                  <p className="text-[11px] text-[#7d8b79]">Issues with farm pickup or dropoff?</p>
                </div>
              </div>
              <a
                href="tel:+85512345678"
                className="px-3 py-1.5 rounded-xl bg-white border border-[#dfe6d9] text-xs font-bold text-[var(--leaf-dark)] hover:bg-[#edf6e9] transition-colors shadow-2xs"
              >
                Call Hotline
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}