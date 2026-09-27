import { FormErrors, FormState } from "@/types/product";

export function stockStatus(qty: number) {
  if (qty === 0)
    return { label: "Out of stock", cls: "bg-red-50 text-red-600 border border-red-100" };
  if (qty <= 10)
    return { label: "Low stock", cls: "bg-amber-50 text-amber-600 border border-amber-100" };
  return { label: "In stock", cls: "bg-emerald-50 text-emerald-700 border border-emerald-100" };
}

export function isExpired(date: string) {
  if (!date) return false;
  const trimmed = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const endOfDay = new Date(`${trimmed}T23:59:59.999`);
    return !isNaN(endOfDay.getTime()) && endOfDay.getTime() < Date.now();
  }
  const d = new Date(trimmed);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

export function isExpiringSoon(date: string) {
  if (!date) return false;
  const trimmed = date.trim();
  let expiryTime: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    expiryTime = new Date(`${trimmed}T23:59:59.999`).getTime();
  } else {
    expiryTime = new Date(trimmed).getTime();
  }
  if (isNaN(expiryTime)) return false;
  const diff = expiryTime - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 24 * 3;
}

export function fmtDate(date: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function validateForm(form: FormState): FormErrors {
  const e: FormErrors = {};
  if (!form.name.trim()) e.name = "Product name is required";
  if (form.quantity === "" || Number(form.quantity) < 0)
    e.quantity = "Enter a valid quantity";
  if (form.price === "" || Number(form.price) < 0)
    e.price = "Enter a valid price";
  if (form.harvestDate && form.expireDate && form.expireDate <= form.harvestDate)
    e.expireDate = "Expire date must be after harvest date";
  return e;
}

// ── Shared Tailwind class strings ─────────────────────────────────────────────
const inputBase =
  "w-full border rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white outline-none transition placeholder:text-gray-400";

export const inputOk = `${inputBase} border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100`;
export const inputErr = `${inputBase} border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
export const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";
export const sectionHead = "text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3";