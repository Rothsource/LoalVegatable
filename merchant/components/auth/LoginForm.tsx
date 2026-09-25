"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/lib/supabase";

export default function LoginForm({ initialError = "" }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }
    const role = data.user.user_metadata?.role;
    if (role === "distributor") {
      window.location.href = data.user.user_metadata?.must_change_password ? "/auth/reset-password?setup=1" : "/delivery/orders";
      return;
    }
    window.location.href = "/home";
  }

  const inputClass = "mt-2 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 hover:bg-gray-50 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

  return (
    <AuthShell 
      eyebrow="Secure access" 
      title="Welcome back" 
      description="Sign in to your merchant or distributor account."
      footer={<span>New to LocalVeg? <Link href="/auth/register" className="font-bold text-emerald-600 transition hover:text-emerald-700 hover:underline">Create an account</Link></span>}
    >
      {error && (
        <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="text-sm font-semibold text-gray-700">Email address</label>
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required className={inputClass} />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="text-sm font-semibold text-gray-700">Password</label>
            <Link href="/auth/forgot-password" className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline">Forgot password?</Link>
          </div>
          <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required className={inputClass} />
        </div>
        <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:translate-y-[-1px] hover:from-emerald-500 hover:to-emerald-400 hover:shadow-xl hover:shadow-emerald-500/30 disabled:pointer-events-none disabled:opacity-70">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="mt-6 flex flex-col items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 transition-colors hover:bg-emerald-50">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          First time as a distributor?
        </div>
        <p className="text-sm leading-relaxed text-emerald-700/80">Verify the email registered by your merchant to choose your password.</p>
        <Link href="/auth/distributor-setup" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 transition hover:text-emerald-800 hover:underline">
          Set up access <span>→</span>
        </Link>
      </div>
    </AuthShell>
  );
}
