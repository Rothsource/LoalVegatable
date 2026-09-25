"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

type Step = "email" | "code" | "password" | "done";

export default function DistributorSetupPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });
    if (otpError) setError(otpError.message);
    else { setEmail(normalizedEmail); setStep("code"); }
    setLoading(false);
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    if (verifyError) {
      setError(verifyError.message);
    } else if (data.user?.user_metadata?.role !== "distributor") {
      await supabase.auth.signOut();
      setError("This email is not registered as a distributor account.");
    } else {
      setStep("password");
    }
    setLoading(false);
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (updateError) setError(updateError.message);
    else setStep("done");
    setLoading(false);
  }

  const inputClass = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100";
  const stepIndex = step === "email" ? 0 : step === "code" ? 1 : 2;
  const description = step === "email"
    ? "Enter the email address your merchant registered."
    : step === "code"
      ? `Enter the verification code sent to ${email}.`
      : step === "password"
        ? "Choose the password you will use for distributor sign-in."
        : "Your distributor password is ready.";

  return (
    <AuthShell eyebrow="Distributor access" title="Set up your password" description={description}
      footer={<Link href="/auth/login" className="font-black text-green-600 hover:underline">← Back to sign in</Link>}>
        {step !== "done" && (
          <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Account setup progress">
            {["Email", "Verify", "Password"].map((label, index) => (
              <li key={label} className={`rounded-xl px-2 py-2.5 text-center text-[11px] font-black ${index <= stepIndex ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400"}`} aria-current={index === stepIndex ? "step" : undefined}>
                <span className="mr-1">{index + 1}</span>{label}
              </li>
            ))}
          </ol>
        )}

        {error && <div role="alert" className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-4">
            <div><label htmlFor="setup-email" className="mb-1.5 block text-sm font-bold text-gray-700">Email address</label><input id="setup-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" className={inputClass} /></div>
            <button disabled={loading} className="w-full rounded-xl bg-green-600 py-3 text-sm font-black text-white hover:bg-green-700 disabled:opacity-60">{loading ? "Sending…" : "Send verification code"}</button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-4">
            <div><label htmlFor="setup-code" className="mb-1.5 block text-sm font-bold text-gray-700">Verification code</label><input id="setup-code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter code" className={inputClass} /></div>
            <button disabled={loading} className="w-full rounded-xl bg-green-600 py-3 text-sm font-black text-white hover:bg-green-700 disabled:opacity-60">{loading ? "Verifying…" : "Verify code"}</button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} className="w-full text-sm font-bold text-green-600 hover:underline">Use a different email</button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={savePassword} className="space-y-4">
            <div><label htmlFor="setup-password" className="mb-1.5 block text-sm font-bold text-gray-700">New password</label><input id="setup-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /></div>
            <div><label htmlFor="setup-password-confirm" className="mb-1.5 block text-sm font-bold text-gray-700">Confirm password</label><input id="setup-password-confirm" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} /></div>
            <button disabled={loading} className="w-full rounded-xl bg-green-600 py-3 text-sm font-black text-white hover:bg-green-700 disabled:opacity-60">{loading ? "Saving…" : "Set new password"}</button>
          </form>
        )}

        {step === "done" && <div className="rounded-2xl border border-green-100 bg-green-50 p-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 font-black text-white">✓</span><p className="mt-4 text-sm font-black text-green-900">Setup complete</p><p className="mt-1 text-sm leading-6 text-green-700">You can now open your assigned orders and merchant product catalog.</p><Link href="/delivery/orders" className="mt-5 block rounded-xl bg-green-600 py-3 text-center text-sm font-black text-white hover:bg-green-700">Continue to orders</Link></div>}
    </AuthShell>
  );
}
