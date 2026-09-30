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
  items: {
    id?: string;
    quantity: number;
    unit_price?: number;
    total_price?: number;
    product?: { name: string; unit: string; profile_pic_url?: string } | null;
    products?: { name: string; unit: string; profile_pic_url?: string } | null;
  }[];
  pickup?: {
    label: string;
    address: string;
    coordinates?: { latitude: number; longitude: number };
  };
};

const ORDER_SELECT = `
  id, status, total_amount, created_at, accepted_at, arrived_at, completed_at, distributor_id,
  address:address_id ( street, province, phone, lat, lng ),
  customer:user_id ( first_name, last_name ),
  items:order_items ( quantity, product:product_id ( name, unit ) )
`;

// Pickup location priority:
// 1. Distributor's own Phnom Penh hub (profile_distributors.address, latitude, longitude)
// 2. Fallback: distributor_id -> profile_distributors.merchant_id -> merchant_locations.
async function resolvePickup(distributorId: string | null): Promise<{ label: string; address: string; coordinates?: { latitude: number; longitude: number } }> {
  const fallback = { label: "Pickup location", address: "Address unavailable" };
  if (!distributorId) return fallback;

  try {
    const supabase = createClient();
    const { data: dist } = await supabase
      .from("profile_distributors")
      .select("merchant_id, address, latitude, longitude")
      .eq("id", distributorId)
      .maybeSingle();

    if (dist?.address) {
      const lat = dist.latitude != null ? Number(dist.latitude) : NaN;
      const lng = dist.longitude != null ? Number(dist.longitude) : NaN;
      return {
        label: "Distributor Hub (Phnom Penh)",
        address: dist.address,
        coordinates: !isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : undefined,
      };
    }

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
  const pickup = row.pickup || (await resolvePickup(row.distributor_id));

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
    items: (row.items ?? []).map((it: any) => {
      const prod = Array.isArray(it.product)
        ? it.product[0]
        : Array.isArray(it.products)
        ? it.products[0]
        : (it.product || it.products);
      return {
        name: prod?.name || "Fresh Produce",
        quantity: Number(it.quantity || 1),
        unit: prod?.unit || "kg",
      };
    }),
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
  getDeliveryById(id: string): Promise<DeliveryRequest | null>;
  getNotifications(): Promise<DeliveryNotification[]>;
  markNotificationsRead(): Promise<void>;
  markNotificationRead(id: string): Promise<void>;
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

      // Trigger Supabase OTP verification email
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });

      if (otpError) {
        console.warn("Delivery signInWithOtp warning:", otpError.message);
        if (otpError.status === 429) {
          return { ok: false, message: "Too many attempts. Please wait a minute before requesting another code." };
        }
      }

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

  // ---- Below: real orders fetching via secure server API with client fallback ----

  async getIncomingDeliveries(): Promise<DeliveryRequest[]> {
    try {
      const res = await fetch("/api/delivery/orders?type=incoming");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          return Promise.all(data.orders.map((row: OrderRow) => mapOrderToRequest(row, "incoming")));
        }
      }
    } catch (err) {
      console.warn("Falling back to client query for incoming orders:", err);
    }

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

    try {
      const res = await fetch(`/api/delivery/orders?type=current&riderId=${encodeURIComponent(riderId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          return mapOrderToRequest(data.order as OrderRow, "accepted");
        }
        return null;
      }
    } catch (err) {
      console.warn("Falling back to client query for current delivery:", err);
    }

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

    try {
      const res = await fetch(`/api/delivery/orders?type=history&riderId=${encodeURIComponent(riderId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          const mapped = await Promise.all(
            data.orders.map((row: OrderRow) => mapOrderToRequest(row, "completed"))
          );
          return mapped as DeliveryHistoryItem[];
        }
      }
    } catch (err) {
      console.warn("Falling back to client query for delivery history:", err);
    }

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

  async getDeliveryById(id: string): Promise<DeliveryRequest | null> {
    try {
      const res = await fetch(`/api/delivery/orders?type=single&id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          const status = data.order.status === "delivered" ? "completed" : data.order.delivery_id ? "accepted" : "incoming";
          return mapOrderToRequest(data.order as OrderRow, status as DeliveryRequest["status"]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch delivery by id:", err);
    }
    return null;
  }

  async getNotifications(): Promise<DeliveryNotification[]> {
    const riderId = await this.getRiderId();
    const readIds: string[] = (() => {
      if (typeof window === "undefined") return [];
      try {
        return JSON.parse(localStorage.getItem("delivery_read_notifications") || "[]");
      } catch {
        return [];
      }
    })();

    const notifications: DeliveryNotification[] = [];

    try {
      const res = await fetch(`/api/delivery/orders?type=notifications${riderId ? `&riderId=${encodeURIComponent(riderId)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        (data.incoming ?? []).forEach((order: any) => {
          const notifId = `incoming-${order.id}`;
          notifications.push({
            id: notifId,
            deliveryId: order.id,
            title: "Dispatch Available",
            message: `Order #${String(order.id).slice(0, 8)} ($${Number(order.total_amount).toFixed(2)}) is ready for courier delivery.`,
            createdAt: order.created_at,
            read: readIds.includes(notifId),
          });
        });

        (data.assigned ?? []).forEach((order: any) => {
          const notifId = `assigned-${order.id}-${order.status}`;
          const isDelivered = order.status === "delivered";
          notifications.push({
            id: notifId,
            deliveryId: order.id,
            title: isDelivered ? "Delivery Completed" : "Active Dispatch",
            message: isDelivered
              ? `Order #${String(order.id).slice(0, 8)} was delivered successfully.`
              : `Order #${String(order.id).slice(0, 8)} is assigned to you for delivery.`,
            createdAt: order.completed_at || order.accepted_at || order.created_at,
            read: readIds.includes(notifId),
          });
        });

        return notifications.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch (err) {
      console.warn("Falling back to client query for notifications:", err);
    }

    const supabase = createClient();

    // 1. Available incoming dispatch requests
    const { data: incomingOrders } = await supabase
      .from("orders")
      .select("id, total_amount, created_at")
      .eq("status", "out_for_delivery")
      .is("delivery_id", null)
      .order("created_at", { ascending: false })
      .limit(10);

    (incomingOrders ?? []).forEach((order) => {
      const notifId = `incoming-${order.id}`;
      notifications.push({
        id: notifId,
        deliveryId: order.id,
        title: "Dispatch Available",
        message: `Order #${String(order.id).slice(0, 8)} ($${Number(order.total_amount).toFixed(2)}) is ready for courier delivery.`,
        createdAt: order.created_at,
        read: readIds.includes(notifId),
      });
    });

    // 2. Assigned orders for this rider
    if (riderId) {
      const { data: assignedOrders } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at, accepted_at, completed_at")
        .eq("delivery_id", riderId)
        .order("created_at", { ascending: false })
        .limit(6);

      (assignedOrders ?? []).forEach((order) => {
        const notifId = `assigned-${order.id}-${order.status}`;
        const isDelivered = order.status === "delivered";
        notifications.push({
          id: notifId,
          deliveryId: order.id,
          title: isDelivered ? "Delivery Completed" : "Active Dispatch",
          message: isDelivered
            ? `Order #${String(order.id).slice(0, 8)} was delivered successfully.`
            : `Order #${String(order.id).slice(0, 8)} is assigned to you for delivery.`,
          createdAt: order.completed_at || order.accepted_at || order.created_at,
          read: readIds.includes(notifId),
        });
      });
    }

    return notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markNotificationsRead(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const current = await this.getNotifications();
      const allIds = current.map((n) => n.id);
      localStorage.setItem("delivery_read_notifications", JSON.stringify(allIds));
    } catch {}
  }

  async markNotificationRead(id: string): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const readIds: string[] = JSON.parse(
        localStorage.getItem("delivery_read_notifications") || "[]"
      );
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem("delivery_read_notifications", JSON.stringify(readIds));
      }
    } catch {}
  }

  async acceptDelivery(id: string): Promise<ServiceResult> {
    const riderId = await this.getRiderId();
    if (!riderId) return { ok: false, message: "Your rider account isn't set up correctly." };

    try {
      const res = await fetch("/api/delivery/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", orderId: id, riderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.error || "Someone else already accepted this delivery." };
      }
      return { ok: true };
    } catch {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .update({ delivery_id: riderId, accepted_at: new Date().toISOString() })
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
  }

  async markArrived(id: string): Promise<ServiceResult> {
    const riderId = await this.getRiderId();
    if (!riderId) return { ok: false, message: "Your rider account isn't set up correctly." };

    try {
      const res = await fetch("/api/delivery/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "arrive", orderId: id, riderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.error || "We couldn't find that active delivery." };
      }
    } catch {
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
    }

    // Best-effort notify customer
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