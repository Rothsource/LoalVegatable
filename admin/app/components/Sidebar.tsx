"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Merchants", href: "/merchants" },
  { label: "Users", href: "/users" },
  { label: "Products", href: "/products" },
  { label: "Orders", href: "/orders" },
  { label: "Deliveries", href: "/deliveries" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("adminInfo");
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6 text-2xl font-bold">
        Admin Portal
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <button
          onClick={logout}
          className="w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}