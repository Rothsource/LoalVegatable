"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MapPin, Store, RotateCcw } from "lucide-react";
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
  const [stage, setStage] = useState<"to_pickup" | "to_consumer">("to_pickup");

  // Load saved stage from localStorage for this specific order
  useState(() => {
    if (typeof window !== "undefined" && current?.id) {
      const saved = localStorage.getItem(`delivery_stage_${current.id}`);
      if (saved === "to_consumer" || saved === "to_pickup") {
        setStage(saved);
      }
    }
  });

  const handleStageChange = (nextStage: "to_pickup" | "to_consumer") => {
    setStage(nextStage);
    if (current?.id) {
      try {
        localStorage.setItem(`delivery_stage_${current.id}`, nextStage);
      } catch {}
    }
  };

  const handleArriveAtPickup = () => {
    handleStageChange("to_consumer");
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

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
    try {
      localStorage.removeItem(`delivery_stage_${current.id}`);
    } catch {}
    setCompletedId(current.id);
    setConfirmOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <PageSkeleton />;
  if (completedId) return <CompletedState deliveryId={completedId} />;
  if (!current) {
    return (
      <div className="enter-up">
        <div className="mb-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--leaf)]">Current delivery</p>
          <h1 className="mt-1 text-[30px] font-black tracking-[-0.045em]">Ready for your next stop?</h1>
        </div>
        <EmptyState variant="current" />
        <Link href="/home" className="mx-auto mt-5 flex min-h-12 max-w-sm items-center justify-center gap-2 rounded-[14px] bg-[var(--leaf)] px-5 text-sm font-extrabold text-white">
          Check incoming requests <ArrowRight size={17} />
        </Link>
      </div>
    );
  }

  return (
    <div className="enter-up space-y-5">
      {/* Top Header Row reflecting Current Step */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                stage === "to_pickup"
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
              }`}
            >
              {stage === "to_pickup" ? "Step 1 of 2: Pickup Phase" : "Step 2 of 2: Customer Delivery"}
            </span>
            <span className="text-xs text-[var(--muted)]">Order #{current.id.slice(0, 8)}</span>
          </div>
          <h1 className="mt-1 text-[30px] font-black tracking-[-0.045em] sm:text-[36px]">
            {stage === "to_pickup" ? "Head to Farm / Pickup Hub" : "Deliver to Customer"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {stage === "to_pickup"
              ? "Follow road directions to collect fresh vegetables from the producer."
              : "Vegetables collected! Follow directions to customer delivery address."}
          </p>
        </div>
        <StatusBadge status={current.status} />
      </div>

      <section className="rounded-[24px] border border-[var(--line)] bg-white p-5 card-shadow sm:p-6">
        <RouteSummary pickup={current.pickup} destination={current.destination} />
      </section>

      {/* Interactive Road Navigation Map */}
      <DeliveryMap
        destination={current.destination}
        pickup={current.pickup}
        stage={stage}
        onStageChange={handleStageChange}
        onArrivedAtPickup={handleArriveAtPickup}
      />

      <DeliveryDetails delivery={current} />

      {error && <p role="alert" className="rounded-xl bg-[#fff5f3] p-3 text-sm font-semibold text-[var(--danger)]">{error}</p>}

      {/* Sticky Bottom Action Button for Stage 1 vs Stage 2 */}
      <div className="sticky bottom-[76px] z-20 -mx-4 border-t border-[#dfe6d9] bg-[#f7f8f2]/95 p-4 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-[20px] sm:border">
        {stage === "to_pickup" ? (
          <div>
            <Button
              fullWidth
              onClick={handleArriveAtPickup}
              icon={<Store size={18} />}
              className="!bg-[#935626] hover:!bg-[#78461e]"
            >
              I&apos;ve Arrived at Pickup (Collect Produce)
            </Button>
            <p className="mt-2 text-center text-[11px] leading-5 text-[var(--muted)]">
              Tap when you arrive at the farm/hub to switch road directions to the customer.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleStageChange("to_pickup")}
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                title="Go back to Pickup step"
              >
                ← Pickup
              </button>
              <Button fullWidth onClick={() => setConfirmOpen(true)} icon={<MapPin size={18} />}>
                Arrive &amp; Complete Delivery
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] leading-5 text-[var(--muted)]">
              Tap only when you have reached the customer destination.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={confirmOpen}
        loading={arriving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void confirmArrival()}
      />
    </div>
  );
}
