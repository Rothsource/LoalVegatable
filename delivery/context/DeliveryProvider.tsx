"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { deliveryService } from "@/lib/delivery-service";
import type { DemoDeliveryState, ServiceResult } from "@/lib/types";

type DeliveryContextValue = DemoDeliveryState & {
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<ServiceResult>;
  startActivation: (email: string) => Promise<ServiceResult>;
  verifyCode: (code: string) => Promise<ServiceResult>;
  resendCode: () => Promise<ServiceResult>;
  setPassword: (password: string) => Promise<ServiceResult>;
  logout: () => Promise<void>;
  acceptDelivery: (id: string) => Promise<ServiceResult>;
  markArrived: (id: string) => Promise<ServiceResult>;
  markNotificationsRead: () => Promise<void>;
  setAvailability: (available: boolean) => Promise<void>;
  resetDemo: (mode: "incoming" | "empty") => Promise<void>;
};

const DeliveryContext = createContext<DeliveryContextValue | null>(null);

const EMPTY_STATE: DemoDeliveryState = {
  user: null,
  incoming: [],
  current: null,
  history: [],
  notifications: [],
  activationEmail: "",
  password: "",
};

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoDeliveryState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setState(await deliveryService.getState());
  }, []);

  useEffect(() => {
    let active = true;
    deliveryService.getState().then((next) => {
      if (active) {
        setState(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const runAndRefresh = useCallback(
    async (operation: () => Promise<ServiceResult>) => {
      const result = await operation();
      if (result.ok) await refresh();
      return result;
    },
    [refresh]
  );

  const value = useMemo<DeliveryContextValue>(
    () => ({
      ...state,
      loading,
      refresh,
      login: (email, password) => runAndRefresh(() => deliveryService.login(email, password)),
      startActivation: (email) => runAndRefresh(() => deliveryService.startActivation(email)),
      verifyCode: (code) => deliveryService.verifyCode(code),
      resendCode: () => deliveryService.resendCode(),
      setPassword: (password) => runAndRefresh(() => deliveryService.setPassword(password)),
      logout: async () => {
        await deliveryService.logout();
        await refresh();
      },
      acceptDelivery: (id) => runAndRefresh(() => deliveryService.acceptDelivery(id)),
      markArrived: (id) => runAndRefresh(() => deliveryService.markArrived(id)),
      markNotificationsRead: async () => {
        await deliveryService.markNotificationsRead();
        await refresh();
      },
      setAvailability: async (available) => {
        await deliveryService.setAvailability(available);
        await refresh();
      },
      resetDemo: async (mode) => {
        setState(await deliveryService.resetDemo(mode));
      },
    }),
    [loading, refresh, runAndRefresh, state]
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error("useDelivery must be used within DeliveryProvider");
  return context;
}
