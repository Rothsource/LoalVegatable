import { AlertTriangle, BellOff, Bike, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

type EmptyVariant = "incoming" | "current" | "history";

export function EmptyState({ variant }: { variant: EmptyVariant }) {
  const config = {
    incoming: {
      icon: BellOff,
      title: "You're all caught up",
      description: "New delivery requests will appear here as soon as the system selects you.",
    },
    current: {
      icon: Bike,
      title: "No current delivery",
      description: "Accept an incoming request when you're ready to make your next delivery.",
    },
    history: {
      icon: History,
      title: "No completed deliveries",
      description: "Finished deliveries will appear here for quick reference.",
    },
  }[variant];
  const Icon = config.icon;

  return (
    <section className="rounded-[24px] border border-dashed border-[#cdd8c8] bg-white/70 px-6 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-soft)] text-[var(--leaf)]">
        <Icon size={25} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-extrabold tracking-[-0.02em] text-[var(--ink)]">{config.title}</h2>
      <p className="balance mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">{config.description}</p>
    </section>
  );
}

export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <section className="rounded-[24px] border border-[#efd8d3] bg-[#fffafa] px-6 py-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fbe9e6] text-[var(--danger)]">
        <AlertTriangle size={25} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-extrabold">We couldn&apos;t load this delivery</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">Check your connection and try again.</p>
      {retry && <Button variant="secondary" onClick={retry} icon={<RotateCcw size={17} />} className="mt-5">Retry</Button>}
    </section>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading content">
      <div className="skeleton h-7 w-44 rounded-lg" />
      <div className="skeleton h-4 w-64 max-w-full rounded-md" />
      <div className="skeleton h-52 rounded-[24px]" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-32 rounded-[22px]" />
        <div className="skeleton h-32 rounded-[22px]" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
