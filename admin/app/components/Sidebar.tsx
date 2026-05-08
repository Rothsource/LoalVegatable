"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Merchants",  href: "/merchants" },  // add this
  { label: "Users",     href: "/users" },
  { label: "Products",  href: "/products" },
  { label: "Orders",    href: "/orders" },
  { label: "Categories",href: "/categories" },
  { label: "Settings",  href: "/settings" },
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
    <aside className="flex h-screen w-64 flex-col bg-gray-900 text-white sticky top-0">
      {/* Logo */}
      <div className="p-6 text-2xl font-bold">Admin Portal</div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-4">
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

      {/* Logout at bottom */}
      <div className="p-4">
        <button
          onClick={logout}
          className="w-full rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
