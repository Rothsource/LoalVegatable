"use client";

import { createContext, useContext } from "react";

type MerchantIdentity = {
  merchantName: string;
  profileUrl: string;
};

type DashboardContextValue = MerchantIdentity & {
  updateMerchantIdentity: (identity: Partial<MerchantIdentity>) => void;
};

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardShell.");
  }

  return context;
}
