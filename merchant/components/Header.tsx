"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

type LowStockItem = {
  id?: string | number;
  name: string;
  stock: number;
};

type HeaderProps = {
  lowStock?: LowStockItem[];
  merchantName?: string;
  profileUrl?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const Icon = {
  Home: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v10h14V10M9 20v-6h6v6" />
    </svg>
  ),
  Product: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Order: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m-6 4h6m-6 4h4m-6 8h10a2 2 0 002-2V7a2 2 0 00-2-2h-1a2 2 0 00-2-2h-4a2 2 0 00-2 2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Distributor: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 1v6m3-3h-6" />
    </svg>
  ),
  Profile: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m14-11a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Bell: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
    </svg>
  ),
  Chevron: () => (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Close: () => (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { label: "Home", href: "/home", icon: <Icon.Home /> },
  { label: "Product", href: "/product", icon: <Icon.Product /> },
  { label: "Order", href: "/order", icon: <Icon.Order /> },
  { label: "Distributor", href: "/distributor", icon: <Icon.Distributor /> },
  { label: "Profile", href: "/profile", icon: <Icon.Profile /> },
];

function MerchantAvatar({
  profileUrl,
  initial,
  className,
}: {
  profileUrl: string;
  initial: string;
  className: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className={`flex flex-shrink-0 items-center justify-center overflow-hidden bg-green-600 font-black text-white ${className}`}>
      {profileUrl && !imageFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NotificationMenu({
  items,
  onClose,
}: {
  items: LowStockItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-black text-gray-900">Notifications</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close notifications">
          <Icon.Close />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-semibold text-gray-600">All clear</p>
          <p className="mt-1 text-xs text-gray-400">No low-stock alerts right now.</p>
        </div>
      ) : (
        <>
          <div className="max-h-72 overflow-y-auto">
            {items.map((item, index) => (
              <div key={item.id ?? `${item.name}-${index}`} className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0">
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${item.stock === 0 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}>
                  <Icon.Bell />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800">{item.name}</p>
                  <p className={`text-xs font-medium ${item.stock === 0 ? "text-red-500" : "text-amber-600"}`}>
                    {item.stock === 0 ? "Out of stock" : `${item.stock} left`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-center">
            <Link href="/product" onClick={onClose} className="text-xs font-bold text-green-700 hover:underline">
              Manage inventory
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function AccountMenu({
  merchantName,
  initial,
  profileUrl,
  onClose,
}: {
  merchantName: string;
  initial: string;
  profileUrl: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [onClose]);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError("");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError(error.message);
      setSigningOut(false);
      return;
    }

    window.location.href = "/auth/login";
  }

  return (
    <div ref={ref} className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="flex items-center gap-3 border-b border-green-100 bg-green-50 px-4 py-3">
        <MerchantAvatar
          key={profileUrl || "initial"}
          profileUrl={profileUrl}
          initial={initial}
          className="h-8 w-8 rounded-xl text-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-800">{merchantName}</p>
          <p className="text-[10px] font-semibold text-green-700">Merchant</p>
        </div>
      </div>
      <div className="p-1.5">
        <Link href="/profile" onClick={onClose} className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          My profile
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
        {signOutError && <p className="px-3 pb-2 text-xs text-red-500">{signOutError}</p>}
      </div>
    </div>
  );
}

export default function Header({ lowStock = [], merchantName = "Merchant", profileUrl }: HeaderProps) {
  const pathname = usePathname();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [fetchedProfileUrl, setFetchedProfileUrl] = useState("");
  const initial = merchantName.trim().charAt(0).toUpperCase() || "M";
  const resolvedProfileUrl = profileUrl ?? fetchedProfileUrl;

  useEffect(() => {
    if (profileUrl !== undefined) return;

    let active = true;
    async function loadProfilePhoto() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from("profile_merchants")
        .select("profile_url")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (active && data?.profile_url) setFetchedProfileUrl(data.profile_url);
    }

    void loadProfilePhoto();
    return () => {
      active = false;
    };
  }, [profileUrl]);

  function toggleNotifications() {
    setNotificationOpen((open) => !open);
    setAccountOpen(false);
  }

  function toggleAccount() {
    setAccountOpen((open) => !open);
    setNotificationOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#dfe6d9] bg-[#faf7f0]/90 shadow-2xs backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/home" className="flex min-w-0 items-center gap-2.5 justify-self-start">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--leaf)] shadow-[0_4px_14px_rgba(13,179,13,0.3)]">
            <span className="text-xs font-black text-white">LV</span>
          </div>
          <span className="hidden truncate text-base font-bold tracking-tight text-[var(--foreground)] font-heading lg:block">
            LocalVeg <span className="font-bold text-[var(--leaf-accent)] font-sans text-xs uppercase tracking-wider ml-1 px-2 py-0.5 rounded-full bg-[#edf6e9] border border-[#c8dfc5]">Merchant</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Merchant navigation">
          {NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex w-[104px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                  active ? "bg-[var(--leaf)] text-white shadow-sm" : "text-[#556353] hover:bg-[#edf5e8] hover:text-[var(--foreground)]"
                }`}
              >
                <span className={active ? "text-white" : "text-[#7a8c76]"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          {/* Order notifications (pending/accepted orders) — separate from the low-stock bell below */}
          <NotificationBell role="merchant" />

          <div className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              aria-label={`${lowStock.length} low-stock alerts`}
              aria-expanded={notificationOpen}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                lowStock.length > 0
                  ? "border-[#f4dfab] bg-[#fef8ea] text-[#935b0b] hover:bg-amber-100"
                  : "border-[#dfe6d9] bg-white text-[#556353] hover:bg-[#fafbf9]"
              }`}
            >
              <Icon.Bell />
              {lowStock.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {lowStock.length}
                </span>
              )}
            </button>
            {notificationOpen && <NotificationMenu items={lowStock} onClose={() => setNotificationOpen(false)} />}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={toggleAccount}
              aria-expanded={accountOpen}
              className="flex h-9 max-w-44 items-center gap-2 rounded-xl border border-[#dfe6d9] bg-white px-2.5 text-[var(--foreground)] transition-colors hover:border-[#c8dfc5] hover:bg-[#f8faf6] cursor-pointer"
            >
              <MerchantAvatar
                key={resolvedProfileUrl || "initial"}
                profileUrl={resolvedProfileUrl}
                initial={initial}
                className="h-5 w-5 rounded-md text-[10px]"
              />
              <span className="hidden max-w-28 truncate text-xs font-bold sm:block">{merchantName}</span>
              <span className={`text-[#7d8b79] transition-transform ${accountOpen ? "rotate-180" : ""}`}>
                <Icon.Chevron />
              </span>
            </button>
            {accountOpen && (
              <AccountMenu
                merchantName={merchantName}
                initial={initial}
                profileUrl={resolvedProfileUrl}
                onClose={() => setAccountOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <nav className="grid grid-cols-5 border-t border-[#dfe6d9] bg-white/95 md:hidden" aria-label="Mobile merchant navigation">
        {NAV.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors ${
                active ? "bg-[#edf6e9] text-[var(--leaf-dark)]" : "text-[#7d8b79] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}