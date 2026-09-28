'use client';

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CustomerAuthLayout from '@/components/auth/CustomerAuthLayout';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service to continue.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { role: 'user' },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/shop`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('An account with this email already exists. Try signing in instead.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  };

  const inputClass =
    'w-full rounded-xl border border-[#dfe6dd] bg-white px-4 py-3 text-sm text-[#1b4332] placeholder-[#809185] outline-none transition-all hover:border-[#b7cbb9] focus:border-[#1b4332] focus:bg-white focus:ring-4 focus:ring-[#1b4332]/12';

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-md rounded-3xl border border-[#e5ebe4] bg-white p-8 text-center shadow-[0_12px_40px_rgba(27,67,50,0.06)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d2e4d3] bg-[#edf4ed] text-[#1b4332] shadow-sm">
            <CheckCircle2 size={32} />
          </div>
          <span className="mt-5 inline-block rounded-full border border-[#d2e4d3] bg-[#edf4ed] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1b4332]">
            Activation Link Sent
          </span>
          <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-[#1b4332]">
            Check your email inbox
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#526357]">
            We sent an activation link to <strong className="font-semibold text-[#1b4332]">{email}</strong>.
            Click it to confirm your email and complete your delivery address.
          </p>

          <div className="mt-8">
            <Link
              href="/auth/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.22)] transition-all hover:bg-[#133226] hover:shadow-[0_6px_20px_rgba(27,67,50,0.3)]"
            >
              <span>Return to Customer Sign In</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <CustomerAuthLayout
      eyebrow="Join Local Market"
      title="Create account"
      subtitle="Sign up to order harvest-fresh vegetables delivered directly to your doorstep in Cambodia."
      footer={
        <span>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-[#1b4332] transition hover:text-[#2d6a4f] hover:underline">
            Sign in
          </Link>
        </span>
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

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#334b3d]">
            Email Address
          </label>
          <div className="mt-1.5">
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#334b3d]">
            Password
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

        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5 text-xs text-[#526357] cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#c9d7cb] text-[#1b4332] accent-[#1b4332] focus:ring-[#1b4332]"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-[#1b4332] underline hover:text-[#2d6a4f]">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-semibold text-[#1b4332] underline hover:text-[#2d6a4f]">
                Privacy Policy
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-[#526357] cursor-pointer">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#c9d7cb] text-[#1b4332] accent-[#1b4332] focus:ring-[#1b4332]"
            />
            <span>Receive seasonal vegetable harvest updates and farmer specials.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.22)] transition-all hover:bg-[#133226] hover:shadow-[0_6px_20px_rgba(27,67,50,0.3)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Creating your account…</span>
            </>
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-[#718578]">
          <span className="h-px flex-1 bg-[#e0e6de]" />
          <span>Or sign up with</span>
          <span className="h-px flex-1 bg-[#e0e6de]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#dfe6dd] bg-white py-3 text-sm font-semibold text-[#1b4332] shadow-sm transition hover:border-[#b7cbb9] hover:bg-[#f8faf7] active:scale-[0.99]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://authjs.dev/img/providers/google.svg" width="18" height="18" alt="Google" />
          <span>Sign up with Google</span>
        </button>
      </form>
    </CustomerAuthLayout>
  );
}