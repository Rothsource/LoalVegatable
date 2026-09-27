"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Bike, 
  CheckCircle2, 
  LogOut, 
  Mail, 
  Phone, 
  Power, 
  ShieldCheck, 
  MapPin, 
  PackageCheck, 
  Clock, 
  Leaf, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/ui/PageHeading";
import { PageSkeleton } from "@/components/ui/StateViews";
import { useDelivery } from "@/context/DeliveryProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, setAvailability } = useDelivery();
  const [busy, setBusy] = useState<"logout" | "toggle" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (loading || !user) return <PageSkeleton />;

  const isOnline = Boolean(user.available);

  async function handleToggleDuty() {
    setBusy("toggle");
    try {
      const nextState = !isOnline;
      await setAvailability(nextState);
      setFeedback(
        nextState 
          ? "You are now ONLINE. You will receive real-time vegetable delivery requests." 
          : "You are now OFF-DUTY (Closed). No dispatch notifications will be sent to your device."
      );
      setTimeout(() => setFeedback(null), 4500);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function handleLogout() {
    setBusy("logout");
    await logout();
    router.push("/login");
  }

  const initials = user.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "RC";

  return (
    <div className="enter-up max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeading 
        eyebrow="Rider Profile & Operations" 
        title="Courier Console" 
        description="Manage your active delivery duty status, rider credentials, and performance stats." 
      />

      {feedback && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 transition-all ${
          isOnline 
            ? "bg-[#edf6e9] border-[#c2deba] text-[#1b4332]" 
            : "bg-[#faf5ed] border-[#e8d8c3] text-[#78461e]"
        }`}>
          <AlertCircle size={18} className="shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Duty Status Master Card */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-7 shadow-[0_12px_40px_rgba(42,33,24,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-colors ${
              isOnline ? "bg-[#1b4332] text-white" : "bg-[#4a3525] text-white"
            }`}>
              <Power size={26} className={isOnline ? "animate-pulse" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                  isOnline 
                    ? "bg-[#edf6e9] text-[#1b4332] border border-[#c2deba]" 
                    : "bg-[#f5ede4] text-[#78461e] border border-[#e2d0bd]"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-[#2d6a4f] animate-ping" : "bg-[#78461e]"}`} />
                  {isOnline ? "Online · Receiving Orders" : "Closed · Off Duty"}
                </span>
              </div>
              <h2 className="mt-1.5 text-lg sm:text-xl font-black text-[var(--ink)]">
                {isOnline ? "Ready to Accept Farm Dispatches" : "Duty Closed — Not Receiving Dispatches"}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                {isOnline 
                  ? "Your courier GPS is broadcast to nearby vegetable distributors and merchants." 
                  : "When off-duty, customer orders will match other nearby couriers and your phone will stay silent."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleDuty}
            disabled={busy === "toggle"}
            className={`cursor-pointer min-h-12 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shrink-0 border shadow-xs ${
              isOnline
                ? "bg-[#f5ede4] hover:bg-[#ede0d2] text-[#4a3525] border-[#dcc9b4]"
                : "bg-[#1b4332] hover:bg-[#0f281e] text-white border-[#1b4332]"
            }`}
          >
            <Power size={17} />
            <span>{isOnline ? "Close / Go Off-Duty" : "Turn Online"}</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Courier Credentials & Performance Stats */}
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        {/* Profile Details */}
        <section className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-7 shadow-[0_12px_40px_rgba(42,33,24,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#4a3525] text-2xl font-black text-white shadow-md">
                {initials}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-black tracking-tight text-[var(--ink)]">{user.name}</h3>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#1b4332] bg-[#edf6e9] px-2.5 py-0.5 rounded-md border border-[#cbe1c7]">
                  <ShieldCheck size={14} /> Certified Fresh Produce Courier
                </p>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-[#ece5db]">
              <div className="flex items-center gap-3.5 py-3.5">
                <Mail size={17} className="shrink-0 text-[#4a3525]" />
                <div className="min-w-0">
                  <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Email Contact</dt>
                  <dd className="mt-0.5 truncate text-sm font-bold text-[var(--ink)]">{user.email || "courier@localveg.kh"}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3.5 py-3.5">
                <Phone size={17} className="shrink-0 text-[#4a3525]" />
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Phone Number</dt>
                  <dd className="mt-0.5 text-sm font-bold text-[var(--ink)]">{user.phone || "+855 12 889 001"}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3.5 py-3.5">
                <MapPin size={17} className="shrink-0 text-[#1b4332]" />
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Delivery Zone</dt>
                  <dd className="mt-0.5 text-sm font-bold text-[var(--ink)]">Phnom Penh · Zone 1 (Central & Riverside)</dd>
                </div>
              </div>

              <div className="flex items-center gap-3.5 py-3.5">
                <Bike size={17} className="shrink-0 text-[#4a3525]" />
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Vehicle & Bag</dt>
                  <dd className="mt-0.5 text-sm font-bold text-[var(--ink)]">Honda Dream 125 · Thermal Insulated Basket</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="mt-7 pt-4 border-t border-[#ece5db]">
            <Button 
              variant="danger" 
              fullWidth 
              loading={busy === "logout"} 
              onClick={() => void handleLogout()} 
              icon={<LogOut size={16} />}
            >
              Sign out from Courier Console
            </Button>
          </div>
        </section>

        {/* Courier Performance & Reputation */}
        <section className="rounded-3xl border border-[#ded5cb] bg-[#fbf9f4] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Courier Standing</p>
              <h3 className="text-lg font-black text-[var(--ink)] mt-0.5">Performance Record</h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#e2d8cd] bg-white p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)]">
                  <PackageCheck size={14} className="text-[#1b4332]" /> Total Trips
                </span>
                <p className="mt-2 text-2xl font-black text-[var(--ink)]">148</p>
                <p className="text-[10px] font-bold text-[#2d6a4f] mt-0.5">100% Produce safety</p>
              </div>

              <div className="rounded-2xl border border-[#e2d8cd] bg-white p-4">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--muted)]">
                  <Clock size={14} className="text-[#4a3525]" /> On-Time Rate
                </span>
                <p className="mt-2 text-2xl font-black text-[var(--ink)]">99.4%</p>
                <p className="text-[10px] font-bold text-[var(--muted)] mt-0.5">Avg: 16.5 mins</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#cde0cb] bg-[#edf6e9] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1b4332] text-white shrink-0 mt-0.5">
                  <Leaf size={16} />
                </span>
                <div>
                  <p className="text-xs font-black text-[#1b4332]">Local Produce Handling Excellence</p>
                  <p className="text-[11px] text-[#2d6a4f] mt-0.5 leading-relaxed">
                    Certified in cold-chain transport for fragile greens (Bok Choy, Water Spinach). Zero bruising reports recorded.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#ded5cb] text-center">
            <p className="text-[11px] font-medium text-[var(--muted)]">
              Local Vegetable Courier Network · Phnom Penh, Cambodia
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
