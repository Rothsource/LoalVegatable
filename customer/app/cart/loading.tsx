import React from "react";
import { CartSkeleton, CircularLoader } from "@/components/CustomerSkeleton";

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 enter-up">
      <div className="mb-4 flex items-center justify-center py-2">
        <CircularLoader size={38} label="Loading your basket…" />
      </div>
      <CartSkeleton />
    </div>
  );
}
