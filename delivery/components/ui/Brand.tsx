import Link from "next/link";
import { Leaf } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/home" className="inline-flex items-center gap-2.5 no-underline" aria-label="Local Vegetable Delivery home">
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--leaf)] text-white shadow-[0_8px_24px_rgba(46,111,64,0.2)]">
        <Leaf size={20} strokeWidth={2.4} aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">Local Vegetable</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--leaf)]">Delivery portal</span>
        </span>
      )}
    </Link>
  );
}
