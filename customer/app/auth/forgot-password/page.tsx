"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CustomerForgotPasswordPage() {
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
      setError("Please enter a valid customer email address.");
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
        const match = data.error?.match(/after (\d+) seconds/i);
        if (match) {
          const secs = parseInt(match[1], 10);
          setEmail(normalizedEmail);
          setStep("code");
          setResendCooldown(secs);
          setMessage(`A verification code was already dispatched to ${normalizedEmail}. Please check your email inbox.`);
          setTimeout(() => inputRefs.current[0]?.focus(), 150);
          return;
        }

        setError(data.error || "Failed to generate verification code.");
        return;
      }

      setEmail(normalizedEmail);
      setStep("code");
      setResendCooldown(60);
      setMessage(`An 8-digit verification code has been dispatched to ${normalizedEmail}. Please check your email.`);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch {
      setLoading(false);
      setError("Network connection error. Please check your internet and try again.");
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

  // Step 2: Verify 8-digit code
  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    const code = digits.join("").trim();
    if (code.length < 6) {
      setError("Please enter the 8-digit verification code.");
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

  // Resend code handler
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
        setResendCooldown(60);
        setMessage("A fresh 8-digit verification code has been sent to your email.");
      } else {
        const match = data.error?.match(/after (\d+) seconds/i);
        if (match) {
          const secs = parseInt(match[1], 10);
          setResendCooldown(secs);
          setError(`Security cooldown active: please wait ${secs}s before requesting a new code.`);
          return;
        }
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FBF8F2", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: "#24382d" }}>
      <div style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>
        
        {/* Brand Header */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/image/logo.png"
              alt="LocalVegetable"
              style={{ width: "40px", height: "40px", maxWidth: "40px", maxHeight: "40px", objectFit: "contain", borderRadius: "10px" }}
            />
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#1b4332", letterSpacing: "-0.5px" }}>
              LocalVegetable
            </span>
          </Link>
        </div>

        {/* Form Card */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8e0", padding: "36px 30px", boxShadow: "0 14px 40px rgba(27,67,50,0.07)" }}>
          <div style={{ marginBottom: "22px" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.2px", color: "#765238" }}>
              Account Recovery
            </span>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#20382b", margin: "6px 0 0 0", letterSpacing: "-0.5px" }}>
              {step === "email" && "Reset your password"}
              {step === "code" && "Verify 8-digit code"}
              {step === "password" && "Set new password"}
              {step === "success" && "Password updated"}
            </h1>
            <p style={{ fontSize: "13.5px", color: "#5d685f", margin: "8px 0 0 0", lineHeight: "1.5" }}>
              {step === "email" && "Enter your customer email and we’ll generate an 8-digit security code to verify your identity."}
              {step === "code" && `Enter the 8-digit code sent to ${email} to proceed.`}
              {step === "password" && "Create a secure new password for your customer account."}
              {step === "success" && "Your account credentials have been updated successfully."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "12px 14px", marginBottom: "18px", fontSize: "13px", fontWeight: "600", color: "#991b1b" }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#b91c1c" }} />
              <span>{error}</span>
            </div>
          )}

          {/* Informational Message */}
          {message && step === "code" && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", backgroundColor: "#f0fdf0", border: "1px solid #c8e6c9", borderRadius: "14px", padding: "12px 14px", marginBottom: "18px", fontSize: "13px", fontWeight: "600", color: "#0A490A" }}>
              <Mail size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#0DB30D" }} />
              <span>{message}</span>
            </div>
          )}

          {/* ── STEP 1: Email ── */}
          {step === "email" && (
            <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label htmlFor="customer-recovery-email" style={{ display: "block", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", color: "#435449", marginBottom: "6px" }}>
                  Customer Email Address
                </label>
                <input
                  id="customer-recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="customer@example.com"
                  style={{ width: "100%", borderRadius: "12px", border: "1px solid #d9dfd8", backgroundColor: "#ffffff", padding: "12px 16px", fontSize: "14px", color: "#24382d", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "#1b4332", color: "#ffffff", padding: "14px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(27,67,50,0.25)", marginTop: "4px" }}
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
            <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <Mail size={22} style={{ color: "#166534", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span style={{ display: "block", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", color: "#166534" }}>
                    Check Your Email
                  </span>
                  <span style={{ display: "block", fontSize: "13px", color: "#15803d", marginTop: "4px", lineHeight: "1.4" }}>
                    We sent an 8-digit verification code to <strong>{email}</strong>. Please check your Gmail or email inbox (including spam folder) and enter the code below.
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", color: "#435449", marginBottom: "8px" }}>
                  Enter 8-Digit Code
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "6px" }} onPaste={handlePaste}>
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
                      style={{ height: "46px", borderRadius: "10px", border: "1.5px solid #d9dfd8", backgroundColor: "#ffffff", textAlign: "center", fontSize: "18px", fontWeight: "800", color: "#1b4332", outline: "none", width: "100%", boxSizing: "border-box" }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || digits.join("").trim().length < 6}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "#1b4332", color: "#ffffff", padding: "14px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", border: "none", cursor: loading || digits.join("").trim().length < 6 ? "not-allowed" : "pointer", opacity: loading || digits.join("").trim().length < 6 ? 0.6 : 1, boxShadow: "0 4px 16px rgba(27,67,50,0.25)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Verifying code…</span>
                  </>
                ) : (
                  <>
                    <span>Verify 8-Digit Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#5d685f" }}>
                <span>Didn’t receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  style={{ background: "none", border: "none", color: "#765238", fontWeight: "700", cursor: resendCooldown > 0 ? "default" : "pointer", textDecoration: "underline", opacity: resendCooldown > 0 ? 0.6 : 1 }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#765238", fontSize: "12px", textDecoration: "underline", cursor: "pointer" }}
                >
                  Change email address
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", color: "#435449", marginBottom: "6px" }}>
                  New Password (min 8 chars)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #d9dfd8", backgroundColor: "#ffffff", padding: "12px 42px 12px 16px", fontSize: "14px", color: "#24382d", outline: "none", boxSizing: "border-box" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#68746a" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.8px", color: "#435449", marginBottom: "6px" }}>
                  Confirm New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: "100%", borderRadius: "12px", border: "1px solid #d9dfd8", backgroundColor: "#ffffff", padding: "12px 16px", fontSize: "14px", color: "#24382d", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "#1b4332", color: "#ffffff", padding: "14px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(27,67,50,0.25)", marginTop: "4px" }}
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
            <div style={{ backgroundColor: "#f8faf7", border: "1px solid #e2e8e0", borderRadius: "16px", padding: "24px 20px", textAlign: "center" }}>
              <div style={{ width: "52px", height: "52px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "16px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669" }}>
                <CheckCircle2 size={28} />
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#24382d", margin: "14px 0 6px 0" }}>
                Password updated!
              </h2>
              <p style={{ fontSize: "12.5px", color: "#5d685f", margin: "0 0 18px 0", lineHeight: "1.5" }}>
                Your customer account credentials have been verified by 8-digit code and updated. Redirecting to sign in…
              </p>
              <Link
                href="/auth/login"
                style={{ display: "inline-flex", width: "100%", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "#1b4332", color: "#ffffff", padding: "12px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", textDecoration: "none", boxSizing: "border-box" }}
              >
                <span>Go to Sign In</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Back to sign in */}
          {step !== "success" && (
            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e4e8e2", textAlign: "center" }}>
              <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#765238", textDecoration: "none" }}>
                <ArrowLeft size={15} />
                <span>Back to sign in</span>
              </Link>
            </div>
          )}
        </div>

        <p style={{ marginTop: "24px", textAlign: "center", fontSize: "12px", color: "#68746a" }}>
          Fresh Local Produce Market · Customer Care
        </p>
      </div>
    </div>
  );
}
