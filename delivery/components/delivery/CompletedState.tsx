import Link from "next/link";
import { CheckCircle2, History, Home } from "lucide-react";

export function CompletedState({ deliveryId }: { deliveryId: string }) {
  return (
    <section className="enter-up overflow-hidden rounded-[28px] bg-[var(--leaf-dark)] px-5 py-10 text-center text-white shadow-[0_22px_55px_rgba(31,81,48,0.2)] sm:px-8 sm:py-14">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-[#dff0a9] text-[var(--leaf-dark)] shadow-[0_18px_38px_rgba(0,0,0,0.13)]"><CheckCircle2 size={38} strokeWidth={2.5} /></span>
      <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c5dbbe]">Delivery {deliveryId}</p>
      <h1 className="mt-2 text-[30px] font-black tracking-[-0.045em] sm:text-[38px]">Delivery completed</h1>
      <p className="balance mx-auto mt-3 max-w-md text-sm leading-6 text-[#d7e5d2]">Arrival confirmed. This delivery is now safely stored in your demo history.</p>
      <div className="mx-auto mt-7 grid max-w-md gap-3 sm:grid-cols-2">
        <Link href="/history" className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-[#dff0a9] px-5 text-sm font-black text-[var(--leaf-dark)] transition hover:bg-[#e8f6bf]"><History size={17} />View history</Link>
        <Link href="/home" className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-white/20 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/15"><Home size={17} />Return home</Link>
      </div>
    </section>
  );
}
