import React from "react";
import { NotificationSkeleton, CircularLoader } from "@/components/CustomerSkeleton";

export default function NotificationsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 enter-up">
      <div className="mb-8 space-y-3">
        <div className="skeleton h-8 w-56 rounded-xl" />
        <div className="skeleton h-4 w-72 rounded-lg" />
      </div>
      <div className="mb-6 flex items-center justify-center py-2">
        <CircularLoader size={38} label="Checking order updates…" />
      </div>
      <NotificationSkeleton />
    </div>
  );
}
