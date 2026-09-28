"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    window.location.href = "/home";
  }

  const inputClass =
    "w-full rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-3 text-sm text-[#24382d] placeholder-[#68746a] outline-none transition-all hover:border-[#d9dfd8] focus:border-[#765238] focus:bg-[#ffffff] focus:ring-3 focus:ring-[#765238]/15";

  return (
    <AuthShell
      eyebrow="Merchant Access"
      title="Welcome back"
      description="Sign in to your merchant workspace to manage farm inventory and orders."
      footer={
        <span>
          Looking to become a verified supplier?{" "}
          <Link href="/auth/register" className="font-bold text-[#765238] transition hover:text-[#765238] hover:underline">
            Register your farm
          </Link>
        </span>
      }
    >
      {error && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs font-semibold leading-relaxed text-[#991b1b]">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#b91c1c]" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
            Work Email Address
          </label>
          <div className="mt-1.5">
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="grower@localfarm.com"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#765238] transition hover:text-[#765238] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1.5">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your account password"
              autoComplete="current-password"
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
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Verifying credentials…</span>
            </>
          ) : (
            <>
              <span>Sign In to Merchant Console</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Distributor Team switch */}
      <div className="mt-8 flex items-center justify-between gap-4 rounded-xl border border-[#e0e5de] bg-[#f6f7f3] p-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#24382d]">Distributor or Dispatch Team?</p>
          <p className="mt-1 text-[11px] leading-4 text-[#5d685f]">Sign in to coordinate dispatches and deliveries.</p>
        </div>
        <Link
          href="/auth/distributor-login"
          className="shrink-0 rounded-lg bg-[#1b4332] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#123327] active:bg-[#0c241b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b4332]"
        >
          Distributor Login
        </Link>
      </div>
    </AuthShell>
  );
}