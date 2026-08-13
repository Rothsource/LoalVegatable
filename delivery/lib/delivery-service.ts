import {
  createInitialDemoState,
  DEMO_AUTH,
  DEMO_INCOMING_DELIVERY,
  DEMO_NOTIFICATION,
  DEMO_USER,
} from "@/lib/demo-data";
import type {
  DeliveryHistoryItem,
  DeliveryNotification,
  DeliveryRequest,
  DeliveryUser,
  DemoDeliveryState,
  ServiceResult,
} from "@/lib/types";

const STORAGE_KEY = "localveg-delivery-demo-v1";
const WAIT_MS = 420;

function wait() {
  return new Promise((resolve) => setTimeout(resolve, WAIT_MS));
}

function readState(): DemoDeliveryState {
  if (typeof window === "undefined") return createInitialDemoState();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = createInitialDemoState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    return JSON.parse(stored) as DemoDeliveryState;
  } catch {
    const initial = createInitialDemoState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeState(state: DemoDeliveryState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
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

class MockDeliveryService implements DeliveryService {
  async getState() {
    await wait();
    return readState();
  }

  async login(email: string, password: string) {
    await wait();
    const state = readState();
    if (email.toLowerCase() !== DEMO_AUTH.authorizedEmail || password !== state.password) {
      return { ok: false, message: "That email or password doesn't match the demo rider account." };
    }
    writeState({ ...state, user: { ...DEMO_USER } });
    return { ok: true };
  }

  async startActivation(email: string) {
    await wait();
    if (email.toLowerCase() !== DEMO_AUTH.authorizedEmail) {
      return {
        ok: false,
        message: "This email has not been authorized for Delivery access. Try the demo email below.",
      };
    }
    const state = readState();
    writeState({ ...state, activationEmail: email.toLowerCase() });
    return { ok: true };
  }

  async verifyCode(code: string) {
    await wait();
    if (code !== DEMO_AUTH.verificationCode) {
      return { ok: false, message: "That code is incorrect or expired. Use the demo code shown below." };
    }
    return { ok: true };
  }

  async resendCode() {
    await wait();
    return { ok: true, message: "A fresh demo code is ready." };
  }

  async setPassword(password: string) {
    await wait();
    const state = readState();
    writeState({ ...state, password, user: { ...DEMO_USER, email: state.activationEmail || DEMO_USER.email } });
    return { ok: true };
  }

  async logout() {
    await wait();
    const state = readState();
    writeState({ ...state, user: null });
  }

  async getIncomingDeliveries() {
    await wait();
    return readState().incoming;
  }

  async getCurrentDelivery() {
    await wait();
    return readState().current;
  }

  async getDeliveryHistory() {
    await wait();
    return readState().history;
  }

  async getNotifications() {
    await wait();
    return readState().notifications;
  }

  async markNotificationsRead() {
    const state = readState();
    writeState({
      ...state,
      notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
    });
  }

  async acceptDelivery(id: string) {
    await wait();
    const state = readState();
    if (state.current) {
      return { ok: false, message: "Finish your current delivery before accepting another request." };
    }
    const request = state.incoming.find((item) => item.id === id);
    if (!request) return { ok: false, message: "This request is no longer available." };
    const current: DeliveryRequest = {
      ...request,
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    };
    writeState({
      ...state,
      incoming: state.incoming.filter((item) => item.id !== id),
      current,
      notifications: state.notifications.map((notification) =>
        notification.deliveryId === id ? { ...notification, read: true } : notification
      ),
    });
    return { ok: true };
  }

  async markArrived(id: string) {
    await wait();
    const state = readState();
    if (!state.current || state.current.id !== id) {
      return { ok: false, message: "We couldn't find that active delivery." };
    }
    const completedAt = new Date().toISOString();
    const completed: DeliveryHistoryItem = {
      ...state.current,
      status: "completed",
      arrivedAt: completedAt,
      completedAt,
    };
    writeState({ ...state, current: null, history: [completed, ...state.history] });
    return { ok: true };
  }

  async setAvailability(available: boolean) {
    const state = readState();
    if (!state.user) return;
    writeState({ ...state, user: { ...state.user, available } });
  }

  async resetDemo(mode: "incoming" | "empty") {
    await wait();
    const current = readState();
    const next: DemoDeliveryState = {
      ...createInitialDemoState(),
      user: current.user ?? { ...DEMO_USER },
      password: current.password,
      activationEmail: current.activationEmail,
    };
    if (mode === "empty") {
      next.incoming = [];
      next.notifications = [];
    } else {
      next.incoming = [{ ...DEMO_INCOMING_DELIVERY }];
      next.notifications = [{ ...DEMO_NOTIFICATION, read: false }];
    }
    return writeState(next);
  }
}

export const deliveryService: DeliveryService = new MockDeliveryService();

export type { DeliveryUser };
