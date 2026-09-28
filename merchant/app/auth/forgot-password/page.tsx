"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    if (resetError) {
      setError(resetError.message);
    } else {
      setEmail(normalizedEmail);
      setSent(true);
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-3 text-sm text-[#24382d] placeholder-[#68746a] outline-none transition-all hover:border-[#d9dfd8] focus:border-[#765238] focus:bg-[#ffffff] focus:ring-3 focus:ring-[#765238]/15";

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title={sent ? "Check your inbox" : "Reset your password"}
      description={
        sent
          ? `We sent a secure password reset link to ${email}.`
          : "Enter the email associated with your merchant account and we’ll send a link to securely reset your credentials."
      }
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-bold text-[#765238] transition hover:text-[#765238] hover:underline">
          <ArrowLeft size={15} />
          <span>Back to sign in</span>
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-[#e0e5de] bg-[#f6f7f3] p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9dfd8] bg-[#f6f2ec] text-[#765238] shadow-sm">
            <CheckCircle2 size={28} />
          </div>
          <p className="mt-4 font-heading text-lg font-bold text-[#24382d]">Reset link dispatched</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5d685f]">
            The security link will remain active for 60 minutes. Please check your spam folder if it doesn’t arrive shortly.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-5 inline-block text-xs font-bold text-[#765238] underline transition hover:text-[#765238]"
          >
            Send to a different email address
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs font-semibold leading-relaxed text-[#991b1b]">
              <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#b91c1c]" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="recovery-email" className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
                Work Email Address
              </label>
              <div className="mt-1.5">
                <input
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="grower@farm.com"
                  className={inputClass}
                />
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
                  <span>Sending reset link…</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
