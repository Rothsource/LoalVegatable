// components/distributors/DistributorCard.tsx
"use client";

import React from "react";
import type { Distributor } from "@/types/distributor";
import { Mail, Calendar, Phone, CheckCircle2, AlertCircle, Trash2, Truck } from "lucide-react";

type Props = {
  distributor: Distributor;
  busy: boolean;
  onDelete: (distributor: Distributor) => void;
  onToggleStatus: (distributor: Distributor) => void;
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "D";
}

const STATUS_STYLE: Record<Distributor["status"], { badge: string; dot: string }> = {
  Pending: { badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  Active: { badge: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  Inactive: { badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
};

export default function DistributorCard({ distributor, busy, onDelete, onToggleStatus }: Props) {
  const canToggle = distributor.status !== "Pending";
  const style = STATUS_STYLE[distributor.status] || STATUS_STYLE.Inactive;

  return (
    <article className="group relative rounded-3xl border border-[#dfe6d9] bg-white p-5 card-shadow hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#edf6e9] text-[#2E6F40] font-black text-sm border border-[#d1e6cb] shadow-xs">
              {initials(distributor.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-black text-[#182216]">{distributor.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-[#647060] truncate mt-0.5">
                <Mail size={13} className="shrink-0 text-[#2E6F40]" />
                <span className="truncate">{distributor.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => canToggle && onToggleStatus(distributor)}
            disabled={busy || !canToggle}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider transition cursor-pointer disabled:opacity-60 ${style.badge}`}
            title={!canToggle ? "Waiting on admin approval" : "Click to toggle active status"}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            <span>{busy ? "Updating…" : distributor.status}</span>
          </button>
        </div>

        {/* Info Grid */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-[#fafbf9] border border-[#edf2ea] rounded-2xl p-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#82927f]">Courier Role</span>
            <p className="font-extrabold text-[#182216] mt-0.5 flex items-center gap-1">
              <Truck size={13} className="text-[#2E6F40]" /> Delivery Partner
            </p>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#82927f]">Joined Network</span>
            <p className="font-extrabold text-[#182216] mt-0.5 flex items-center gap-1">
              <Calendar size={13} className="text-[#2E6F40]" />
              {distributor.createdAt ? new Date(distributor.createdAt).toLocaleDateString() : "Recently"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3.5 border-t border-[#f0f4ee] flex items-center justify-between text-xs">
        <span className="text-[11px] font-medium text-[#7d8b79]">
          Authorized local courier
        </span>

        <button
          type="button"
          onClick={() => onDelete(distributor)}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
          title="Remove distributor"
        >
          <Trash2 size={13} />
          <span>Remove</span>
        </button>
      </div>
    </article>
  );
}