import type { DeliveryStatus } from "@/types/delivery";

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  "Pending",
  "Confirmed",
  "Preparing",
  "Packaging",
  "Delivering",
  "Delivered",
];

export function normalizeDeliveryStatus(value: unknown): DeliveryStatus {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  return DELIVERY_STATUSES.find((status) => status.toLowerCase() === text) ?? "Pending";
}

export function nextDeliveryStatus(status: DeliveryStatus): DeliveryStatus | null {
  const index = DELIVERY_STATUSES.indexOf(status);
  return index < 0 || index === DELIVERY_STATUSES.length - 1
    ? null
    : DELIVERY_STATUSES[index + 1];
}

export function deliveryActionLabel(status: DeliveryStatus) {
  switch (status) {
    case "Pending": return "Confirm order";
    case "Confirmed": return "Start preparing";
    case "Preparing": return "Start packaging";
    case "Packaging": return "Start delivery";
    case "Delivering": return "Mark delivered";
    default: return "";
  }
}
