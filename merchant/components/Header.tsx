"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = { label: string; href: string; icon: React.ReactNode };
type LowStockItem = { name: string; stock: number };

interface HeaderProps {
  /** Items whose stock is at or below the low-stock threshold */
  lowStock?: LowStockItem[];
  /** Currently active route, e.g. "/home" */
  activePath?: string;
  /** Merchant display name */
  merchantName?: string;
  /** Merchant avatar initial (defaults to first char of merchantName) */
  avatarInitial?: string;
}

// ─── Icons (inline SVG helpers) ──────────────────────────────────────────────

const Icon = {
  Home: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Product: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Order: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  ),
};

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { label: "Home",    href: "/home",    icon: <Icon.Home />    },
  { label: "Product", href: "/product", icon: <Icon.Product /> },
  { label: "Order",   href: "/order",   icon: <Icon.Order />   },
  { label: "Menu",    href: "/menu",    icon: <Icon.Menu />    },
];

// ─── Low-Stock Dropdown ───────────────────────────────────────────────────────

function StockDropdown({ items, onClose }: { items: LowStockItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50"
      style={{ animation: "dropIn 0.18s cubic-bezier(.22,.68,0,1.2) both" }}
    >
      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-amber-50">
        <div className="flex items-center gap-2">
          <span className="text-amber-500"><Icon.Warning /></span>
          <span className="text-xs font-bold text-amber-800">Low Stock Alert</span>
        </div>
        <button
          onClick={onClose}
          className="text-amber-400 hover:text-amber-700 transition-colors rounded-lg p-0.5"
          aria-label="Close"
        >
          <Icon.Close />
        </button>
      </div>

      {/* Item list */}
      <ul className="divide-y divide-gray-50">
        {items.map((item) => (
          <li key={item.name} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                item.stock === 0
                  ? "bg-red-100 text-red-600"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {item.stock === 0 ? "Out of stock" : `${item.stock} left`}
            </span>
          </li>
        ))}
      </ul>

      {/* Footer CTA */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <Link
          href="/product"
          onClick={onClose}
          className="block w-full text-center text-xs font-bold text-green-700 hover:text-green-800 transition-colors py-1"
        >
          Manage Inventory →
        </Link>
      </div>
    </div>
  );
}

// ─── User Menu Dropdown ───────────────────────────────────────────────────────

function UserMenu({ initial, name, onClose }: { initial: string; name: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const menuItems = [
    { label: "My Profile",    href: "/profile"  },
    { label: "Store Settings",href: "/settings" },
    { label: "Help Center",   href: "/help"     },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-50"
      style={{ animation: "dropIn 0.18s cubic-bezier(.22,.68,0,1.2) both" }}
    >
      {/* Profile header */}
      <div className="px-4 py-3 bg-green-50 border-b border-green-100/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-green-600 text-white text-sm font-black flex items-center justify-center shadow-sm">
          {initial}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{name}</p>
          <p className="text-[10px] text-green-600 font-semibold">Merchant</p>
        </div>
      </div>

      <ul className="py-1.5">
        {menuItems.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              onClick={onClose}
              className="block px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-100 py-1.5">
        <button className="w-full text-left px-4 py-2 text-sm text-red-500 font-medium hover:bg-red-50 transition-colors">
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Main Header Component ────────────────────────────────────────────────────

export default function Header({
  lowStock = [],
  activePath = "/home",
  merchantName = "Dara",
  avatarInitial,
}: HeaderProps) {
  const initial = avatarInitial ?? merchantName.charAt(0).toUpperCase();

  const [stockOpen, setStockOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns when either opens
  const openStock = () => { setStockOpen(true);  setUserOpen(false);  };
  const openUser  = () => { setUserOpen(true);   setStockOpen(false); };

  return (
    <>
      {/* ── Sticky bar ── */}
      <header
        className={`sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-shadow duration-200 ${
          scrolled ? "shadow-md shadow-gray-200/60" : "shadow-sm"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center shadow group-hover:scale-105 transition-transform duration-150">
              <span className="text-white text-xs font-black">LV</span>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight hidden xs:block">
              LocalVeg{" "}
              <span className="text-green-500 font-medium">Merchant</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5" aria-label="Main navigation">
            {NAV.map((n) => {
              const isActive = activePath === n.href;
              return (
                <Link
                  key={n.label}
                  href={n.href}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-green-50 text-green-700 font-semibold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={isActive ? "text-green-600" : "text-gray-400"}>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Stock alert bell */}
            {lowStock.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => (stockOpen ? setStockOpen(false) : openStock())}
                  aria-label={`${lowStock.length} low stock alert${lowStock.length > 1 ? "s" : ""}`}
                  className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                    stockOpen
                      ? "bg-amber-100 border-amber-300 text-amber-600"
                      : "bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100"
                  }`}
                >
                  <Icon.Bell />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow">
                    {lowStock.length}
                  </span>
                </button>
                {stockOpen && (
                  <StockDropdown items={lowStock} onClose={() => setStockOpen(false)} />
                )}
              </div>
            )}

            {/* User pill */}
            <div className="relative">
              <button
                onClick={() => (userOpen ? setUserOpen(false) : openUser())}
                className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-colors ${
                  userOpen
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-200"
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-green-600 text-white text-[10px] font-black flex items-center justify-center">
                  {initial}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">{merchantName}</span>
                <span className={`text-gray-400 transition-transform duration-150 ${userOpen ? "rotate-180" : ""}`}>
                  <Icon.ChevronDown />
                </span>
              </button>
              {userOpen && (
                <UserMenu initial={initial} name={merchantName} onClose={() => setUserOpen(false)} />
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <Icon.Close /> : <Icon.Menu />}
            </button>
          </div>
        </div>

        {/* Mobile bottom nav strip */}
        <div className="sm:hidden flex border-t border-gray-100">
          {NAV.map((n) => {
            const isActive = activePath === n.href;
            return (
              <Link
                key={n.label}
                href={n.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                  isActive ? "text-green-700 bg-green-50/60" : "text-gray-400 hover:text-green-600"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={isActive ? "text-green-600" : "text-gray-400"}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* ── Mobile full-screen menu ── */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-30 bg-white/95 backdrop-blur-md pt-16 px-6 pb-8 flex flex-col gap-2">
          {NAV.map((n) => {
            const isActive = activePath === n.href;
            return (
              <Link
                key={n.label}
                href={n.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-green-100 text-green-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className={`${isActive ? "text-green-600" : "text-gray-400"}`}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}

          {lowStock.length > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-2">
                <Icon.Warning /> Low Stock ({lowStock.length})
              </p>
              {lowStock.map((item) => (
                <p key={item.name} className="text-xs text-amber-700 font-medium py-0.5">
                  · {item.name} — <span className="font-bold">{item.stock} left</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Low-stock banner (below header) ── */}
      {lowStock.length > 0 && (
        <LowStockBanner items={lowStock} />
      )}
    </>
  );
}

// ─── Dismissible banner ───────────────────────────────────────────────────────

function LowStockBanner({ items }: { items: LowStockItem[] }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-amber-500 flex-shrink-0"><Icon.Warning /></span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800">Low Stock Alert</p>
            <p className="text-xs text-amber-600 mt-0.5 truncate">
              {items.map((p) => `${p.name} (${p.stock} left)`).join(" · ")}
            </p>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-amber-400 hover:text-amber-700 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-amber-100"
          aria-label="Dismiss alert"
        >
          <Icon.Close />
        </button>
      </div>
    </div>
  );
}