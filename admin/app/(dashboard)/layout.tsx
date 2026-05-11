"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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

  function logout() {
    localStorage.removeItem("isLoggedIn");
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6 text-2xl font-bold">Admin Portal</div>

        <nav className="mt-4 space-y-2 px-4">
          <a
            href="/admin"
            className="block rounded-lg bg-blue-600 px-4 py-3 font-medium"
          >
            Dashboard
          </a>

          <a
            href="/users"
            className="block rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            Users
          </a>
          <a
            href="/settings"
            className="block rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            Settings
          </a>
          <a
            href="/merchants"
            className="block rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
          >
            Merchants
           </a>
           <a
            href="/products"
            className="block rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800"
            >
            Products
            </a>
        </nav>
      </aside>

      <section className="flex-1">
        <header className="flex items-center justify-between bg-white px-8 py-4 shadow">
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>

          <button
            onClick={logout}
            className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
          >
            Logout
          </button>
        </header>

        <div className="p-8">{children}</div>
      </section>
    </main>
  );
}
