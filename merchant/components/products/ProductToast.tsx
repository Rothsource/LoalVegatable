"use client";
import { useState } from "react";
import { Toast } from "@/types/product";
import { Icons } from "./ProductIcons";

// ── useToast hook ─────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, type: Toast["type"] = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  function remove(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, toast, remove };
}

// ── ToastContainer component ──────────────────────────────────────────────────
export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold
            transition-all duration-300 min-w-[220px] max-w-xs
            ${
              t.type === "success"
                ? "bg-white border-emerald-100 text-emerald-700"
                : t.type === "error"
                ? "bg-white border-red-100 text-red-600"
                : "bg-white border-amber-100 text-amber-600"
            }`}
        >
          <span className="flex-shrink-0">
            {t.type === "success" ? (
              <Icons.CheckCircle />
            ) : t.type === "error" ? (
              <Icons.XCircle />
            ) : (
              <Icons.WarnCircle />
            )}
          </span>
          <span className="flex-1 text-gray-800">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
          >
            <Icons.X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}