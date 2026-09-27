"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { DashboardContext } from "@/lib/dashboardContext";
import { supabase } from "@/lib/supabase";

type LowStockItem = {
  id: string;
  name: string;
  stock: number;
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [merchantName, setMerchantName] = useState("Merchant");
  const [profileUrl, setProfileUrl] = useState("");
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const [profileResult, productsResult] = await Promise.all([
        supabase
          .from("profile_merchants")
          .select("full_name, owner_name, profile_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("products")
          .select("id, name, stock_quantity")
          .eq("merchant_id", user.id)
          .lte("stock_quantity", 10)
          .order("stock_quantity", { ascending: true }),
      ]);

      if (!active) return;

      const profile = profileResult.data;
      if (profile?.owner_name || profile?.full_name) {
        setMerchantName(profile.owner_name || profile.full_name);
      }
      if (profile?.profile_url) setProfileUrl(profile.profile_url);

      setLowStock(
        (productsResult.data ?? []).map((product) => ({
          id: product.id,
          name: product.name,
          stock: product.stock_quantity,
        }))
      );
    }

    void loadDashboardData();
    return () => {
      active = false;
    };
  }, []);

  const updateMerchantIdentity = useCallback(
    (identity: Partial<{ merchantName: string; profileUrl: string }>) => {
      if (identity.merchantName !== undefined) setMerchantName(identity.merchantName);
      if (identity.profileUrl !== undefined) setProfileUrl(identity.profileUrl);
    },
    []
  );

  const contextValue = useMemo(
    () => ({ merchantName, profileUrl, updateMerchantIdentity }),
    [merchantName, profileUrl, updateMerchantIdentity]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <Header lowStock={lowStock} merchantName={merchantName} profileUrl={profileUrl} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}
