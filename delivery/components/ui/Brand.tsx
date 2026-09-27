import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/home" className="inline-flex items-center gap-2.5 no-underline" aria-label="Local Vegetable Delivery home">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] bg-white p-1 border border-[var(--line)] shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image/logo.png" alt="Local Vegetable" className="h-full w-full object-contain" />
      </div>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">Local Vegetable</span>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--leaf)]">Delivery portal</span>
        </span>
      )}
    </Link>
  );
}
