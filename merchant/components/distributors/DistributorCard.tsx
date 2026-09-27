// components/distributors/DistributorCard.tsx
"use client";

import type { Distributor } from "@/types/distributor";

type Props = {
  distributor: Distributor;
  busy: boolean;
  onDelete: (distributor: Distributor) => void;
  onToggleStatus: (distributor: Distributor) => void;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "D";
}

const STATUS_STYLE: Record<Distributor["status"], string> = {
  Pending: "bg-amber-50 text-amber-700",
  Active: "bg-green-50 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
};

export default function DistributorCard({ distributor, busy, onDelete, onToggleStatus }: Props) {
  const canToggle = distributor.status !== "Pending";

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 text-sm font-black text-white">
          {initials(distributor.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-gray-900">{distributor.name}</h2>
              <p className="truncate text-xs font-medium text-gray-400">{distributor.email}</p>
            </div>
            <button
              type="button"
              onClick={() => canToggle && onToggleStatus(distributor)}
              disabled={busy || !canToggle}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold disabled:opacity-70 ${STATUS_STYLE[distributor.status]}`}
              title={!canToggle ? "Waiting on admin approval" : undefined}
            >
              {busy ? "Updating" : distributor.status}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-gray-400">
              Added {distributor.createdAt ? new Date(distributor.createdAt).toLocaleDateString() : "recently"}
            </p>
            <button
              type="button"
              onClick={() => onDelete(distributor)}
              disabled={busy}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}