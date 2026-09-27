"use client";

import React from "react";

export function DistributorSpinner({ size = 44, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3" role="status" aria-label="Loading">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Track circle */}
        <div className="absolute inset-0 rounded-full border-[3px] border-[#e2ebd9]" />
        {/* Fast smooth spinning arc */}
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0DB30D] border-r-[#0A490A] animate-spin"
          style={{ animationDuration: "0.75s" }}
        />
        {/* Center organic pulse dot */}
        <div className="h-2.5 w-2.5 rounded-full bg-[#0DB30D] shadow-[0_0_10px_rgba(13,179,13,0.7)] animate-pulse" />
      </div>
      {label && (
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#52644e]">
          {label}
        </span>
      )}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-[24px] border border-[#e2e8dd] bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#f0f4ee] pb-4">
            <div className="space-y-2">
              <div className="h-5 w-36 rounded-lg bg-[#e7eee4]" />
              <div className="h-4 w-48 rounded-md bg-[#edf3ea]" />
            </div>
            <div className="h-8 w-24 rounded-full bg-[#e7eee4]" />
          </div>
          <div className="h-14 rounded-2xl bg-[#f7f9f5]" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 flex-1 rounded-2xl bg-[#e7eee4]" />
            <div className="h-12 flex-1 rounded-2xl bg-[#0DB30D]/20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductRowSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="animate-pulse flex items-center justify-between gap-4 rounded-2xl border border-[#e2e8dd] bg-white p-4 shadow-sm"
        >
          <div className="h-14 w-14 rounded-2xl bg-[#e7eee4] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded-md bg-[#e7eee4]" />
            <div className="h-3 w-20 rounded-md bg-[#edf3ea]" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-[#e7eee4]" />
          <div className="h-10 w-20 rounded-xl bg-[#0DB30D]/20" />
        </div>
      ))}
    </div>
  );
}
