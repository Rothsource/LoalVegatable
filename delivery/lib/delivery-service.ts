// lib/delivery-service.ts
import { createClient } from "@/lib/supabase";
import type {
  DeliveryHistoryItem,
  DeliveryNotification,
  DeliveryRequest,
  DeliveryUser,
  DemoDeliveryState,
  ServiceResult,
} from "@/lib/types";

const PENDING_EMAIL_KEY = "localveg-delivery-pending-email";

function getPendingEmail(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(PENDING_EMAIL_KEY) ?? "";
}
function setPendingEmail(email: string) {
  window.sessionStorage.setItem(PENDING_EMAIL_KEY, email);
}
function clearPendingEmail() {
  window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
}

async function fetchDeliveryUser(authUserId: string, authEmail: string): Promise<DeliveryUser | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deliveries")
    .select("id, first_name, last_name, phone, is_active")
    .eq("user_id", authUserId)
    .single();

  if (error || !data) return null;

  const storedDuty = typeof window !== "undefined" ? localStorage.getItem("delivery_duty_status") : null;
  const isAvailable = storedDuty !== null ? storedDuty === "true" : (data.is_active ?? true);

  return {
    id: data.id, // this is deliveries.id — the value stored in orders.delivery_id once claimed
    name: `${data.first_name} ${data.last_name}`.trim(),
    email: authEmail,
    phone: data.phone ?? "",
    accountStatus: data.is_active ? "active" : "offline",
    available: isAvailable,
  };
}

// Raw shape returned by our order queries before mapping to DeliveryRequest
type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  distributor_id: string | null;
  address: {
    street: string | null;
    province: string | null;
    phone: string | null;
    lat?: number | string | null;
    lng?: number | string | null;
  } | null;
  customer: { first_name: string | null; last_name: string | null } | null;
  items: { quantity: number; product: { name: string; unit: string } | null }[];
};

const ORDER_SELECT = `
  id, status, total_amount, created_at, accepted_at, arrived_at, completed_at, distributor_id,
  address:address_id ( street, province, phone, lat, lng ),
  customer:user_id ( first_name, last_name ),
  items:order_items ( quantity, product:product_id ( name, unit ) )
`;

// Pickup location can't be joined in one query — orders.distributor_id points
// to auth.users, not profile_distributors, so we resolve it in a second step:
// distributor_id -> profile_distributors.merchant_id -> merchant_locations.
async function resolvePickup(distributorId: string | null): Promise<{ label: string; address: string; coordinates?: { latitude: number; longitude: number } }> {
  const fallback = { label: "Pickup location", address: "Address unavailable" };
  if (!distributorId) return fallback;

  try {
    const supabase = createClient();
    const { data: dist } = await supabase
      .from("profile_distributors")
      .select("merchant_id")
      .eq("id", distributorId)
      .maybeSingle();
    if (!dist?.merchant_id) return fallback;

    const { data: loc } = await supabase
      .from("merchant_locations")
      .select("address, latitude, longitude")
      .eq("merchant_id", dist.merchant_id)
      .limit(1)
      .maybeSingle();
    if (!loc?.address) return fallback;

    const lat = loc.latitude != null ? Number(loc.latitude) : NaN;
    const lng = loc.longitude != null ? Number(loc.longitude) : NaN;

    return {
      label: "Pickup location",
      address: loc.address,
      coordinates: !isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : undefined,
    };
  } catch {
    return fallback;
  }
}

async function mapOrderToRequest(row: OrderRow, riderStatus: DeliveryRequest["status"]): Promise<DeliveryRequest> {
  const pickup = await resolvePickup(row.distributor_id);

  const rawLat = row.address?.lat != null ? Number(row.address.lat) : NaN;
  const rawLng = row.address?.lng != null ? Number(row.address.lng) : NaN;
  const destCoords =
    !isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0
      ? { latitude: rawLat, longitude: rawLng }
      : undefined;

  let distanceKm = 0;
  let estimatedMinutes = 0;

  if (pickup.coordinates && destCoords) {
    const R = 6371; // Earth radius in km
    const dLat = ((destCoords.latitude - pickup.coordinates.latitude) * Math.PI) / 180;
    const dLon = ((destCoords.longitude - pickup.coordinates.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickup.coordinates.latitude * Math.PI) / 180) *
        Math.cos((destCoords.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Math.round(R * c * 10) / 10;
    // Assume average 25 km/h urban travel + 5 min buffer
    estimatedMinutes = Math.max(5, Math.round((distanceKm / 25) * 60) + 5);
  }

  return {
    id: row.id,
    status: riderStatus,
    receivedAt: row.created_at,
    acceptedAt: row.accepted_at ?? undefined,
    arrivedAt: row.arrived_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    distanceKm,
    estimatedMinutes,
    pickup,
    destination: {
      label: "Customer destination",
      address: [row.address?.street, row.address?.province].filter(Boolean).join(", ") || "Address unavailable",
      coordinates: destCoords,
    },
    customer: {
      name: [row.customer?.first_name, row.customer?.last_name].filter(Boolean).join(" ") || "Customer",
      phone: row.address?.phone ?? "",
    },
    items: (row.items ?? []).map((it) => ({
      name: it.product?.name ?? "Item",
      quantity: Number(it.quantity),
      unit: it.product?.unit ?? "",
    })),
  };
}

export interface DeliveryService {
  getState(): Promise<DemoDeliveryState>;
  login(email: string, password: string): Promise<ServiceResult>;
  startActivation(email: string): Promise<ServiceResult>;
  verifyCode(code: string): Promise<ServiceResult>;
  resendCode(): Promise<ServiceResult>;
  setPassword(password: string): Promise<ServiceResult>;
  logout(): Promise<void>;
  getIncomingDeliveries(): Promise<DeliveryRequest[]>;
  getCurrentDelivery(): Promise<DeliveryRequest | null>;
  getDeliveryHistory(): Promise<DeliveryHistoryItem[]>;
  getNotifications(): Promise<DeliveryNotification[]>;
  markNotificationsRead(): Promise<void>;
  acceptDelivery(id: string): Promise<ServiceResult>;
  markArrived(id: string): Promise<ServiceResult>;
  setAvailability(available: boolean): Promise<void>;
  resetDemo(mode: "incoming" | "empty"): Promise<DemoDeliveryState>;
}

class SupabaseDeliveryService implements DeliveryService {
  private async getRiderId(): Promise<string | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const user = await fetchDeliveryUser(session.user.id, session.user.email ?? "");
    return user?.id ?? null;
  }

  async getState(): Promise<DemoDeliveryState> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user
      ? await fetchDeliveryUser(session.user.id, session.user.email ?? "")
      : null;

    const [incoming, current, history, notifications] = user
      ? await Promise.all([
          this.getIncomingDeliveries(),
          this.getCurrentDelivery(),
          this.getDeliveryHistory(),
          this.getNotifications(),
        ])
      : [[], null, [], []];

    return {
      user,
      incoming,
      current,
      history,
      notifications,
      activationEmail: getPendingEmail(),
      password: "",
    };
  }

  async login(email: string, password: string): Promise<ServiceResult> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { ok: false, message: "That email or password doesn't match your rider account." };
    }
    const user = await fetchDeliveryUser(data.session.user.id, data.session.user.email ?? "");
    if (!user) {
      await supabase.auth.signOut();
      return { ok: false, message: "Your rider account isn't active. Contact your admin." };
    }
    return { ok: true };
  }

  async startActivation(email: string): Promise<ServiceResult> {
    try {
      const res = await fetch(`/api/auth/activate?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.error || "This email has not been authorized for Delivery access." };
      }
      setPendingEmail(email);
      return { ok: true, message: `Welcome ${data.name || ""}`.trim() };
    } catch (err: any) {
      return { ok: false, message: err?.message || "Failed to verify email authorization." };
    }
  }

  async verifyCode(code: string): Promise<ServiceResult> {
    const supabase = createClient();
    const email = getPendingEmail();
    if (!email) return { ok: false, message: "Start again from the activation screen." };
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error || !data.session) {
      return { ok: false, message: "That code is incorrect or expired." };
    }
    return { ok: true };
  }

  async resendCode(): Promise<ServiceResult> {
    const supabase = createClient();
    const email = getPendingEmail();
    if (!email) return { ok: false, message: "Start again from the activation screen." };
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) return { ok: false, message: "Couldn't resend the code. Try again shortly." };
    return { ok: true, message: "A new code is on its way." };
  }

  async setPassword(password: string): Promise<ServiceResult> {
    const email = getPendingEmail();
    if (!email) {
      return { ok: false, message: "Session expired. Please restart activation." };
    }

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.error || "Unable to set your password." };
      }

      // Automatically sign in the rider with their newly set password
      const loginResult = await this.login(email, password);
      if (!loginResult.ok) {
        return { ok: false, message: loginResult.message || "Password set, but automatic sign in failed. Please sign in." };
      }

      clearPendingEmail();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.message || "Unable to set your password. Try again." };
    }
  }

  async logout(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  // ---- Below: real orders table, replacing the old localStorage mock ----

  async getIncomingDeliveries(): Promise<DeliveryRequest[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("status", "out_for_delivery")
      .is("delivery_id", null)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return Promise.all((data as unknown as OrderRow[]).map((row) => mapOrderToRequest(row, "incoming")));
  }

  async getCurrentDelivery(): Promise<DeliveryRequest | null> {
    const riderId = await this.getRiderId();
    if (!riderId) return null;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("delivery_id", riderId)
      .eq("status", "out_for_delivery")
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return mapOrderToRequest(data as unknown as OrderRow, "accepted");
  }

  async getDeliveryHistory(): Promise<DeliveryHistoryItem[]> {
    const riderId = await this.getRiderId();
    if (!riderId) return [];

    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .eq("delivery_id", riderId)
      .eq("status", "delivered")
      .order("completed_at", { ascending: false });

    if (error || !data) return [];
    const mapped = await Promise.all((data as unknown as OrderRow[]).map((row) => mapOrderToRequest(row, "completed")));
    return mapped as DeliveryHistoryItem[];
  }

  async getNotifications(): Promise<DeliveryNotification[]> {
    // Notifications are push-based now (see delivery/lib/push.ts), not stored
    // per-rider in the DB yet. Returning empty until an in-app notification
    // log table exists.
    return [];
  }

  async markNotificationsRead(): Promise<void> {
    // no-op — see getNotifications note above
  }

  async acceptDelivery(id: string): Promise<ServiceResult> {
    const riderId = await this.getRiderId();
    if (!riderId) return { ok: false, message: "Your rider account isn't set up correctly." };

    const supabase = createClient();
    // Atomic claim: only succeeds if still out_for_delivery and unclaimed —
    // same pattern as the distributor's accept().
    const { data, error } = await supabase
      .from("orders")
      .update({ delivery_id: riderId })
      .eq("id", id)
      .eq("status", "out_for_delivery")
      .is("delivery_id", null)
      .select("id");

    if (error) return { ok: false, message: error.message };
    if (!data || data.length === 0) {
      return { ok: false, message: "Someone else already accepted this delivery." };
    }
    return { ok: true };
  }

  async markArrived(id: string): Promise<ServiceResult> {
    const riderId = await this.getRiderId();
    if (!riderId) return { ok: false, message: "Your rider account isn't set up correctly." };

    const supabase = createClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "delivered", arrived_at: now, completed_at: now })
      .eq("id", id)
      .eq("delivery_id", riderId)
      .select("id");

    if (error) return { ok: false, message: error.message };
    if (!data || data.length === 0) {
      return { ok: false, message: "We couldn't find that active delivery." };
    }

    // Best-effort — don't block the UI if the notify call fails.
    // TODO: set NEXT_PUBLIC_CUSTOMER_APP_URL once merchant/customer cross-app
    // URLs are confirmed; same pattern as merchant's out_for_delivery call.
    fetch(`${process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? ""}/api/notify-delivered`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id }),
    }).catch(() => {});

    return { ok: true };
  }

  async setAvailability(available: boolean) {
    if (typeof window !== "undefined") {
      localStorage.setItem("delivery_duty_status", String(available));
    }
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("deliveries").update({ is_active: available }).eq("user_id", user.id);
      }
    } catch {}
  }

  async resetDemo(mode: "incoming" | "empty"): Promise<DemoDeliveryState> {
    // Demo/localStorage reset no longer applies now that data is real.
    // Kept as a no-op passthrough so callers don't break.
    return this.getState();
  }
}

export const deliveryService: DeliveryService = new SupabaseDeliveryService();
export type { DeliveryUser };