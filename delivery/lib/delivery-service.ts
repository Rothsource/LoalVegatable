// lib/delivery-service.ts
import {createClient} from "@/lib/supabase";
import {
  createInitialDemoState,
  DEMO_INCOMING_DELIVERY,
  DEMO_NOTIFICATION,
} from "@/lib/demo-data";
import type {
  DeliveryHistoryItem,
  DeliveryNotification,
  DeliveryRequest,
  DeliveryUser,
  DemoDeliveryState,
  ServiceResult,
} from "@/lib/types";

const OPS_STORAGE_KEY = "localveg-delivery-ops-v1"; // mock delivery-request data only
const PENDING_EMAIL_KEY = "localveg-delivery-pending-email";

type OpsState = Pick<DemoDeliveryState, "incoming" | "current" | "history" | "notifications">;

function readOps(): OpsState {
  if (typeof window === "undefined") {
    const initial = createInitialDemoState();
    return { incoming: initial.incoming, current: initial.current, history: initial.history, notifications: initial.notifications };
  }
  const stored = window.localStorage.getItem(OPS_STORAGE_KEY);
  if (!stored) {
    const initial = createInitialDemoState();
    const ops: OpsState = { incoming: initial.incoming, current: initial.current, history: initial.history, notifications: initial.notifications };
    window.localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(ops));
    return ops;
  }
  try {
    return JSON.parse(stored) as OpsState;
  } catch {
    const initial = createInitialDemoState();
    return { incoming: initial.incoming, current: initial.current, history: initial.history, notifications: initial.notifications };
  }
}

function writeOps(ops: OpsState) {
  window.localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(ops));
  return ops;
}

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

  if (error || !data || !data.is_active) return null;

  return {
    id: data.id,
    name: `${data.first_name} ${data.last_name}`.trim(),
    email: authEmail,
    phone: data.phone ?? "",
    accountStatus: "active",
    available: true,
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
  async getState(): Promise<DemoDeliveryState> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const ops = readOps();
    const user = session?.user
      ? await fetchDeliveryUser(session.user.id, session.user.email ?? "")
      : null;

    return {
      user,
      ...ops,
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
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      return { ok: false, message: "This email has not been authorized for Delivery access." };
    }
    setPendingEmail(email);
    return { ok: true };
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
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
    if (error || !data.user) {
      return { ok: false, message: "Unable to set your password. Try again." };
    }
    clearPendingEmail();
    return { ok: true };
  }

  async logout(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  // ---- Below: still mock, pending orders/merchant_locations wiring ----

  async getIncomingDeliveries() {
    return readOps().incoming;
  }

  async getCurrentDelivery() {
    return readOps().current;
  }

  async getDeliveryHistory() {
    return readOps().history;
  }

  async getNotifications() {
    return readOps().notifications;
  }

  async markNotificationsRead() {
    const ops = readOps();
    writeOps({ ...ops, notifications: ops.notifications.map((n) => ({ ...n, read: true })) });
  }

  async acceptDelivery(id: string): Promise<ServiceResult> {
    const ops = readOps();
    if (ops.current) return { ok: false, message: "Finish your current delivery before accepting another request." };
    const request = ops.incoming.find((item) => item.id === id);
    if (!request) return { ok: false, message: "This request is no longer available." };
    const current: DeliveryRequest = { ...request, status: "accepted", acceptedAt: new Date().toISOString() };
    writeOps({
      ...ops,
      incoming: ops.incoming.filter((item) => item.id !== id),
      current,
      notifications: ops.notifications.map((n) => (n.deliveryId === id ? { ...n, read: true } : n)),
    });
    return { ok: true };
  }

  async markArrived(id: string): Promise<ServiceResult> {
    const ops = readOps();
    if (!ops.current || ops.current.id !== id) return { ok: false, message: "We couldn't find that active delivery." };
    const completedAt = new Date().toISOString();
    const completed: DeliveryHistoryItem = { ...ops.current, status: "completed", arrivedAt: completedAt, completedAt };
    writeOps({ ...ops, current: null, history: [completed, ...ops.history] });
    return { ok: true };
  }

  async setAvailability(_available: boolean) {
    // no-op for now — will PATCH a real availability column later
  }

  async resetDemo(mode: "incoming" | "empty"): Promise<DemoDeliveryState> {
    const next: OpsState =
      mode === "empty"
        ? { incoming: [], current: null, history: readOps().history, notifications: [] }
        : { incoming: [{ ...DEMO_INCOMING_DELIVERY }], current: null, history: readOps().history, notifications: [{ ...DEMO_NOTIFICATION, read: false }] };
    writeOps(next);
    return this.getState();
  }
}

export const deliveryService: DeliveryService = new SupabaseDeliveryService();
export type { DeliveryUser };