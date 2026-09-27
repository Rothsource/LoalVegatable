import Link from "next/link";
import { ArrowRight, Clock3, MapPin, Navigation } from "lucide-react";
import { RouteSummary } from "@/components/delivery/RouteSummary";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DeliveryRequest } from "@/lib/types";

export function CurrentDeliveryCard({ delivery }: { delivery: DeliveryRequest }) {
  return (
    <article className="overflow-hidden rounded-[26px] bg-[var(--leaf-dark)] text-white shadow-[0_22px_55px_rgba(31,81,48,0.19)]">
      <div className="relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-12 -top-20 h-52 w-52 rounded-full border-[38px] border-white/[0.045]" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#bed8b7]">Your next action</p><h2 className="mt-1.5 text-xl font-black tracking-[-0.03em]">Head to the destination</h2></div>
          <StatusBadge status={delivery.status} />
        </div>
        <div className="relative mt-5 rounded-[20px] bg-white p-4 text-[var(--ink)] sm:p-5">
          <RouteSummary pickup={delivery.pickup} destination={delivery.destination} compact />
          <div className="mt-5 flex flex-wrap gap-4 border-t border-[#edf0ea] pt-4 text-xs font-bold text-[var(--muted)]">
            <span className="flex items-center gap-1.5"><Navigation size={14} className="text-[var(--leaf)]" />{delivery.distanceKm} km</span>
            <span className="flex items-center gap-1.5"><Clock3 size={14} className="text-[var(--leaf)]" />About {delivery.estimatedMinutes} min</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[var(--leaf)]" />{delivery.id}</span>
          </div>
        </div>
        <Link href="/current" className="relative mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#dff0a9] px-5 text-sm font-black text-[#1d3e22] transition hover:bg-[#e9f6c2] active:scale-[0.99]">Open current delivery <ArrowRight size={17} /></Link>
      </div>
    </article>
  );
}
