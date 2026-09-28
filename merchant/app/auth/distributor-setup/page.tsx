"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, KeyRound, Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function DistributorSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });

    setSending(false);
    if (otpError) return setError(otpError.message);
    setStage("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setVerifying(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });

    setVerifying(false);
    if (verifyError) return setError(verifyError.message);

    router.replace("/distributors/products");
  }

  const inputClass =
    "w-full rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-3 text-sm text-[#24382d] placeholder-[#68746a] outline-none transition-all hover:border-[#d9dfd8] focus:border-[#765238] focus:bg-[#ffffff] focus:ring-4 focus:ring-[#765238]/15";

  return (
    <AuthShell
      eyebrow="Distributor Onboarding"
      title={stage === "email" ? "Distributor activation" : "Enter verification code"}
      description={
        stage === "email"
          ? "Enter your authorized work email to receive an instant one-time verification passcode."
          : `We dispatched a security code to ${email}.`
      }
      footer={
        <div className="flex items-center justify-between gap-4 text-xs font-medium text-[#5d685f]">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 font-bold text-[#765238] transition hover:text-[#765238] hover:underline"
          >
            <ArrowLeft size={15} />
            <span>Return to Merchant Login</span>
          </Link>
          {stage === "code" && (
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setCode("");
                setError("");
              }}
              className="text-xs font-semibold text-[#5d685f] underline hover:text-[#24382d]"
            >
              Use different email
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

      {stage === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              Authorized Email
            </label>
            <div className="relative mt-1.5">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dispatch@farmhub.com"
                className={`${inputClass} pl-10`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Sending passcode…</span>
              </>
            ) : (
              <>
                <span>Send One-Time Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-2.5 text-xs font-semibold text-[#5d685f]">
            Sending code to: <strong className="text-[#24382d]">{email}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              Passcode
            </label>
            <div className="relative mt-1.5">
              <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-8 digit code"
                className={`${inputClass} pl-10 font-mono tracking-widest`}
                maxLength={8}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60"
          >
            {verifying ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Verifying access…</span>
              </>
            ) : (
              <>
                <span>Verify & Access Catalog</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}