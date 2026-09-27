import { CheckCircle2, CircleDot, Radio, Timer } from "lucide-react";
import type { DeliveryStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const config = {
    incoming: { label: "Incoming", icon: Radio, className: "bg-[#fff2df] text-[#9a571a] border-[#f2d5ad]" },
    accepted: { label: "On delivery", icon: CircleDot, className: "bg-[#e7f3e3] text-[var(--leaf-dark)] border-[#c9dfc2]" },
    arrived: { label: "Arrived", icon: Timer, className: "bg-[#e5eff7] text-[#315f7c] border-[#c7dce9]" },
    completed: { label: "Completed", icon: CheckCircle2, className: "bg-[#edf3ec] text-[#51604d] border-[#d8e2d5]" },
  }[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.07em] ${config.className}`}>
      <Icon size={12} strokeWidth={2.5} aria-hidden="true" />
      {config.label}
    </span>
  );
}
