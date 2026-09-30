"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  RotateCw,
} from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

const DistributorLocationPicker = dynamic(
  () => import("@/components/distributors/DistributorLocationPicker"),
  { ssr: false }
);

export default function DistributorLoginPage() {
  const router = useRouter();

  // Stages:
  // "email": Step 1 - Enter work email
  // "verify": Step 2 - Enter 8-digit verification code sent to email
  // "setPassword": Step 3 - Set distributor password
  // "setLocation": Step 4 - Set Phnom Penh pickup hub location
  // "login": Alternative - Direct login with email + existing password
  const [stage, setStage] = useState<"email" | "verify" | "setPassword" | "setLocation" | "login">("email");

  const [distributorId, setDistributorId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [locationData, setLocationData] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // 1. Submit email to check approval & send verification code
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setLoading(true);

    try {
      // Step A: Check if distributor is registered and active
      const statusRes = await fetch(`/api/distributor/claim?email=${encodeURIComponent(cleanEmail)}`);
      const statusData = await statusRes.json();

      if (!statusRes.ok) {
        setLoading(false);
        setError(statusData?.error || "This email is not authorized as a distributor.");
        return;
      }

      if (statusData?.id) {
        setDistributorId(statusData.id);
      }

      // Step B: Send OTP code to the email via Supabase
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
      });

      setLoading(false);

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setCode("");
      setStage("verify");
      setSuccessMsg(`We sent an 8-digit verification code to ${cleanEmail}.`);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Failed to initiate verification. Please try again.");
    }
  }

  // Resend code in verification stage
  async function handleResendCode() {
    setError("");
    setSuccessMsg("");
    setResending(true);

    const cleanEmail = email.trim().toLowerCase();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
    });

    setResending(false);

    if (otpError) {
      setError(otpError.message);
    } else {
      setSuccessMsg(`A new verification code has been sent to ${cleanEmail}.`);
    }
  }

  // 2. Verify OTP code
  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanCode) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: "email",
      });

      setLoading(false);

      if (verifyError) {
        setError(verifyError.message || "Invalid or expired verification code. Please check your email.");
        return;
      }

      // Verified successfully! Advance to password creation
      setStage("setPassword");
      setSuccessMsg("Email verified! Now create your account password.");
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Verification failed. Please try again.");
    }
  }

  // 3. Set password for distributor
  async function handleSetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // Update password on current Supabase session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Fallback to claim API if session user update fails
        const claimRes = await fetch("/api/distributor/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const claimData = await claimRes.json();
        if (!claimRes.ok) {
          setLoading(false);
          setError(claimData?.error || updateError.message);
          return;
        }
      } else {
        // Also sync via claim API to guarantee email_confirm and metadata
        await fetch("/api/distributor/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        }).catch(() => null);
      }

      setLoading(false);
      setSuccessMsg("Password set successfully! Next, configure your distribution hub location in Phnom Penh.");
      setStage("setLocation");
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Could not save password. Please try again.");
    }
  }

  // 4. Save distributor hub location
  async function handleSaveLocation() {
    if (!locationData || !locationData.address) {
      setError("Please choose or pin your hub location on the map.");
      return;
    }

    setSavingLocation(true);
    setError("");
    setSuccessMsg("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetId = distributorId || user?.id;

      const res = await fetch("/api/distributor/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distributorId: targetId,
          address: locationData.address,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not save hub location.");

      setSuccessMsg("Distribution hub location saved! Welcome to your dashboard.");
      setTimeout(() => {
        window.location.href = "/distributors/products";
      }, 700);
    } catch (err: any) {
      setSavingLocation(false);
      setError(err?.message || "Could not save hub location. Please try again.");
    }
  }

  function handleSkipLocation() {
    window.location.href = "/distributors/products";
  }

  // 5. Returning distributor login with password
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        setLoading(false);
        setError(signInError.message);
        return;
      }

      window.location.href = "/distributors/products";
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Sign in failed.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#e0e5de] bg-[#ffffff] px-4 py-3 text-sm text-[#24382d] placeholder-[#68746a] outline-none transition-all hover:border-[#d9dfd8] focus:border-[#1b4332] focus:bg-[#ffffff] focus:ring-4 focus:ring-[#1b4332]/15";

  return (
    <AuthShell
      eyebrow="Distributor Network"
      title={
        stage === "email"
          ? "Distributor Verification"
          : stage === "verify"
          ? "Enter Verification Code"
          : stage === "setPassword"
          ? "Create Your Password"
          : stage === "setLocation"
          ? "Set Phnom Penh Hub Location"
          : "Distributor Sign In"
      }
      description={
        stage === "email"
          ? "Enter your authorized work email. We will send an 8-digit verification code to confirm your account."
          : stage === "verify"
          ? `We sent an 8-digit code to ${email}. Enter the code below to verify your email.`
          : stage === "setPassword"
          ? `Set a secure password for ${email} so you can sign in anytime.`
          : stage === "setLocation"
          ? "Your partner farm is located outside Phnom Penh. Pin your urban depot or pickup location so couriers in Phnom Penh know where to collect packages."
          : "Sign in with your email and password to coordinate dispatches and deliveries."
      }
      footer={
        <div className="flex flex-col items-center gap-3 text-xs font-medium text-[#5d685f]">
          <div className="flex w-full items-center justify-between gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 font-bold text-[#1b4332] transition hover:text-[#123327] hover:underline"
            >
              <ArrowLeft size={15} />
              <span>Return to Merchant Login</span>
            </Link>

            {stage === "verify" && (
              <button
                type="button"
                onClick={() => {
                  setStage("email");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs font-semibold text-[#5d685f] underline hover:text-[#24382d] cursor-pointer"
              >
                Change email
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Error notification */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs font-semibold leading-relaxed text-[#991b1b]"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#b91c1c]" />
          <span>{error}</span>
        </div>
      )}

      {/* Success notification */}
      {successMsg && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-xs font-semibold leading-relaxed text-[#166534]"
        >
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#15803d]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STAGE 1: ENTER EMAIL */}
      {stage === "email" && (
        <div className="space-y-5">
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
                Authorized Work Email
              </label>
              <div className="relative mt-1.5">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="distributor@farmhub.com"
                  required
                  autoFocus
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Checking status &amp; sending code…</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Option to login with password if already configured */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setStage("login");
              }}
              className="text-xs font-bold text-[#1b4332] hover:text-[#123327] hover:underline cursor-pointer"
            >
              Already set a password? Sign in with password →
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: ENTER VERIFICATION CODE */}
      {stage === "verify" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-[#dfe6d9] bg-[#f8faf7] px-4 py-3 text-xs font-medium text-[#435449]">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-[#1b4332]" />
              <span>
                Code sent to: <strong className="text-[#1b4332]">{email}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setError("");
              }}
              className="font-bold text-[#1b4332] hover:underline cursor-pointer"
            >
              Edit
            </button>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
                Verification Code (8 Digits)
              </label>
              <div className="relative mt-1.5">
                <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\s+/g, ""))}
                  placeholder="12345678"
                  maxLength={8}
                  required
                  autoFocus
                  className={`${inputClass} pl-10 font-mono text-base font-bold tracking-widest text-[#1b4332] placeholder-[#a0aba1]`}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#667262]">
                Check your email inbox or spam folder for the code from Supabase.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Verifying code…</span>
                </>
              ) : (
                <>
                  <span>Verify Code &amp; Continue</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b4332] hover:text-[#123327] hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RotateCw size={13} className={resending ? "animate-spin" : ""} />
              <span>{resending ? "Sending new code…" : "Didn't receive code? Resend"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: SET PASSWORD */}
      {stage === "setPassword" && (
        <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
          <div className="rounded-xl border border-[#dfe6d9] bg-[#f8faf7] px-4 py-2.5 text-xs text-[#435449]">
            Setting password for: <strong className="text-[#1b4332]">{email}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
              New Password
            </label>
            <div className="relative mt-1.5">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoFocus
                className={`${inputClass} pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68746a] hover:text-[#24382d] cursor-pointer"
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
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength={8}
                className={`${inputClass} pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68746a] hover:text-[#24382d] cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Saving password…</span>
              </>
            ) : (
              <>
                <span>Save Password &amp; Set Hub Location</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* STAGE 4: SET DISTRIBUTION HUB LOCATION (PHNOM PENH) */}
      {stage === "setLocation" && (
        <div className="space-y-5">
          <div className="rounded-xl bg-[#e8f5e9]/70 border border-[#c8e6c9] p-3 text-xs text-[#1b4332] leading-relaxed">
            <p className="font-bold">📍 Urban Pickup Depot Setup</p>
            <p className="mt-0.5 text-[#2d6a4f]">
              Use GPS or search to set your hub address in Phnom Penh. Couriers will navigate here to pick up packages.
            </p>
          </div>

          <DistributorLocationPicker
            initialAddress=""
            onChange={(loc) => {
              setLocationData(loc);
              setError("");
            }}
          />

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveLocation}
              disabled={savingLocation}
              className="flex-1 w-full flex items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {savingLocation ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Saving hub location…</span>
                </>
              ) : (
                <>
                  <MapPin size={17} />
                  <span>Save Hub &amp; Go to Dashboard</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkipLocation}
              disabled={savingLocation}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: RETURNING DISTRIBUTOR PASSWORD LOGIN */}
      {stage === "login" && (
        <div className="space-y-5">
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
                Work Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="distributor@farmhub.com"
                  required
                  autoFocus
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#435449]">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746a]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={`${inputClass} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68746a] hover:text-[#24382d] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.25)] transition hover:bg-[#123327] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Verifying credentials…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Distributor Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setStage("email");
              }}
              className="text-xs font-bold text-[#1b4332] hover:text-[#123327] hover:underline cursor-pointer"
            >
              First time signing in or reset password? Verify with email code →
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}