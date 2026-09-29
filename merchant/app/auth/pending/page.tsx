"use client";

import { useEffect } from "react";
import { CheckCircle2, Clock, Loader2, LogOut } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function PendingPage() {
  useEffect(() => {
    // poll every 5 seconds to check if approved
    // nosemgrep: javascript.lang.security.detect-eval-with-expression.detect-eval-with-expression -- safe: function argument, not a string, no dynamic eval
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profile_merchants")
        .select("is_approved")
        .eq("id", user.id)
        .single();

      if (data?.is_approved) {
        clearInterval(interval);
        window.location.href = "/home";
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <AuthShell
      eyebrow="Verification in progress"
      title="Merchant account pending review"
      description="Your farm registration has been received and is being verified by the marketplace operations team."
      footer={
        <div className="flex items-center justify-between gap-4 text-xs text-[#68746a]">
          <span>Need urgent activation? Reach out to support.</span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 font-bold text-[#ef4444] transition hover:underline"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Verification Status Banner */}
        <div className="rounded-2xl border border-[#e0e5de] bg-[#f6f2ec] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f6f2ec] text-[#765238]">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#765238]">Compliance Verification</p>
              <p className="text-sm font-bold text-[#24382d]">Account under standard review</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#5d685f]">
            We check merchant certificates and farm locations to maintain trusted agricultural standards. This usually takes under 24 hours.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e0e5de] bg-[#ffffff] px-3.5 py-2 text-xs font-semibold text-[#765238]">
            <Loader2 size={14} className="animate-spin text-[#765238]" />
            <span>Auto-checking approval status every 5 seconds…</span>
          </div>
        </div>

        {/* 3-Step Verification Timeline */}
        <div className="rounded-2xl border border-[#e0e5de] bg-[#ffffff] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#435449]">
            Onboarding Progress
          </p>
          <div className="mt-4 space-y-3.5">
            <div className="flex items-center gap-3 text-xs">
              <CheckCircle2 size={18} className="shrink-0 text-[#765238]" />
              <div className="min-w-0">
                <span className="font-bold text-[#24382d]">1. Account Registered</span>
                <span className="ml-2 text-[11px] text-[#68746a]">Completed</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f6f2ec] text-[#765238]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#765238]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-[#765238]">2. Farm & Produce Verification</span>
                <span className="ml-2 text-[11px] text-[#5d685f]">Under review</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs opacity-60">
              <div className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#d9dfd8]" />
              <div className="min-w-0">
                <span className="font-bold text-[#68746a]">3. Live Dispatch & Inventory Access</span>
                <span className="ml-2 text-[11px] text-[#68746a]">Next step</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
