"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [admin, setAdmin] = useState<{
    firstName: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");

    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }

    const info = localStorage.getItem("adminInfo");

    if (info) {
      try {
        setAdmin(JSON.parse(info));
      } catch {
        setAdmin(null);
      }
    }
  }, [router]);

  return (
    <main className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />

      <section className="min-w-0 flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-[#dfe6d9]/80 bg-[#fbf8f2]/90 backdrop-blur-md px-8 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#dfe6d9] p-1 flex items-center justify-center shadow-2xs overflow-hidden sm:hidden">
              <img src="/image/logo.png" alt="LocalVegetable" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight font-heading">
              Admin Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#edf6e9] text-[var(--leaf-dark)] border border-[#c8dfc5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--leaf)] animate-pulse" />
              Live Ecosystem
            </span>
          </div>

          <div className="flex items-center gap-3">
            {admin ? (
              <div className="flex items-center gap-2.5 bg-white border border-[#dfe6d9] rounded-xl px-3.5 py-1.5 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-[var(--leaf)] text-white font-black text-xs flex items-center justify-center">
                  {admin.firstName ? admin.firstName[0].toUpperCase() : "A"}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[var(--foreground)] leading-tight">
                    {admin.firstName}
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--leaf-accent)] uppercase tracking-wider">
                    {admin.role || "Administrator"}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-xs font-bold text-[#8a9987]">Signed in</span>
            )}
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl p-6 lg:p-8 flex-1">{children}</div>
      </section>
    </main>
  );
}