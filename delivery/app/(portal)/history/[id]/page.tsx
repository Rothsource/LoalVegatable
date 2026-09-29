"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarCheck2 } from "lucide-react";
import { DeliveryDetails } from "@/components/delivery/DeliveryDetails";
import { RouteSummary } from "@/components/delivery/RouteSummary";
import { DeliveryMap } from "@/components/map/DeliveryMap";
import { PageSkeleton } from "@/components/ui/StateViews";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDelivery } from "@/context/DeliveryProvider";
import { formatDateTime } from "@/lib/format";
import { deliveryService } from "@/lib/delivery-service";
import type { DeliveryHistoryItem } from "@/lib/types";

export default function HistoryDetailsPage() {
  const params = useParams<{ id: string }>();
  const { history, loading } = useDelivery();
  const [fallbackDelivery, setFallbackDelivery] = useState<DeliveryHistoryItem | null>(null);
  const [fetching, setFetching] = useState(false);

  const delivery = history.find((item) => item.id === params.id) ?? fallbackDelivery;

  useEffect(() => {
    if (!loading && !delivery && params.id) {
      setFetching(true);
      deliveryService.getDeliveryById(params.id).then((res) => {
        if (res) {
          setFallbackDelivery({
            ...res,
            status: "completed",
            completedAt: res.completedAt || res.receivedAt,
          });
        }
        setFetching(false);
      });
    }
  }, [loading, delivery, params.id]);

  if (loading || fetching) return <PageSkeleton />;
  if (!delivery) return <div className="rounded-[24px] border border-[var(--line)] bg-white p-8 text-center"><h1 className="text-xl font-black">Delivery not found</h1><Link href="/history" className="mt-5 inline-flex min-h-12 items-center rounded-[14px] bg-[var(--leaf)] px-5 text-sm font-extrabold text-white">Back to history</Link></div>;
  return (
    <div className="enter-up space-y-5">
      <Link href="/history" className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"><ArrowLeft size={16} />Back to history</Link>
      <section className="rounded-[25px] bg-[var(--leaf-dark)] p-5 text-white sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><StatusBadge status={delivery.status} /><h1 className="mt-4 text-[30px] font-black tracking-[-0.045em]">{delivery.id}</h1><p className="mt-1 flex items-center gap-2 text-sm text-[#c8d9c3]"><CalendarCheck2 size={15} />Completed {formatDateTime(delivery.completedAt)}</p></div></div><div className="mt-6 rounded-[20px] bg-white p-5 text-[var(--ink)]"><RouteSummary pickup={delivery.pickup} destination={delivery.destination} compact /></div></section>
      <DeliveryMap destination={delivery.destination} pickup={delivery.pickup} />
      <DeliveryDetails delivery={delivery} />
    </div>
  );
}
