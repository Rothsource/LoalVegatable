"use client";

import Link from "next/link";
import { useState } from "react";
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
    if (resetError) setError(resetError.message);
    else { setEmail(normalizedEmail); setSent(true); }
    setLoading(false);
  }

  return (
    <AuthShell eyebrow="Account recovery" title={sent ? "Check your inbox" : "Reset your password"}
      description={sent ? `We sent a secure reset link to ${email}.` : "Enter the email associated with your account and we’ll send a secure reset link."}
      footer={<Link href="/auth/login" className="font-black text-green-600 hover:underline">← Back to sign in</Link>}>
      {sent ? (
        <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white" aria-hidden="true">✓</span>
          <p className="mt-4 text-sm font-black text-green-900">Reset link sent</p>
          <p className="mt-1 text-sm leading-6 text-green-700">The link expires for security. Check spam if it does not arrive within a few minutes.</p>
          <button type="button" onClick={() => setSent(false)} className="mt-4 text-xs font-black text-green-700 hover:underline">Use a different email</button>
        </div>
      ) : (
        <>
          {error && <div role="alert" className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label htmlFor="recovery-email" className="text-sm font-bold text-gray-700">Email address</label><input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100" /></div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-green-600 py-3 text-sm font-black text-white hover:bg-green-700 disabled:opacity-60">{loading ? "Sending…" : "Send reset link"}</button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
