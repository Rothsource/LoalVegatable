"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Navigation } from "lucide-react";
import { DeliveryDetails } from "@/components/delivery/DeliveryDetails";
import { RouteSummary } from "@/components/delivery/RouteSummary";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/StateViews";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDelivery } from "@/context/DeliveryProvider";
import { formatRelativeTime } from "@/lib/format";
import { deliveryService } from "@/lib/delivery-service";
import type { DeliveryRequest } from "@/lib/types";

export default function RequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { incoming, current, loading, acceptDelivery } = useDelivery();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [fallbackDelivery, setFallbackDelivery] = useState<DeliveryRequest | null>(null);
  const [fetching, setFetching] = useState(false);

  const delivery =
    incoming.find((item) => item.id === params.id) ??
    (current?.id === params.id ? current : null) ??
    fallbackDelivery;

  useEffect(() => {
    if (!loading && !delivery && params.id) {
      setFetching(true);
      deliveryService.getDeliveryById(params.id).then((res) => {
        setFallbackDelivery(res);
        setFetching(false);
      });
    }
  }, [loading, delivery, params.id]);

  async function accept() {
    if (!delivery) return;
    setAccepting(true);
    setError("");
    const result = await acceptDelivery(delivery.id);
    setAccepting(false);
    if (!result.ok) {
      setError(result.message ?? "This request is no longer available.");
      return;
    }
    router.push("/current");
  }

  if (loading || fetching) return <PageSkeleton />;
  if (!delivery) {
    return <section className="mx-auto max-w-xl rounded-[26px] border border-[#efd8d3] bg-white p-7 text-center"><h1 className="text-xl font-black">Request no longer available</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">It may have been accepted already or removed from the demo queue.</p><Link href="/home" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[var(--leaf)] px-5 text-sm font-extrabold text-white">Return home</Link></section>;
  }

  return (
    <div className="enter-up">
      <Link href={delivery.status === "accepted" ? "/current" : "/home"} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"><ArrowLeft size={16} />Back</Link>
      <section className="overflow-hidden rounded-[26px] border border-[var(--line)] bg-white card-shadow">
        <header className="bg-[var(--leaf-dark)] p-5 text-white sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><StatusBadge status={delivery.status} /><p className="mt-4 text-xs font-bold text-[#bdd3b8]">Delivery request</p><h1 className="mt-1 text-[28px] font-black tracking-[-0.045em] sm:text-[34px]">{delivery.id}</h1></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right"><p className="text-[10px] font-bold uppercase tracking-wider text-[#bed3b8]">Received</p><p className="mt-1 text-sm font-extrabold">{formatRelativeTime(delivery.receivedAt)}</p></div>
          </div>
        </header>
        <div className="p-5 sm:p-7">
          <RouteSummary pickup={delivery.pickup} destination={delivery.destination} />
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-[#f5f8f2] p-4"><div className="flex items-center gap-2.5"><Navigation size={17} className="text-[var(--leaf)]" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#859181]">Distance</p><p className="mt-0.5 font-extrabold">{delivery.distanceKm} km</p></div></div><div className="flex items-center gap-2.5 border-l border-[#dce4d8] pl-4"><Clock3 size={17} className="text-[var(--leaf)]" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#859181]">Estimated</p><p className="mt-0.5 font-extrabold">{delivery.estimatedMinutes} min</p></div></div></div>
        </div>
      </section>
      <div className="mt-5"><DeliveryDetails delivery={delivery} /></div>
      {delivery.status === "incoming" && <div className="sticky bottom-[76px] z-20 -mx-4 mt-5 border-t border-[#dfe6d9] bg-[#f7f8f2]/95 p-4 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-[20px] sm:border"><Button fullWidth loading={accepting} onClick={() => void accept()}>Accept delivery</Button><p className="mt-2 text-center text-[11px] text-[var(--muted)]">I agree to take this delivery now.</p>{error && <p role="alert" className="mt-2 text-center text-xs font-semibold text-[var(--danger)]">{error}</p>}</div>}
    </div>
  );
}
