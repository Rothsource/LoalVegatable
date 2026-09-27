"use client";

import React, { useEffect } from "react";
import { X, Package, Leaf, MapPin, Phone, CheckCircle2, ShoppingBag } from "lucide-react";

export type OrderItemPreview = {
  id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  quantity: number;
  unit?: string;
  unit_price?: number;
  total_price?: number;
  img?: string;
};

export type OrderPreviewModalData = {
  orderId: string;
  totalAmount: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  address?: {
    province?: string | null;
    street?: string | null;
    phone?: string | null;
  } | null;
  items: OrderItemPreview[];
};

type Props = {
  order: OrderPreviewModalData | null;
  onClose: () => void;
};

export default function OrderItemsPictureModal({ order, onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (order) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [order, onClose]);

  if (!order) return null;

  const totalQuantity = order.items.reduce((acc, it) => acc + (it.quantity || 1), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#dfe6d9] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f4ee] px-6 py-5 bg-[#fafbf9]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf6e9] text-[#2E6F40] shadow-xs">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#182216]">
                  Order #{order.orderId.slice(0, 8).toUpperCase()}
                </h3>
                {order.status && (
                  <span className="rounded-full bg-[#edf6e9] border border-[#c8dfc5] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#2E6F40]">
                    {order.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#647060] mt-0.5">
                {order.items.length} {order.items.length === 1 ? "crop line" : "crop lines"} · {totalQuantity} units total
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#dfe6d9] text-[#647060] hover:bg-[#f2f5ef] hover:text-[#182216] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Address & Total Banner */}
        <div className="px-6 py-3.5 bg-[#f5f8f3] border-b border-[#ecf1ea] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#465443] min-w-0">
            <MapPin size={15} className="text-[#2E6F40] shrink-0" />
            <span className="truncate font-semibold">
              {order.address?.province || "Phnom Penh"}{order.address?.street ? ` · ${order.address.street}` : ""}
            </span>
            {order.address?.phone && (
              <span className="text-[#647060] font-normal">({order.address.phone})</span>
            )}
          </div>

          <div className="text-right">
            <span className="text-base font-black text-[#0A490A]">
              {Number(order.totalAmount).toLocaleString()} KHR
            </span>
          </div>
        </div>

        {/* Scrollable Produce Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-wider text-[#647060]">
            Customer Ordered Produce & Pictures
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {order.items.map((item, index) => {
              const name = item.product_name || item.name || "Local Fresh Vegetable";
              const unit = item.unit || "kg";
              const qty = item.quantity || 1;
              const unitPrice = item.unit_price || 0;
              const totalPrice = item.total_price || (qty * unitPrice);

              return (
                <div
                  key={item.id || index}
                  className="flex gap-3.5 rounded-2xl border-2 border-[#e6eee3] bg-white p-3.5 shadow-xs hover:border-[#2E6F40]/40 transition-all"
                >
                  {/* Vegetable Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#dfe6d9] bg-[#f5f8f3]">
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.display = "none";
                          const fallback = target.parentElement?.querySelector(".img-fallback") as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="img-fallback h-full w-full flex flex-col items-center justify-center bg-[#eff5ec] text-[#2E6F40]"
                      style={{ display: item.img ? "none" : "flex" }}
                    >
                      <Leaf size={24} />
                      <span className="text-[9px] font-extrabold uppercase mt-1">Produce</span>
                    </div>
                  </div>

                  {/* Vegetable Details */}
                  <div className="flex flex-col justify-between min-w-0 flex-1">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#182216] leading-tight line-clamp-1">
                        {name}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#edf6e9] px-2 py-0.5 text-[11px] font-black text-[#2E6F40]">
                          <Package size={11} /> {qty} {unit}
                        </span>
                        {unitPrice > 0 && (
                          <span className="text-[11px] text-[#647060]">
                            @{Number(unitPrice).toLocaleString()} KHR/{unit}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-[#f4f7f2] pt-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#8a9886]">Subtotal</span>
                      <span className="text-xs font-black text-[#182216]">
                        {Number(totalPrice).toLocaleString()} KHR
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#f0f4ee] px-6 py-4 bg-[#fafbf9] flex items-center justify-between">
          <span className="text-xs font-bold text-[#647060]">
            Fresh local harvest verified by local grower
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#2E6F40] hover:bg-[#0A490A] px-5 py-2.5 text-xs font-black text-white shadow-sm transition cursor-pointer"
          >
            Done Viewing
          </button>
        </div>
      </div>
    </div>
  );
}
