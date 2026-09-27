"use client";

import { HistoryCard } from "@/components/delivery/HistoryCard";
import { EmptyState, PageSkeleton } from "@/components/ui/StateViews";
import { PageHeading } from "@/components/ui/PageHeading";
import { useDelivery } from "@/context/DeliveryProvider";

export default function HistoryPage() {
  const { history, loading } = useDelivery();
  if (loading) return <PageSkeleton />;
  return (
    <div className="enter-up">
      <PageHeading eyebrow="Delivery history" title="Completed deliveries" description="A simple record of destinations you have already completed." />
      {history.length === 0 ? <EmptyState variant="history" /> : <div className="grid gap-3 lg:grid-cols-2">{history.map((item) => <HistoryCard key={item.id} item={item} />)}</div>}
    </div>
  );
}
