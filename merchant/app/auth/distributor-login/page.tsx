"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, ArrowRight, Lock, Mail, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DistributorLoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"email" | "setPassword" | "login">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStage("setPassword");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    const res = await fetch("/api/distributor/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) return setError(data?.error ?? "Could not set password.");

    setStage("login");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);
    if (signInError) return setError(signInError.message);

    router.replace("/distributors/orders");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f0] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border-2 border-[#dfe6d9] bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgba(46,111,64,0.06)] space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0DB30D] text-white shadow-md">
            <Truck size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#182216] tracking-tight">
              Distributor Portal
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#52604f] font-medium">
              Access orders, manage farm stock, and coordinate dispatches.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#eedbd7] bg-[#fff5f4] p-3.5 text-xs sm:text-sm font-bold text-[#c53929]">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {stage === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#2E6F40]">
                Your Work Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c9b88]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@farm.com"
                  className="w-full rounded-2xl border-2 border-[#dfe6d9] bg-[#fafbf8] pl-10 pr-4 py-3 text-sm font-bold text-[#182216] outline-none focus:border-[#0DB30D] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0DB30D] hover:bg-[#0A490A] py-3.5 text-sm font-black text-white shadow-md active:scale-95 transition-all"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {stage === "setPassword" && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            <p className="text-xs text-[#52604f] font-semibold">
              Create a password for <span className="font-bold text-[#182216]">{email}</span>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#2E6F40]">
                New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c9b88]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-2xl border-2 border-[#dfe6d9] bg-[#fafbf8] pl-10 pr-4 py-3 text-sm font-bold text-[#182216] outline-none focus:border-[#0DB30D] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#2E6F40]">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c9b88]" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-2xl border-2 border-[#dfe6d9] bg-[#fafbf8] pl-10 pr-4 py-3 text-sm font-bold text-[#182216] outline-none focus:border-[#0DB30D] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0DB30D] hover:bg-[#0A490A] py-3.5 text-sm font-black text-white shadow-md active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Setting Password…</span>
                </>
              ) : (
                <span>Set Password & Sign In</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStage("email");
                setError("");
              }}
              className="w-full text-center text-xs font-bold text-[#647060] hover:text-[#182216]"
            >
              Use a different email
            </button>
          </form>
        )}

        {stage === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="rounded-xl border border-[#dfe6d9] bg-[#f7f9f5] px-4 py-2.5 text-xs font-bold text-[#182216]">
              {email}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-[#2E6F40]">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c9b88]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border-2 border-[#dfe6d9] bg-[#fafbf8] pl-10 pr-4 py-3 text-sm font-bold text-[#182216] outline-none focus:border-[#0DB30D] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0DB30D] hover:bg-[#0A490A] py-3.5 text-sm font-black text-white shadow-md active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}