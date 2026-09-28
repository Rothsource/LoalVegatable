"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AuthShell from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: { data: { role: "merchant", full_name: form.name.trim() } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  const inputClass =
    "w-full rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-3 text-sm text-[#24382d] placeholder-[#68746a] outline-none transition-all hover:border-[#d9dfd8] focus:border-[#765238] focus:bg-[#ffffff] focus:ring-3 focus:ring-[#765238]/15";

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ffffff] p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#e0e5de] bg-[#ffffff] p-8 sm:p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#e0e5de] bg-[#f6f7f3] text-[#765238] shadow-sm">
            <Mail size={36} />
          </div>
          <span className="inline-block rounded-full border border-[#e0e5de] bg-[#f6f2ec] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#765238]">
            Account Verification
          </span>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#24382d]">
            Confirm your email
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5d685f]">
            We sent a secure activation link to <strong className="font-semibold text-[#24382d]">{form.email}</strong>.
            Click the link in the message to activate your merchant account and submit farm credentials.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327]"
            >
              <span>Return to Merchant Login</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AuthShell
      eyebrow="Merchant Onboarding"
      title="Create account"
      description="Register your farm, cooperative, or wholesale supplier account to begin receiving local delivery orders."
      footer={
        <span>
          Already registered as a vendor?{" "}
          <Link href="/auth/login" className="font-bold text-[#765238] transition hover:text-[#765238] hover:underline">
            Sign in here
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
          <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
            Full Name or Farm Representative
          </label>
          <div className="mt-1.5">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Chan Dara"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
            Work / Business Email
          </label>
          <div className="mt-1.5">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="grower@farm.com"
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
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
          <p className="mt-1 text-[11px] text-[#8f7e71]">
            Must be 8+ characters. Use numbers or symbols for better security.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Creating your account…</span>
            </>
          ) : (
            <>
              <span>Create Merchant Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}