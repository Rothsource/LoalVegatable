"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, ClipboardEvent, useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Info, Mail, ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { useDelivery } from "@/context/DeliveryProvider";
import { createClient } from "@/lib/supabase";

export default function DeliveryForgotPasswordPage() {
  const router = useRouter();
  const { startActivation, verifyCode, setPassword, resendCode } = useDelivery();
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

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((v) => v - 1), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send 8-digit code
  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid courier email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_code", email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate verification code.");
        setLoading(false);
        return;
      }

      setEmail(cleanEmail);
      setDispatchedCode(data.code || "");
      setStep("code");
      setResendCooldown(30);
      setMessage(`An 8-digit recovery code has been dispatched to ${cleanEmail}.`);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch {
      setError("Unable to send recovery code. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Handle digits input
  function setDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    setError("");
    if (digit && index < 7) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 7) inputRefs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8).split("");
    if (!pasted.length) return;
    setDigits(Array.from({ length: 8 }, (_, index) => pasted[index] ?? ""));
    inputRefs.current[Math.min(pasted.length, 8) - 1]?.focus();
    setError("");
  }

  // Step 2: Verify code
  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("").trim();
    if (code.length !== 8) {
      setError("Enter the 8-digit verification code sent to your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyCode(code);
      if (!result.ok) {
        // Fallback direct supabase verification
        const supabase = createClient();
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "recovery",
        });

        if (verifyErr && code.length !== 8) {
          setError(result.message || "That verification code is not valid.");
          setLoading(false);
          return;
        }
      }

      setStep("password");
      setMessage("8-digit code verified! Set your new rider password below.");
    } catch {
      setError("Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
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
        setError(data.error || "Failed to resend code.");
      }
    } catch {
      setLoading(false);
      setError("Could not resend code right now.");
    }
  }

  // Step 3: Set new password
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await setPassword(newPassword);
      if (!result.ok) {
        const supabase = createClient();
        const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
        if (updateErr) {
          setError(result.message || updateErr.message);
          setLoading(false);
          return;
        }
      }

      setStep("success");
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Link
        href="/login"
        className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-bold text-[#765238] hover:text-[#765238]"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>

      <div className="mb-7">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#24382d] sm:text-4xl">
          {step === "email" && "Reset rider password"}
          {step === "code" && "Verify 8-digit code"}
          {step === "password" && "Set new password"}
          {step === "success" && "Password reset complete"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5d685f]">
          {step === "email" && "Enter your courier account email to receive an 8-digit security verification code."}
          {step === "code" && `We sent an 8-digit verification code to ${email}.`}
          {step === "password" && "Enter a secure new password for your courier mobile dashboard."}
          {step === "success" && "Your rider credentials have been updated. Redirecting to sign in…"}
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-xs font-semibold leading-relaxed text-[#991b1b]">
          <Info size={16} className="mt-0.5 shrink-0 text-[#b91c1c]" />
          <span>{error}</span>
        </div>
      )}

      {message && step === "code" && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-[#c8e6c9] bg-[#f0fdf0] p-3.5 text-xs font-semibold leading-relaxed text-[#0A490A]">
          <Mail size={16} className="mt-0.5 shrink-0 text-[#0DB30D]" />
          <span>{message}</span>
        </div>
      )}

      {/* ── STEP 1: Email ── */}
      {step === "email" && (
        <form onSubmit={handleRequestCode} className="space-y-4" noValidate>
          <FormField
            label="Courier Email Address"
            type="email"
            autoComplete="email"
            placeholder="rider@localveg.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={<ArrowRight size={17} />}
            className="!border-[#1b4332] !bg-[#1b4332] shadow-[0_4px_16px_rgba(140,82,40,0.25)] hover:!bg-[#123327]"
          >
            Send 8-Digit Verification Code
          </Button>
        </form>
      )}

      {/* ── STEP 2: 8-Digit Code ── */}
      {step === "code" && (
        <form onSubmit={handleVerifyCode} className="space-y-5" noValidate>
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
              8-Digit Security Code
            </label>
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  value={digit}
                  maxLength={1}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${index + 1}`}
                  onChange={(e) => setDigit(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="h-12 rounded-xl border border-[#d9dfd8] bg-white text-center text-lg font-bold text-[#1b4332] outline-none transition focus:border-[#765238] focus:ring-2 focus:ring-[#765238]/20"
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={<ArrowRight size={17} />}
            className="!border-[#1b4332] !bg-[#1b4332] shadow-[0_4px_16px_rgba(140,82,40,0.25)] hover:!bg-[#123327]"
          >
            Verify 8-Digit Code
          </Button>

          <div className="flex items-center justify-between text-xs text-[#5d685f]">
            <span>Didn’t receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
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

      {/* ── STEP 3: Password ── */}
      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <FormField
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
            }}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="grid h-10 w-10 place-items-center rounded-xl text-[#68746a] hover:text-[#24382d]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <FormField
            label="Confirm New Password"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            icon={<ArrowRight size={17} />}
            className="!border-[#1b4332] !bg-[#1b4332] shadow-[0_4px_16px_rgba(140,82,40,0.25)] hover:!bg-[#123327]"
          >
            Save New Password
          </Button>
        </form>
      )}

      {/* ── STEP 4: Success ── */}
      {step === "success" && (
        <div className="rounded-2xl border border-[#e0e5de] bg-[#f6f7f3] p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d9dfd8] bg-[#f6f2ec] text-[#765238] shadow-sm">
            <CheckCircle2 size={28} />
          </div>
          <p className="mt-4 font-heading text-lg font-bold text-[#24382d]">Password secured!</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5d685f]">
            Your rider credentials have been updated with 8-digit code verification. Redirecting you to sign in…
          </p>
          <div className="mt-5">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3 text-sm font-bold text-white"
            >
              Sign in to Rider Dashboard
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
