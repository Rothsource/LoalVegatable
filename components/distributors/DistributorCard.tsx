"use client";

import type { Distributor } from "@/types/distributor";

type DistributorCardProps = {
  distributor: Distributor;
  busy: boolean;
  onEdit: (distributor: Distributor) => void;
  onDelete: (distributor: Distributor) => void;
  onToggleStatus: (distributor: Distributor) => void;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "D"
  );
}

export default function DistributorCard({
  distributor,
  busy,
  onEdit,
  onDelete,
  onToggleStatus,
}: DistributorCardProps) {
  const active = distributor.status === "Active";

  return (
    <article className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-green-100 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 text-sm font-black text-white shadow-sm">
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
              onClick={() => onToggleStatus(distributor)}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
                active
                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              aria-label={`Set ${distributor.name} ${active ? "inactive" : "active"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
              {busy ? "Updating" : distributor.status}
            </button>
          </div>

          <dl className="mt-4 grid gap-3 border-y border-gray-50 py-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-gray-400">Phone</dt>
              <dd className="mt-0.5 truncate font-bold text-gray-700">
                {distributor.phone || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-400">Delivery area</dt>
              <dd className="mt-0.5 truncate font-bold text-gray-700">
                {distributor.deliveryArea || "Not assigned"}
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium text-gray-400">
              Added {distributor.createdAt ? new Date(distributor.createdAt).toLocaleDateString() : "recently"}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(distributor)}
                disabled={busy}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(distributor)}
                disabled={busy}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
