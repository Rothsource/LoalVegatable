"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(8).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const inputClass =
    "w-full rounded-lg border border-[#d9dfd8] bg-white px-3.5 py-3 text-sm text-[#24382d] placeholder:text-[#7a857c] outline-none transition focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/15";

  // Step 1: Request 8-digit recovery code
  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid operator email address.");
      return;
    }

    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_code", email: cleanEmail }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to generate verification code.");
        return;
      }

      setStep("code");
      setResendCooldown(60);
      setInfo(`An 8-digit verification code has been dispatched to ${cleanEmail}. Please check your email inbox.`);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch {
      setLoading(false);
      setError("Network connection error. Please try again.");
    }
  }

  // Step 2: 8-digit box handlers
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

  // Step 2: Verify code
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("").trim();
    if (code.length !== 8) {
      setError("Please input the complete 8-digit security code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_code",
          email: email.trim().toLowerCase(),
          code,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Invalid 8-digit code. Please verify and retry.");
        return;
      }

      setStep("password");
      setInfo("Code verified successfully. Enter your new administrative password.");
    } catch {
      setLoading(false);
      setError("Connection failure while verifying security code.");
    }
  }

  // Resend code handler
  async function handleResendCode() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_code", email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        setResendCooldown(60);
        setInfo("A fresh 8-digit verification code has been dispatched to your email inbox.");
      } else {
        setError(data.error || "Failed to resend verification code.");
      }
    } catch {
      setLoading(false);
      setError("Failed to resend code due to network error.");
    }
  }

  // Step 3: Reset password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Administrator password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          email: email.trim().toLowerCase(),
          code: digits.join("").trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to update administrator password.");
        return;
      }

      setStep("success");
    } catch {
      setLoading(false);
      setError("Network error updating password. Please try again.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 text-[#24382d]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e3e7e1] bg-white p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image/logo.png" alt="LocalVegetable" className="h-full w-full object-contain" />
          </div>
          <span className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#765238]">
            Central Operations
          </span>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#20382b] sm:text-3xl">
            {step === "email" && "Reset Admin Password"}
            {step === "code" && "Verify 8-Digit Code"}
            {step === "password" && "Set New Password"}
            {step === "success" && "Password Updated"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#5d685f]">
            {step === "email" && "Enter your operator email address to receive an 8-digit verification code."}
            {step === "code" && `Enter the 8-digit verification code sent to ${email}.`}
            {step === "password" && "Create a secure, complex password for your administrator profile."}
            {step === "success" && "Your console credentials have been updated securely."}
          </p>
        </div>

        {/* Card Box */}
        <div className="rounded-xl border border-[#e3e7e1] bg-white p-6 shadow-[0_14px_40px_rgba(28,54,39,0.07)] sm:p-8">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium leading-relaxed text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {info && !error && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-lg border border-[#1b4332]/20 bg-[#1b4332]/5 p-4 text-sm font-medium leading-relaxed text-[#1b4332]"
            >
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1b4332]" />
              <span>{info}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === "email" && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#35473a]">
                  Operator Email Address
                </label>
                <div className="mt-1.5">
                  <input
                    aria-label="Operator email address"
                    type="email"
                    placeholder="admin@localveg.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Dispatching 8-digit code…</span>
                  </>
                ) : (
                  <span>Send 8-Digit Code</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 8-Digit Code */}
          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label className="block text-center text-xs font-bold uppercase tracking-wider text-[#765238]">
                  8-Digit Security Code
                </label>
                <div className="mt-3 flex justify-center gap-1.5 sm:gap-2">
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(e, i)}
                      onKeyDown={(e) => handleKeyDown(e, i)}
                      onPaste={handlePaste}
                      className="h-11 w-9 rounded-lg border border-[#d9dfd8] bg-white text-center font-mono text-lg font-bold text-[#1b4332] shadow-sm transition focus:border-[#1b4332] focus:ring-2 focus:ring-[#1b4332]/20 sm:h-12 sm:w-10"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || digits.join("").length !== 8}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Verifying code…</span>
                  </>
                ) : (
                  <span>Verify Code</span>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="font-medium text-[#5d685f] hover:text-[#1b4332] hover:underline"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="font-semibold text-[#765238] hover:text-[#1b4332] disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#35473a]">
                  New Password (min 8 chars)
                </label>
                <div className="relative mt-1.5">
                  <input
                    aria-label="New password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#66746a] transition hover:text-[#1b4332]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#35473a]">
                  Confirm New Password
                </label>
                <div className="mt-1.5">
                  <input
                    aria-label="Confirm new password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(140,82,40,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Updating password…</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success */}
          {step === "success" && (
            <div className="py-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-heading text-lg font-bold text-[#20382b]">
                Password Reset Successfully!
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#5d685f]">
                Your administrator credentials have been securely updated. You may now log in to the Admin Console with your new password.
              </p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#123327]"
              >
                Return to Admin Sign In
              </button>
            </div>
          )}

          {step !== "success" && (
            <div className="mt-6 border-t border-[#e3e7e1] pt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#5d685f] transition hover:text-[#1b4332]"
              >
                <ArrowLeft size={14} />
                <span>Back to Admin Sign In</span>
              </Link>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-[#68746a]">
          Authorized administrative personnel only · Activity logged & monitored
        </p>
      </div>
    </main>
  );
}
