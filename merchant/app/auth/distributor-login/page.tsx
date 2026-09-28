"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function DistributorLoginPage() {
  const router = useRouter();
  const [stage, setStage] = useState<"email" | "setPassword" | "login">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const inputClass =
    "w-full rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-3 text-sm text-[#24382d] placeholder-[#68746a] outline-none transition-all hover:border-[#d9dfd8] focus:border-[#765238] focus:bg-[#ffffff] focus:ring-4 focus:ring-[#765238]/15";

  return (
    <AuthShell
      eyebrow="Distributor Network"
      title={
        stage === "email"
          ? "Distributor sign in"
          : stage === "setPassword"
          ? "Set your password"
          : "Enter password"
      }
      description={
        stage === "email"
          ? "Enter your work email to access orders, manage farm stock, and coordinate dispatches."
          : stage === "setPassword"
          ? `Create a secure password for ${email}.`
          : `Sign in with your password for ${email}.`
      }
      footer={
        <div className="flex items-center justify-between gap-4 text-xs font-medium text-[#5d685f]">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 font-bold text-[#765238] transition hover:text-[#765238] hover:underline"
          >
            <ArrowLeft size={15} />
            <span>Switch to Merchant Login</span>
          </Link>
          {stage !== "email" && (
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setError("");
              }}
              className="text-xs font-semibold text-[#5d685f] underline hover:text-[#24382d]"
            >
              Change email
            </button>
          )}
        </div>
      }
    >
      {error && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs font-semibold leading-relaxed text-[#991b1b]">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#b91c1c]" />
          <span>{error}</span>
        </div>
      )}

      {stage === "email" && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              Assigned Work Email
            </label>
            <div className="relative mt-1.5">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dispatch@farmhub.com"
                required
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99]"
          >
            <span>Continue</span>
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {stage === "setPassword" && (
        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              New Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68746a] transition hover:text-[#24382d]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              Confirm Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Setting password…</span>
              </>
            ) : (
              <>
                <span>Set Password & Continue</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {stage === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-2.5 text-xs font-semibold text-[#5d685f]">
            Account: <strong className="text-[#24382d]">{email}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68746a] transition hover:text-[#24382d]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign In to Distributor Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}