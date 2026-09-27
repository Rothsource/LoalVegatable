import React from "react";
import { ProductGridSkeleton, CircularLoader } from "@/components/CustomerSkeleton";

export default function FavoritesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 enter-up">
      <div className="mb-8 space-y-3">
        <div className="skeleton h-8 w-44 rounded-xl" />
        <div className="skeleton h-4 w-60 rounded-lg" />
      </div>
      <div className="mb-6 flex items-center justify-center py-2">
        <CircularLoader size={38} label="Loading your favorites…" />
      </div>
      <ProductGridSkeleton count={4} />
    </div>
  );
}
