"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: Props) {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ firstName: string; role: string } | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn !== "true") {
      router.push("/login");
      return;
    }
    const info = localStorage.getItem("adminInfo");
    if (info) setAdmin(JSON.parse(info));
  }, [router]);

  return (
    <main className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <section className="flex-1">
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-8 py-4 shadow">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
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

        {/* Page content */}
        <div className="p-8">{children}</div>
      </section>
    </main>
  );
}
