'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CustomerAuthLayout from '@/components/auth/CustomerAuthLayout';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [readySession, setReadySession] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReadySession(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReadySession(true);
    });

    const timeout = setTimeout(() => {
      setReadySession((ready) => {
        if (!ready) setSessionError(true);
        return ready;
      });
    }, 4000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/auth/login'), 2500);
  };

  const inputClass =
    'w-full rounded-xl border border-[#dfe6dd] bg-white px-4 py-3 text-sm text-[#1b4332] placeholder-[#809185] outline-none transition-all hover:border-[#b7cbb9] focus:border-[#1b4332] focus:bg-white focus:ring-4 focus:ring-[#1b4332]/12';

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#e5ebe4] bg-white p-8 sm:p-10 text-center shadow-[0_12px_40px_rgba(27,67,50,0.06)]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#d2e4d3] bg-[#edf4ed] text-[#1b4332] shadow-sm">
            <CheckCircle2 size={36} />
          </div>
          <span className="inline-block rounded-full border border-[#d2e4d3] bg-[#edf4ed] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1b4332]">
            Password Updated
          </span>
          <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-[#1b4332]">
            Credentials secured!
          </h2>
          <p className="mt-2 text-sm text-[#526357]">
            Redirecting you to the sign-in page momentarily…
          </p>
          <div className="mt-6 flex justify-center">
            <Loader2 size={24} className="animate-spin text-[#1b4332]" />
          </div>
        </div>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#fecaca] bg-[#fef2f2] p-8 sm:p-10 text-center shadow-[0_12px_40px_rgba(27,67,50,0.06)]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#fecaca] bg-white text-[#b91c1c] shadow-sm">
            <AlertCircle size={36} />
          </div>
          <span className="inline-block rounded-full border border-[#fecaca] bg-white px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#b91c1c]">
            Link Expired
          </span>
          <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-[#991b1b]">
            Password link is invalid
          </h2>
          <p className="mt-2 text-sm text-[#7f1d1d]">
            This recovery link has expired or has already been used. Please request a new one.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/forgot-password"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.22)] transition-all hover:bg-[#133226]"
            >
              <span>Request new recovery link</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <CustomerAuthLayout
      eyebrow="Account Security"
      title="Create new password"
      subtitle="Choose a strong, secure password for your LocalVegetable account."
      footer={
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 font-bold text-[#1b4332] transition hover:text-[#2d6a4f] hover:underline"
        >
          <ArrowLeft size={15} />
          <span>Back to sign in</span>
        </Link>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-xs font-semibold leading-relaxed text-[#991b1b]"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0 text-[#b91c1c]" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#334b3d]">
            New Password
          </label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718578] transition hover:text-[#1b4332]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#334b3d]">
            Confirm New Password
          </label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
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
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.22)] transition-all hover:bg-[#133226] hover:shadow-[0_6px_20px_rgba(27,67,50,0.3)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Saving new password…</span>
            </>
          ) : (
            <>
              <span>Save Password & Continue</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </CustomerAuthLayout>
  );
}
