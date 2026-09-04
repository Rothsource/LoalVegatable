"use client";
import { useEffect } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function PendingPage() {
  useEffect(() => {
    // poll every 5 seconds to check if approved
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
    <AuthShell eyebrow="Merchant review" title="Your account is under review" description="We’ll open your merchant workspace as soon as the admin team approves your details.">
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-xl" aria-hidden="true">⌛</span>
        <p className="mt-4 text-sm font-black text-amber-900">No action needed</p>
        <p className="mt-1 text-sm leading-6 text-amber-800">This page checks your approval status every 5 seconds and continues automatically when access is ready.</p>
        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-700"><span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />Checking approval status…</div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4 text-xs text-gray-400"><span>Questions? Contact support.</span><button onClick={handleLogout} className="font-black text-red-500 hover:underline">Sign out</button></div>
    </AuthShell>
  );
}
