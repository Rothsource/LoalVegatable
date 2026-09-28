'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import CustomerAuthLayout from '@/components/auth/CustomerAuthLayout';

export default function OTPPage() {
  const router = useRouter();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.value.length > 0 && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <CustomerAuthLayout
      eyebrow="Account Verification"
      title="Check your email"
      subtitle="We sent a 6-digit confirmation code to your email address."
      footer={
        <span>
          Didn&apos;t receive the code?{' '}
          <button type="button" className="font-bold text-[#1b4332] hover:text-[#2d6a4f] hover:underline">
            Resend code
          </button>
        </span>
      }
    >
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            maxLength={1}
            inputMode="numeric"
            aria-label={`Verification digit ${i + 1}`}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="h-14 min-w-0 rounded-xl border border-[#dfe6dd] bg-white text-center text-xl font-bold text-[#1b4332] outline-none transition-all hover:border-[#b7cbb9] focus:border-[#1b4332] focus:ring-4 focus:ring-[#1b4332]/12"
          />
        ))}
      </div>

      <button
        onClick={() => router.push('/auth/user-info')}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b4332] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(27,67,50,0.22)] transition-all hover:bg-[#133226] hover:shadow-[0_6px_20px_rgba(27,67,50,0.3)] active:scale-[0.99]"
      >
        Verify code
      </button>
    </CustomerAuthLayout>
  );
}
