"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    const { data, error: updateError } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    router.push(data.user.user_metadata?.role === "distributor" ? "/delivery/orders" : "/home");
  }

  const inputClass = "mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100";
  return (
    <AuthShell eyebrow="Secure your account" title="Choose a new password" description="Use at least 8 characters and avoid reusing a password from another account.">
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="new-password" className="text-sm font-bold text-gray-700">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /></div>
        <div><label htmlFor="confirm-password" className="text-sm font-bold text-gray-700">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} className={inputClass} /></div>
        <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-green-600 py-3 text-sm font-black text-white hover:bg-green-700 disabled:opacity-60">{loading ? "Saving…" : "Save new password"}</button>
      </form>
    </AuthShell>
  );
}
