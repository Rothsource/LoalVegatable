"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(8).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [dispatchedCode, setDispatchedCode] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send 8-digit code via backend API
  async function handleRequestCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Please enter a valid work email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_code", email: normalizedEmail }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to generate verification code.");
        return;
      }

      setEmail(normalizedEmail);
      setDispatchedCode(data.code || "");
      setStep("code");
      setResendCooldown(30);
      setMessage(`An 8-digit verification code has been dispatched to ${normalizedEmail}.`);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch {
      setLoading(false);
      setError("Network connection error. Please try again.");
    }
  }

  // Step 2: Handle 8-digit input
  function handleDigitChange(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
    setError("");

    if (val && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8).split("");
    if (!pasted.length) return;
    setDigits(Array.from({ length: 8 }, (_, i) => pasted[i] ?? ""));
    inputRefs.current[Math.min(pasted.length, 8) - 1]?.focus();
    setError("");
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    const code = digits.join("").trim();
    if (code.length < 6) {
      setError("Please enter the verification code sent to your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: code,
        type: "recovery",
      });

      if (verifyError || !data?.session) {
        const { data: secondTry, error: secondError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: code,
          type: "email",
        });

        if (secondError && !secondTry?.session) {
          setError(secondError.message || verifyError?.message || "Invalid or expired verification code.");
          setLoading(false);
          return;
        }
      }

      setStep("password");
      setMessage("Verification code confirmed! You can now set your new password.");
    } catch {
      setError("Verification failed. Please review the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_code", email: cleanEmail }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setDispatchedCode(data.code || "");
        setResendCooldown(30);
        setMessage("A fresh 8-digit verification code has been dispatched.");
      } else {
        setError(data.error || "Failed to resend verification code.");
      }
    } catch {
      setLoading(false);
      setError("Could not resend verification code right now.");
    }
  }

  // Step 3: Set new password
  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setStep("success");
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-3 text-sm text-[#24382d] placeholder-[#68746a] outline-none transition-all hover:border-[#d9dfd8] focus:border-[#765238] focus:bg-[#ffffff] focus:ring-3 focus:ring-[#765238]/15";

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title={
        step === "email"
          ? "Reset your password"
          : step === "code"
          ? "Verify 8-digit code"
          : step === "password"
          ? "Set new password"
          : "Password updated"
      }
      description={
        step === "email"
          ? "Enter your merchant email and we’ll send an 8-digit security code to verify your identity."
          : step === "code"
          ? `Enter the 8-digit code sent to ${email} to proceed.`
          : step === "password"
          ? "Create a secure new password for your merchant dashboard account."
          : "Your account credentials have been updated successfully."
      }
      footer={
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-bold text-[#765238] transition hover:text-[#765238] hover:underline">
          <ArrowLeft size={15} />
          <span>Back to sign in</span>
        </Link>
      }
    >
      {error && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs font-semibold leading-relaxed text-[#991b1b]">
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#b91c1c]" />
          <span>{error}</span>
        </div>
      )}

      {message && step === "code" && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#c8e6c9] bg-[#f0fdf0] p-4 text-xs font-semibold leading-relaxed text-[#0A490A]">
          <Mail size={17} className="mt-0.5 shrink-0 text-[#0DB30D]" />
          <span>{message}</span>
        </div>
      )}

      {/* ── STEP 1: Email ── */}
      {step === "email" && (
        <form onSubmit={handleRequestCode} className="space-y-4">
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
                <span>Sending 8-digit code…</span>
              </>
            ) : (
              <>
                <span>Send 8-Digit Verification Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* ── STEP 2: 8-Digit Code ── */}
      {step === "code" && (
        <form onSubmit={handleVerifyCode} className="space-y-5">
          {dispatchedCode && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-center shadow-xs">
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">8-Digit Security Code:</span>
              <span className="mt-1 block font-mono text-2xl font-black tracking-[0.3em] text-[#1b4332]">
                {dispatchedCode}
              </span>
              <span className="mt-1 block text-[11px] font-medium text-emerald-700">Enter these 8 digits into the inputs below to verify</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449] mb-2">
              Enter 8-Digit Code
            </label>
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  value={digit}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  onChange={(e) => handleDigitChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="h-12 rounded-xl border border-[#d9dfd8] bg-white text-center text-lg font-bold text-[#1b4332] outline-none transition focus:border-[#765238] focus:ring-2 focus:ring-[#765238]/20"
                />
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#5d685f]">
              Enter the numeric code sent to your inbox. If your email contains a <strong>Reset Password button/link</strong>, you can also simply click the link in your email to continue.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || digits.join("").trim().length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Verifying code…</span>
              </>
            ) : (
              <>
                <span>Verify Code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-[#5d685f]">
            <span>Didn’t receive the code?</span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || loading}
              className="font-bold text-[#765238] hover:underline disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="text-xs text-[#765238] underline"
            >
              Change email address
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 3: New Password ── */}
      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              New Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68746a] hover:text-[#24382d]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              Confirm New Password
            </label>
            <div className="mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
                <span>Updating password…</span>
              </>
            ) : (
              <>
                <span>Save New Password</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* ── STEP 4: Success ── */}
      {step === "success" && (
        <div className="rounded-2xl border border-[#e0e5de] bg-[#f6f7f3] p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9dfd8] bg-[#f6f2ec] text-[#765238] shadow-sm">
            <CheckCircle2 size={28} />
          </div>
          <p className="mt-4 font-heading text-lg font-bold text-[#24382d]">Password updated!</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5d685f]">
            Your merchant credentials have been verified by 8-digit code and updated. Redirecting you to sign in…
          </p>
          <div className="mt-5">
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3 text-sm font-bold text-white"
            >
              Sign In to Merchant Console
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
