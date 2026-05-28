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
      setAdmin(JSON.parse(info));
    }
  }, [router]);

  return (
    <main className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>

          {admin && (
            <span className="text-sm text-gray-600">
              Welcome,{" "}
              <span className="font-semibold">{admin.firstName}</span>
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {admin.role}
              </span>
            </span>
          )}
        </header>

        <div className="mx-auto w-full max-w-6xl p-8">{children}</div>
      </section>
    </main>
  );
}