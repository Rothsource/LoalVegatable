"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleDot, Clock3, Power, ShieldCheck } from "lucide-react";
import { CurrentDeliveryCard } from "@/components/delivery/CurrentDeliveryCard";
import { DeliveryRequestCard } from "@/components/delivery/DeliveryRequestCard";
import { HistoryCard } from "@/components/delivery/HistoryCard";
import { EmptyState, PageSkeleton } from "@/components/ui/StateViews";
import { useDelivery } from "@/context/DeliveryProvider";

export default function HomePage() {
  const router = useRouter();
  const { user, incoming, current, history, loading, acceptDelivery, setAvailability } = useDelivery();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
    <div className="enter-up space-y-7">
      <section className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[var(--leaf)]">{greeting}, {user.name.split(" ")[0]}</p>
          <h1 className="mt-1 text-[30px] font-black tracking-[-0.045em] sm:text-[38px]">Here&apos;s what to do next.</h1>
        </div>
        <button type="button" onClick={() => void setAvailability(!user.available)} className={`hidden min-h-11 shrink-0 items-center gap-2 rounded-[14px] border px-4 text-sm font-extrabold transition sm:flex ${user.available ? "border-[#c9dfc2] bg-[#edf6e9] text-[var(--leaf-dark)]" : "border-[var(--line)] bg-white text-[var(--muted)]"}`} aria-pressed={user.available}>
          <span className={`h-2.5 w-2.5 rounded-full ${user.available ? "bg-[#54a457]" : "bg-[#9ca69a]"}`} />{user.available ? "Available" : "Offline"}
        </button>
      </section>

      <button type="button" onClick={() => void setAvailability(!user.available)} className={`flex min-h-12 w-full items-center justify-between rounded-[16px] border px-4 text-sm font-extrabold sm:hidden ${user.available ? "border-[#c9dfc2] bg-[#edf6e9] text-[var(--leaf-dark)]" : "border-[var(--line)] bg-white text-[var(--muted)]"}`} aria-pressed={user.available}>
        <span className="flex items-center gap-2"><Power size={17} />Rider availability</span><span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${user.available ? "bg-[#54a457]" : "bg-[#9ca69a]"}`} />{user.available ? "Available" : "Offline"}</span>
      </button>

      {current ? <CurrentDeliveryCard delivery={current} /> : incoming.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#697565]">Waiting for you</h2><span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--amber)]"><CircleDot size={13} />Respond soon</span></div>
          <DeliveryRequestCard delivery={incoming[0]} onAccept={() => void handleAccept(incoming[0].id)} accepting={acceptingId === incoming[0].id} emphasized />
          {error && <p role="alert" className="mt-3 rounded-xl bg-[#fff5f3] p-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
        </section>
      ) : <EmptyState variant="incoming" />}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-[var(--line)] bg-white p-4"><ShieldCheck size={19} className="text-[var(--leaf)]" /><p className="mt-3 text-2xl font-black">{user.available ? "On" : "Off"}</p><p className="mt-1 text-xs font-bold text-[var(--muted)]">Availability</p></div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white p-4"><Clock3 size={19} className="text-[var(--leaf)]" /><p className="mt-3 text-2xl font-black">{current ? `${current.estimatedMinutes}m` : "—"}</p><p className="mt-1 text-xs font-bold text-[var(--muted)]">Current trip estimate</p></div>
        <div className="rounded-[20px] border border-[var(--line)] bg-white p-4"><CheckCircle2 size={19} className="text-[var(--leaf)]" /><p className="mt-3 text-2xl font-black">{history.length}</p><p className="mt-1 text-xs font-bold text-[var(--muted)]">Completed deliveries</p></div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-black tracking-[-0.025em]">Recent deliveries</h2><p className="mt-1 text-xs text-[var(--muted)]">Your latest completed stops</p></div><Link href="/history" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-extrabold text-[var(--leaf)] hover:bg-[#eef5e9]">View all <ArrowRight size={15} /></Link></div>
        <div className="grid gap-3 lg:grid-cols-2">{history.slice(0, 2).map((item) => <HistoryCard key={item.id} item={item} />)}</div>
      </section>
    </div>
  );
}
