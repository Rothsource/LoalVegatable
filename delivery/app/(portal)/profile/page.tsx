"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BellRing, Bike, CheckCircle2, LogOut, Mail, Phone, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeading } from "@/components/ui/PageHeading";
import { PageSkeleton } from "@/components/ui/StateViews";
import { useDelivery } from "@/context/DeliveryProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, resetDemo } = useDelivery();
  const [busy, setBusy] = useState<"logout" | "incoming" | "empty" | null>(null);
  const [message, setMessage] = useState("");
  if (loading || !user) return <PageSkeleton />;

  async function handleLogout() {
    setBusy("logout");
    await logout();
    router.push("/login");
  }

  async function setScenario(mode: "incoming" | "empty") {
    setBusy(mode);
    await resetDemo(mode);
    setBusy(null);
    setMessage(mode === "incoming" ? "Demo reset to a new incoming request." : "Demo queue cleared. Empty states are now visible.");
  }

  return (
    <div className="enter-up">
      <PageHeading eyebrow="Rider profile" title="Your account" description="The essentials for your Delivery Portal demo account." />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-[26px] border border-[var(--line)] bg-white p-5 card-shadow sm:p-7">
          <div className="flex items-center gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-[var(--leaf)] text-xl font-black text-white shadow-[0_12px_30px_rgba(46,111,64,0.2)]">SC</span><div className="min-w-0"><h2 className="truncate text-xl font-black tracking-[-0.03em]">{user.name}</h2><p className="mt-1 inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--leaf)]"><CheckCircle2 size={14} />Active rider account</p></div></div>
          <dl className="mt-7 divide-y divide-[#edf0ea]">
            <div className="flex items-center gap-3 py-4"><Mail size={18} className="shrink-0 text-[var(--leaf)]" /><div className="min-w-0"><dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#879282]">Email</dt><dd className="mt-1 truncate text-sm font-bold">{user.email}</dd></div></div>
            <div className="flex items-center gap-3 py-4"><Phone size={18} className="shrink-0 text-[var(--leaf)]" /><div><dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#879282]">Phone</dt><dd className="mt-1 text-sm font-bold">{user.phone}</dd></div></div>
            <div className="flex items-center gap-3 py-4"><Bike size={18} className="shrink-0 text-[var(--leaf)]" /><div><dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#879282]">Availability</dt><dd className="mt-1 text-sm font-bold">{user.available ? "Available for delivery" : "Offline"}</dd></div></div>
          </dl>
          <Button variant="danger" fullWidth loading={busy === "logout"} onClick={() => void handleLogout()} icon={<LogOut size={17} />}>Log out</Button>
        </section>

        <section className="rounded-[26px] border border-[#d7e2d2] bg-[#eff5ec] p-5 sm:p-7">
          <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[var(--leaf)]"><RotateCcw size={20} /></span><div><h2 className="font-black tracking-[-0.02em]">Demo scenarios</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Reset the frontend-only story without editing source code.</p></div></div>
          <div className="mt-5 space-y-3">
            <button onClick={() => void setScenario("incoming")} disabled={busy !== null} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[#d6e0d1] bg-white p-3.5 text-left transition hover:border-[#b9ceaf] disabled:opacity-60"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5e8] text-[var(--leaf)]"><BellRing size={18} /></span><span><strong className="block text-sm font-extrabold">New request scenario</strong><span className="mt-0.5 block text-xs text-[var(--muted)]">Restore an unread incoming delivery</span></span></button>
            <button onClick={() => void setScenario("empty")} disabled={busy !== null} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[#d6e0d1] bg-white p-3.5 text-left transition hover:border-[#b9ceaf] disabled:opacity-60"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2f3ef] text-[#6f796c]"><Trash2 size={18} /></span><span><strong className="block text-sm font-extrabold">Empty queue scenario</strong><span className="mt-0.5 block text-xs text-[var(--muted)]">Show no incoming or current delivery</span></span></button>
          </div>
          {message && <p role="status" className="mt-4 rounded-xl bg-white p-3 text-xs font-bold leading-5 text-[var(--leaf)]">{message}</p>}
          <p className="mt-5 text-[11px] leading-5 text-[#788474]">These controls exist only for presentation and local frontend testing. They are isolated inside the mock service.</p>
        </section>
      </div>
    </div>
  );
}
