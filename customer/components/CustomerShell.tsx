"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, ShoppingCart, Bell, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/cart", label: "Cart", icon: ShoppingCart, badgeKey: "cart" },
  { href: "/notifications", label: "Updates", icon: Bell, badgeKey: "orders" },
  { href: "/auth/profile", label: "Profile", icon: User },
];

const AUTH_PAGES_NO_CHROME = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/otp",
  "/auth/user-info",
  "/auth/reset-password",
];

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);

  // Sync cart count
  const syncCart = () => {
    try {
      const raw = localStorage.getItem("cart-products");
      if (!raw) {
        setCartCount(0);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setCartCount(parsed.reduce((sum: number, it: any) => sum + (it.qty || 1), 0));
      } else if (typeof parsed === "object") {
        const values = Object.values(parsed) as any[];
        setCartCount(values.reduce((sum: number, it: any) => sum + (it.qty || 1), 0));
      }
    } catch {
      setCartCount(0);
    }
  };

  // Sync active orders
  const syncOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setActiveOrderCount(0);
        return;
      }
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["pending", "accepted", "out_for_delivery", "delivering"]);

      if (count !== null) setActiveOrderCount(count);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    syncCart();
    syncOrders();

    const onStorage = () => syncCart();
    window.addEventListener("storage", onStorage);
    const interval = setInterval(syncCart, 2000);

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      syncOrders();
    });

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
      listener.subscription.unsubscribe();
    };
  }, [pathname]);

  const isAuthPage = AUTH_PAGES_NO_CHROME.includes(pathname);

  // If on a standalone auth onboarding page, render clean focused view
  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf8f2]">
      {/* ── Persistent Desktop & Mobile Header ── */}
      <Navbar />

      {/* ── Main Dynamic Content Area ── */}
      <main className="flex-1 safe-bottom w-full">
        {children}
      </main>

      {/* ── Persistent Footer ── */}
      <Footer />

      {/* ── Persistent Mobile Bottom Navigation Bar (Modern Native Style) ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#dfe6d9] bg-white/95 px-2 pt-1.5 pb-2 shadow-[0_-8px_30px_rgba(46,111,64,0.08)] backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const badge =
            item.badgeKey === "cart" && cartCount > 0
              ? cartCount
              : item.badgeKey === "orders" && activeOrderCount > 0
              ? activeOrderCount
              : null;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] font-bold tab-smooth active:scale-95 ${
                isActive
                  ? "text-[#0A490A]"
                  : "text-[#647060] hover:text-[#182216]"
              }`}
            >
              <div
                className={`relative grid h-8 w-12 place-items-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-[#0DB30D]/15 text-[#0A490A] shadow-sm"
                    : "text-[#647060]"
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                {badge !== null && (
                  <span
                    className={`absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-black text-white ${
                      item.badgeKey === "orders" ? "bg-[#d97706]" : "bg-[#0DB30D]"
                    }`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={`tracking-tight ${isActive ? "font-extrabold text-[#0A490A]" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
