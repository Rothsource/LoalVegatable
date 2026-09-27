import React from "react";

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8" role="status" aria-label="Loading content">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="skeleton h-4 w-72 max-w-full rounded-lg" />
      <div className="skeleton h-60 rounded-[26px]" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="skeleton h-36 rounded-[22px]" />
        <div className="skeleton h-36 rounded-[22px]" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading notifications">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[24px] border border-[#edf0ea] bg-white p-5 sm:p-6 shadow-sm"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-[#f3f4f1] pb-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-11 w-11 rounded-2xl" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-32 rounded-md" />
                <div className="skeleton h-3 w-20 rounded-md" />
              </div>
            </div>
            <div className="skeleton h-7 w-28 rounded-full" />
          </div>

          {/* Stepper skeleton */}
          <div className="my-5 flex items-center justify-between px-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-col items-center gap-2">
                <div className="skeleton h-6 w-6 rounded-full" />
                <div className="skeleton h-2.5 w-12 rounded-sm hidden sm:block" />
              </div>
            ))}
          </div>

          {/* Items Row */}
          <div className="space-y-3 rounded-2xl bg-[#fafbf9] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="skeleton h-12 w-12 rounded-xl" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3.5 w-28 rounded-md" />
                  <div className="skeleton h-2.5 w-16 rounded-md" />
                </div>
              </div>
              <div className="skeleton h-4 w-16 rounded-md" />
            </div>
          </div>

          {/* Card Footer */}
          <div className="mt-4 flex items-center justify-between pt-2">
            <div className="skeleton h-4 w-36 rounded-md" />
            <div className="skeleton h-9 w-28 rounded-xl" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading order updates…</span>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
      role="status"
      aria-label="Loading produce"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-[22px] border border-[#ece5d8] bg-white shadow-sm"
        >
          {/* Image */}
          <div className="skeleton h-48 w-full" />
          
          {/* Body */}
          <div className="flex flex-1 flex-col p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-4 w-20 rounded-full" />
              <div className="skeleton h-3 w-12 rounded-full" />
            </div>

            <div className="skeleton h-5 w-3/4 rounded-lg" />
            <div className="skeleton h-3 w-1/2 rounded-md" />

            <div className="mt-auto pt-3 flex items-center justify-between border-t border-[#f2ece1]">
              <div className="space-y-1">
                <div className="skeleton h-4 w-20 rounded-md" />
                <div className="skeleton h-2.5 w-12 rounded-sm" />
              </div>
              <div className="skeleton h-9 w-9 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading vegetables…</span>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8" role="status" aria-label="Loading cart">
      <div className="skeleton h-8 w-40 rounded-xl" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-[#edf0ea] bg-white p-4">
              <div className="skeleton h-16 w-16 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-36 rounded-md" />
                <div className="skeleton h-3 w-20 rounded-md" />
              </div>
              <div className="skeleton h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-[#edf0ea] bg-white p-5 space-y-4 h-fit">
          <div className="skeleton h-5 w-28 rounded-md" />
          <div className="space-y-2 border-y border-[#f2f4ef] py-3">
            <div className="flex justify-between">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-3 w-14 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 w-14 rounded" />
            </div>
          </div>
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
      </div>
      <span className="sr-only">Loading cart items…</span>
    </div>
  );
}

export function CircularLoader({ 
  size = 40, 
  strokeWidth = 3.5,
  label 
}: { 
  size?: number; 
  strokeWidth?: number;
  label?: string; 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-4 gap-3" role="status" aria-label="Loading">
      <div 
        className="relative flex items-center justify-center" 
        style={{ width: size, height: size }}
      >
        {/* Soft background track ring */}
        <div 
          className="absolute inset-0 rounded-full border-solid border-[#e2ebd9]" 
          style={{ borderWidth: strokeWidth }}
        />
        {/* Rotating arc in --leaf (#0DB30D) with smooth continuous rotation */}
        <div
          className="absolute inset-0 rounded-full border-solid border-transparent border-t-[#0DB30D] border-r-[#0DB30D] animate-spin"
          style={{ 
            borderWidth: strokeWidth,
            animationDuration: "0.75s",
            animationTimingFunction: "linear"
          }}
        />
      </div>
      {label && (
        <span className="text-xs font-bold tracking-wider text-[#2E6F40] uppercase opacity-90 animate-pulse">
          {label}
        </span>
      )}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// Alias for semantic usage
export const LeafSpinner = CircularLoader;

export function FullPageLoader({ 
  size = 64, 
  label = "Loading farm produce…" 
}: { 
  size?: number; 
  label?: string; 
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center w-full">
      <CircularLoader size={size} strokeWidth={4} label={label} />
    </div>
  );
}


