// merchant/app/distributors/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { 
  User, Mail, Store, ShieldCheck, Bell, CheckCircle2, 
  AlertCircle, Sparkles, RefreshCw, Smartphone, MapPin, Building,
  Edit2, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { subscribeToPush, isPushSubscribed } from "@/lib/push/subscribe";
import { DistributorSpinner } from "@/components/distributors/DistributorUI";

const DistributorLocationPicker = dynamic(
  () => import("@/components/distributors/DistributorLocationPicker"),
  { ssr: false }
);

type Profile = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  merchant_name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function DistributorProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [pushError, setPushError] = useState("");

  const [editingLocation, setEditingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState("");
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data } = await supabase
        .from("profile_distributors")
        .select("id, full_name, email, status, merchant_id, address, latitude, longitude")
        .eq("id", user.id)
        .maybeSingle();

      if (!data) return setLoading(false);

      const { data: merchant } = await supabase
        .from("profile_merchants")
        .select("full_name, community_name")
        .eq("id", data.merchant_id)
        .maybeSingle();

      setProfile({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        status: data.status,
        merchant_name: merchant?.community_name || merchant?.full_name || "Assigned Partner Farm",
        address: data.address || null,
        latitude: data.latitude != null ? Number(data.latitude) : null,
        longitude: data.longitude != null ? Number(data.longitude) : null,
      });
      setLoading(false);
    })();

    isPushSubscribed().then(setSubscribed);
  }, []);

  const [togglingStatus, setTogglingStatus] = useState(false);

  async function handleToggleDistributorStatus() {
    if (!profile) return;
    setTogglingStatus(true);
    const nextIsOpen = profile.status !== "Active";
    const nextStatus = nextIsOpen ? "Active" : "Inactive";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/merchant/shop-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isOpen: nextIsOpen }),
      });

      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, status: nextStatus } : prev);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profile_distributors")
            .update({ status: nextStatus })
            .eq("id", user.id);
          setProfile((prev) => prev ? { ...prev, status: nextStatus } : prev);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleSaveProfileLocation() {
    if (!profile || !newLocation || !newLocation.address) {
      setLocationError("Please select or search for your hub location on the map.");
      return;
    }
    setSavingLocation(true);
    setLocationError("");
    setLocationSuccess("");

    try {
      const res = await fetch("/api/distributor/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distributorId: profile.id,
          address: newLocation.address,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update hub location.");

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              address: newLocation.address,
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
            }
          : prev
      );
      setLocationSuccess("Phnom Penh Distribution Hub location updated successfully!");
      setEditingLocation(false);
    } catch (err: any) {
      setLocationError(err?.message || "Could not save hub location.");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleEnableNotifications() {
    setSubscribing(true);
    setPushError("");
    const result = await subscribeToPush("distributor");
    setSubscribing(false);
    if (!result.ok) {
      setPushError(result.reason || "Notification permission was denied in your browser settings.");
      return;
    }
    setSubscribed(true);
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <DistributorSpinner size={46} label="Loading your distributor profile…" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-[#eedbd7] bg-[#fff5f4] p-6 text-center text-sm font-bold text-[#c53929]">
        Distributor profile was not found. Please verify with your merchant administrator.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ── Page Header ── */}
      <div className="border-b border-[#dfe6d9] pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182216] tracking-tight">
          Distributor Profile
        </h1>
        <p className="mt-1 text-sm text-[#52604f]">
          Your account details, merchant connection, and notification settings.
        </p>
      </div>

      {/* ── Main Profile Badge Card ── */}
      <div className="rounded-[26px] border-2 border-[#e2e8dd] bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-[#f0f4ee] pb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-2 border border-[#dfe6d9] shadow-md flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image/logo.png" alt="LocalVeg" className="h-full w-full object-contain" />
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#182216]">
                {profile.full_name}
              </h2>
              <span className={`rounded-full px-3 py-0.5 text-xs font-black uppercase ${
                profile.status === "Active" 
                  ? "bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]"
                  : "bg-gray-100 border border-gray-300 text-gray-700"
              }`}>
                {profile.status === "Active" ? "✓ Open for Duty" : "Offline / Closed"}
              </span>
            </div>
            <p className="text-sm font-medium text-[#52604f] flex items-center justify-center sm:justify-start gap-2">
              <Mail size={14} className="text-[#1b4332]" />
              <span>{profile.email}</span>
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[#fafbf9] border border-[#ecf1ea] p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2E6F40] uppercase tracking-wider">
              <Store size={15} />
              <span>Partner Merchant / Farm</span>
            </div>
            <p className="text-base font-black text-[#182216]">
              {profile.merchant_name}
            </p>
          </div>

          <div className="rounded-2xl bg-[#fafbf9] border border-[#ecf1ea] p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#2E6F40] uppercase tracking-wider">
              <ShieldCheck size={15} />
              <span>Role & Verification</span>
            </div>
            <p className="text-base font-black text-[#182216]">
              Certified Local Distributor
            </p>
          </div>
        </div>
      </div>

      {/* ── Phnom Penh Distribution Hub & Pickup Location Card ── */}
      <div className="rounded-[26px] border-2 border-[#e2e8dd] bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f4ee] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f5e9] text-[#1b4332] border border-[#c8e6c9] flex-shrink-0">
              <MapPin size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#182216]">
                Phnom Penh Distribution Hub
              </h3>
              <p className="text-xs text-[#52604f]">
                Urban pickup depot where courier riders collect orders for Phnom Penh consumers.
              </p>
            </div>
          </div>

          {!editingLocation && (
            <button
              type="button"
              onClick={() => {
                setEditingLocation(true);
                setLocationSuccess("");
                setLocationError("");
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f1f8f3] hover:bg-[#e1f0e4] text-[#1b4332] border border-[#c5dec9] text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Edit2 size={13} />
              <span>{profile.address ? "Change Location" : "Set Location"}</span>
            </button>
          )}
        </div>

        {locationSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] p-3 text-xs font-bold text-[#065f46]">
            <CheckCircle2 size={15} />
            <span>{locationSuccess}</span>
          </div>
        )}

        {locationError && (
          <div className="flex items-center gap-2 rounded-xl border border-[#eedbd7] bg-[#fff5f4] p-3 text-xs font-bold text-[#c53929]">
            <AlertCircle size={15} />
            <span>{locationError}</span>
          </div>
        )}

        {!editingLocation ? (
          <div>
            {profile.address ? (
              <div className="rounded-2xl bg-[#fafbf9] border border-[#ecf1ea] p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Building size={16} className="text-[#2e7d32] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E6F40]">Active Pickup Depot Address</p>
                    <p className="text-sm font-bold text-[#182216] mt-0.5 break-words">
                      {profile.address}
                    </p>
                  </div>
                </div>

                {profile.latitude && profile.longitude && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#edf2ea] text-xs text-gray-500">
                    <span className="font-semibold text-gray-600">GPS Pin:</span>
                    <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#dfe6d9] text-[#1b4332] font-bold">
                      {profile.latitude.toFixed(5)}, {profile.longitude.toFixed(5)}
                    </span>
                    <span className="text-[10px] text-[#065f46] font-bold bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#a7f3d0]">
                      ✓ Active for courier pickup routing
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#fed7aa] bg-[#fffbeb] p-4 text-xs font-medium text-[#9a3412] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#c2410c]">
                  <AlertCircle size={15} />
                  <span>No urban pickup depot configured yet</span>
                </div>
                <p>
                  Your farm (<strong>{profile.merchant_name}</strong>) is outside Phnom Penh. Couriers will currently navigate to the rural farm location until you set your Phnom Penh depot.
                </p>
                <button
                  type="button"
                  onClick={() => setEditingLocation(true)}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <MapPin size={13} />
                  <span>Set Hub Location Now</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <DistributorLocationPicker
              initialAddress={profile.address || ""}
              initialLat={profile.latitude || undefined}
              initialLng={profile.longitude || undefined}
              onChange={(loc) => {
                setNewLocation(loc);
                setLocationError("");
              }}
            />

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveProfileLocation}
                disabled={savingLocation}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] hover:bg-[#123327] py-3 px-5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingLocation ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving Location…</span>
                  </>
                ) : (
                  <>
                    <MapPin size={14} />
                    <span>Confirm &amp; Update Hub Location</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingLocation(false);
                  setNewLocation(null);
                  setLocationError("");
                }}
                disabled={savingLocation}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Operations & Synchronized Shop Status Card ── */}
      <div className="rounded-[26px] border-2 border-[#e2e8dd] bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E6F40]">Dispatch & Operating Status</p>
            <h3 className="text-lg font-black text-[#182216]">
              {profile.status === "Active" ? "Shop & Hub: Open" : "Shop & Hub: Closed"}
            </h3>
            <p className="text-xs text-[#52604f] mt-0.5">
              {profile.status === "Active" 
                ? "Your farm & distributor hub is accepting orders • Synchronized with partner farm." 
                : "Shop is closed. Customer orders are paused and linked farm is marked closed."}
            </p>
          </div>

          {/* Modern Interactive Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={profile.status === "Active"}
            onClick={handleToggleDistributorStatus}
            disabled={togglingStatus}
            className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              profile.status === "Active" ? "bg-emerald-600" : "bg-neutral-300"
            } ${togglingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                profile.status === "Active" ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <p className="text-[11px] text-[#71826d] pt-2 border-t border-[#edf2ea] leading-relaxed">
          ℹ️ <strong>Bidirectional Sync:</strong> Toggling your distributor status will also synchronize your partner farm (<strong>{profile.merchant_name}</strong>) and fellow distributor dispatches.
        </p>
      </div>

      {/* ── Order Alert Notifications Card ── */}
      <div className="rounded-[26px] border-2 border-[#e2e8dd] bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#92400e] border border-[#fde68a] flex-shrink-0">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#182216]">
              Instant Order Alerts
            </h3>
            <p className="text-xs sm:text-sm text-[#52604f] mt-0.5">
              Receive immediate phone notifications as soon as customers checkout, so you can claim delivery orders before anyone else.
            </p>
          </div>
        </div>

        {subscribed ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] p-4 text-sm font-extrabold text-[#065f46]">
            <CheckCircle2 size={20} className="text-[#059669] flex-shrink-0" />
            <div>
              <p>Push Notifications Are Active</p>
              <p className="text-xs font-semibold text-[#047857] opacity-85 mt-0.5">
                Your device will ring when new vegetable orders are placed.
              </p>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={handleEnableNotifications}
              disabled={subscribing}
              className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#0DB30D] hover:bg-[#0A490A] py-3.5 px-6 text-sm font-black text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {subscribing ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  <span>Enabling Alerts…</span>
                </>
              ) : (
                <>
                  <Smartphone size={18} />
                  <span>Turn On Phone Order Alerts</span>
                </>
              )}
            </button>
          </div>
        )}

        {pushError && (
          <div className="rounded-xl border border-[#eedbd7] bg-[#fff5f4] p-3 text-xs font-bold text-[#c53929]">
            {pushError}
          </div>
        )}
      </div>
    </div>
  );
}