import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";
import type { DeliveryHistoryItem } from "@/lib/types";

export function HistoryCard({ item }: { item: DeliveryHistoryItem }) {
  return (
    <Link href={`/history/${item.id}`} className="group flex w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-[20px] border border-[var(--line)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#bfd0b7] hover:shadow-[0_12px_30px_rgba(43,68,38,0.07)] sm:gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--surface-soft)] text-[var(--leaf)]">
        <MapPin size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <strong className="text-sm font-extrabold">{item.id}</strong>
          <StatusBadge status={item.status} />
        </span>
        <span className="mt-1.5 block truncate text-sm font-semibold text-[#566253]">{item.destination.address}</span>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-[#899584]"><CalendarDays size={13} aria-hidden="true" />{formatDateTime(item.completedAt)}</span>
      </span>
      <ArrowRight size={17} className="shrink-0 text-[#a3ada0] transition group-hover:translate-x-0.5 group-hover:text-[var(--leaf)]" aria-hidden="true" />
    </Link>
  );
}
