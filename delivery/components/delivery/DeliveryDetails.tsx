import { Box, Clock3, MessageSquareText, Phone, UserRound } from "lucide-react";
import type { DeliveryRequest } from "@/lib/types";

export function DeliveryDetails({ delivery }: { delivery: DeliveryRequest }) {
  const itemCount = delivery.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[22px] border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--leaf)]"><UserRound size={19} aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#869181]">Customer</p>
            <h2 className="mt-0.5 font-extrabold">{delivery.customer.name}</h2>
          </div>
        </div>
        <a href={`tel:${delivery.customer.phone}`} className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-[#f5f8f2] px-4 text-sm font-bold text-[var(--ink)] transition hover:bg-[#edf4e8]">
          <span className="flex items-center gap-2"><Phone size={16} className="text-[var(--leaf)]" aria-hidden="true" />{delivery.customer.phone}</span>
          <span className="text-xs font-extrabold text-[var(--leaf)]">Call</span>
        </a>
      </section>

      <section className="rounded-[22px] border border-[var(--line)] bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--leaf)]"><Box size={19} aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#869181]">Order summary</p>
            <h2 className="mt-0.5 font-extrabold">{itemCount} items</h2>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-[#eef1eb]">
          {delivery.items.map((item) => (
            <li key={item.name} className="flex justify-between gap-3 py-2.5 text-sm">
              <span className="font-semibold text-[#455143]">{item.name}</span>
              <span className="shrink-0 font-extrabold">{item.quantity} {item.unit}</span>
            </li>
          ))}
        </ul>
      </section>

      {delivery.note && (
        <section className="rounded-[22px] border border-[#eadfb9] bg-[#fffaf0] p-5 lg:col-span-2">
          <div className="flex items-start gap-3">
            <MessageSquareText size={19} className="mt-0.5 shrink-0 text-[var(--amber)]" aria-hidden="true" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--amber)]">Delivery note</p>
              <p className="mt-1.5 text-sm leading-6 text-[#5d5141]">{delivery.note}</p>
            </div>
          </div>
        </section>
      )}

      <div className="sr-only"><Clock3 /> Estimated {delivery.estimatedMinutes} minutes</div>
    </div>
  );
}
