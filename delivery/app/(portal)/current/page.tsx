"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { CompletedState } from "@/components/delivery/CompletedState";
import { DeliveryDetails } from "@/components/delivery/DeliveryDetails";
import { RouteSummary } from "@/components/delivery/RouteSummary";
import { DeliveryMap } from "@/components/map/DeliveryMap";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { EmptyState, PageSkeleton } from "@/components/ui/StateViews";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDelivery } from "@/context/DeliveryProvider";

export default function CurrentDeliveryPage() {
  const { current, loading, markArrived } = useDelivery();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [completedId, setCompletedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function confirmArrival() {
    if (!current) return;
    setArriving(true);
    const result = await markArrived(current.id);
    setArriving(false);
    if (!result.ok) {
      setError(result.message ?? "Could not confirm arrival.");
      setConfirmOpen(false);
      return;
    }
    setCompletedId(current.id);
    setConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <PageSkeleton />;
  if (completedId) return <CompletedState deliveryId={completedId} />;
  if (!current) {
    return <div className="enter-up"><div className="mb-6"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)]">Current delivery</p><h1 className="mt-1 text-[30px] font-black tracking-[-0.045em]">Ready for your next stop?</h1></div><EmptyState variant="current" /><Link href="/home" className="mx-auto mt-5 flex min-h-12 max-w-sm items-center justify-center gap-2 rounded-[14px] bg-[var(--leaf)] px-5 text-sm font-extrabold text-white">Check incoming requests <ArrowRight size={17} /></Link></div>;
  }

  return (
    <div className="enter-up space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)]">Current delivery</p><h1 className="mt-1 text-[30px] font-black tracking-[-0.045em] sm:text-[36px]">Head to the customer</h1><p className="mt-2 text-sm text-[var(--muted)]">{current.id}</p></div><StatusBadge status={current.status} /></div>
      <section className="rounded-[24px] border border-[var(--line)] bg-white p-5 card-shadow sm:p-6"><RouteSummary pickup={current.pickup} destination={current.destination} /></section>
      <DeliveryMap destination={current.destination} />
      <DeliveryDetails delivery={current} />
      {error && <p role="alert" className="rounded-xl bg-[#fff5f3] p-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}
      <div className="sticky bottom-[76px] z-20 -mx-4 border-t border-[#dfe6d9] bg-[#f7f8f2]/95 p-4 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-[20px] sm:border"><Button fullWidth onClick={() => setConfirmOpen(true)} icon={<MapPin size={18} />}>Arrive</Button><p className="mt-2 text-center text-[11px] leading-5 text-[var(--muted)]">Tap only when you have reached the destination.</p></div>
      <ConfirmationModal open={confirmOpen} loading={arriving} onCancel={() => setConfirmOpen(false)} onConfirm={() => void confirmArrival()} />
    </div>
  );
}
