"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/delivery/orders", label: "Orders", icon: "M6 6h12M6 10h12M6 14h7m-7 6h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" },
  { href: "/delivery/products", label: "Products", icon: "m21 8-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8" },
];

export default function DistributorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [name, setName] = useState("Distributor");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      const fullName = data.user?.user_metadata?.full_name;
      if (active && typeof fullName === "string" && fullName.trim()) setName(fullName.trim());
    });
    return () => { active = false; };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <div className="min-h-screen bg-[#f5f9f3] text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/delivery/orders" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-green-600 text-xs font-black text-white">LV</span>
            <span className="truncate text-sm font-black">LocalVeg <span className="font-semibold text-green-600">Delivery</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Distributor navigation">
            {links.map((link) => {
              const current = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${current ? "bg-green-50 text-green-700" : "text-gray-500 hover:bg-gray-50"}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden max-w-32 truncate text-sm font-semibold text-gray-600 sm:block">{name}</span>
            <button type="button" onClick={signOut} aria-label="Sign out" className="flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 hover:bg-gray-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17l5-5-5-5m5 5H9m3 8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" /></svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden" aria-label="Mobile distributor navigation">
        {links.map((link) => {
          const current = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-black ${current ? "text-green-700" : "text-gray-400"}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} /></svg>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
