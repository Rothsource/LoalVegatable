"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn !== "true") {
      router.push("/login");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <section className="flex-1">
        <header className="flex items-center justify-between bg-white px-8 py-4 shadow">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </header>
        <div className="p-8">{children}</div>
      </section>
    </main>
  );
}