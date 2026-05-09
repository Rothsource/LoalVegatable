"use client";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { label: "Home",    href: "/home"    },
  { label: "Product", href: "/product" },
  { label: "Order",   href: "/order"   },
  { label: "Menu",    href: "/menu"    },
];

export default function Navbar({ lowStock = [] }: { lowStock?: { name: string; stock: number }[] }) {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/home" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shadow">
              <span className="text-white text-xs font-black">LV</span>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">
              LocalVeg <span className="text-green-500 font-medium">Merchant</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-0.5">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-green-50 hover:text-green-700 transition-all">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {lowStock.length > 0 && (
              <button onClick={() => setShowAlert(true)}
                className="relative w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {lowStock.length}
                </span>
              </button>
            )}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <div className="w-5 h-5 rounded-md bg-green-600 text-white text-[10px] font-black flex items-center justify-center">D</div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">Dara</span>
            </div>
          </div>
        </div>
        <div className="sm:hidden flex border-t border-gray-100">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href}
              className="flex-1 flex items-center justify-center py-2.5 text-xs font-medium text-gray-500 hover:text-green-700 transition">
              {n.label}
            </Link>
          ))}
        </div>
      </header>

      {showAlert && lowStock.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-amber-800">Low Stock Alert</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {lowStock.map((p) => `${p.name} (${p.stock} left)`).join(" · ")}
                </p>
              </div>
            </div>
            <button onClick={() => setShowAlert(false)} className="text-amber-400 hover:text-amber-700 transition font-bold text-sm">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
