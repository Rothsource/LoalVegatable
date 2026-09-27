import { ArrowDown, MapPin, Navigation, Store } from "lucide-react";
import type { DeliveryLocation } from "@/lib/types";

function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function RouteSummary({ pickup, destination, compact = false }: { pickup: DeliveryLocation; destination: DeliveryLocation; compact?: boolean }) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-x-3">
      <div className="flex flex-col items-center">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef4e9] text-[var(--leaf)]">
          <Store size={17} aria-hidden="true" />
        </span>
        <span className="my-1.5 h-6 w-px border-l border-dashed border-[#afbeaa]" />
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--leaf)] text-white">
          <MapPin size={17} aria-hidden="true" />
        </span>
      </div>
      <div className={`grid ${compact ? "gap-5" : "gap-4"}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#83907f]">Pick up</p>
          <p className="mt-1 truncate text-sm font-extrabold text-[var(--ink)]">{pickup.label}</p>
          {!compact && <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">{pickup.address}</p>}
          <a href={mapsUrl(pickup.address)} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-[var(--leaf)] hover:underline">
            <Navigation size={12} /> Navigate
          </a>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#83907f]">Deliver to</p>
          <p className="mt-1 text-sm font-extrabold text-[var(--ink)]">{destination.address}</p>
          <a href={mapsUrl(destination.address)} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-extrabold text-[var(--leaf)] hover:underline">
            <Navigation size={12} /> Navigate
          </a>
        </div>
      </div>
      {compact && <ArrowDown className="sr-only" />}
    </div>
  );
}