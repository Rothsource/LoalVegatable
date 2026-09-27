import Link from "next/link";
import { ArrowRight, Bike, Clock3, Navigation } from "lucide-react";
import { RouteSummary } from "@/components/delivery/RouteSummary";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DeliveryRequest } from "@/lib/types";

type DeliveryRequestCardProps = {
  delivery: DeliveryRequest;
  onAccept?: () => void;
  accepting?: boolean;
  emphasized?: boolean;
};

export function DeliveryRequestCard({ delivery, onAccept, accepting, emphasized = false }: DeliveryRequestCardProps) {
  const itemCount = delivery.items?.length || 0;

  return (
    <article className={`overflow-hidden rounded-[26px] border bg-white transition-all duration-300 ${emphasized ? "border-[#54a457] shadow-xl shadow-green-900/5 ring-4 ring-[#edf6e9]" : "border-[var(--line)] shadow-sm"}`}>
      <div className="flex items-start justify-between gap-3 border-b border-[#edf0ea] px-5 py-4 bg-gradient-to-r from-white via-white to-[#f7faf5]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={delivery.status} />
            <span className="text-xs font-bold text-[#869181]">#{delivery.id.slice(0, 8)}</span>
            {itemCount > 0 && (
              <span className="text-[11px] font-extrabold bg-[#edf4e8] text-[var(--leaf-dark)] px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-lg font-black tracking-[-0.025em] text-[var(--ink)]">Incoming Delivery Request</h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-soft)] text-[var(--leaf)] border border-[#d2e4cb]">
          <Bike size={22} aria-hidden="true" />
        </span>
      </div>

      <div className="px-5 py-5">
        <RouteSummary pickup={delivery.pickup} destination={delivery.destination} compact />
        
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f6f8f3] border border-[#e5ece1] p-3.5">
          <div className="flex items-center gap-2.5">
            <Navigation size={17} className="text-[var(--leaf)]" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#899584]">Est. Distance</p>
              <p className="text-sm font-extrabold text-[var(--ink)]">{delivery.distanceKm} km</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 border-l border-[#dfe6db] pl-3">
            <Clock3 size={17} className="text-[var(--leaf)]" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#899584]">Trip Time</p>
              <p className="text-sm font-extrabold text-[var(--ink)]">{delivery.estimatedMinutes} min</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          {onAccept && (
            <Button 
              fullWidth 
              onClick={onAccept} 
              loading={accepting}
              className="bg-[#2e6f40] hover:bg-[#1f5130] text-white font-extrabold shadow-md shadow-green-900/15"
            >
              Accept delivery
            </Button>
          )}
          <Link 
            href={`/request/${delivery.id}`} 
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-[var(--line)] bg-white px-5 text-sm font-extrabold text-[var(--ink)] transition hover:bg-[#f7faf5]"
          >
            View details <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-3 text-center text-[11px] font-medium text-[var(--muted)]">
          Accepting unlocks the customer payment and assigns the route to you.
        </p>
      </div>
    </article>
  );
}
