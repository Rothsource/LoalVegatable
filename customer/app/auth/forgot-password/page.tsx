'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomerAuthLayout from '@/components/auth/CustomerAuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  const inputClass =
    'w-full rounded-xl border border-[#dfe6dd] bg-white px-4 py-3 text-sm text-[#1b4332] placeholder-[#809185] outline-none transition-all hover:border-[#b7cbb9] focus:border-[#1b4332] focus:bg-white focus:ring-4 focus:ring-[#1b4332]/12';

  return (
    <CustomerAuthLayout
      eyebrow="Account Security"
      title={sent ? 'Check your email' : 'Forgot password?'}
      subtitle={
        sent
          ? `If an account is associated with ${email}, we've sent a link to reset your password.`
          : 'Enter your account email address and we’ll dispatch a secure recovery link.'
      }
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
      {sent ? (
        <div className="rounded-2xl border border-[#d2e4d3] bg-[#edf4ed] p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d2e4d3] bg-white text-[#1b4332] shadow-sm">
            <CheckCircle2 size={28} />
          </div>
          <p className="mt-4 font-heading text-lg font-bold text-[#1b4332]">
            Password reset link sent
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#526357]">
            Please check your spam or promotions folder if you don&apos;t receive it within a few minutes.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-5 inline-block text-xs font-bold text-[#1b4332] underline transition hover:text-[#2d6a4f]"
          >
            Try a different email address
          </button>
        </div>
      ) : (
        <>
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
                Your Account Email
              </label>
              <div className="relative mt-1.5">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718578]" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${inputClass} pl-10`}
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
                  <span>Sending reset link…</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Link</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </CustomerAuthLayout>
  );
}
