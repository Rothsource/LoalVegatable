'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerAuthLayout from '@/components/auth/CustomerAuthLayout';

export default function OTPPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(8).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    setDigits(prev => prev.map((d, i) => i === index ? val : d));
    if (val && index < 7) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 7) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8).split('');
    if (!pasted.length) return;
    setDigits(Array.from({ length: 8 }, (_, i) => pasted[i] ?? ''));
    inputs.current[Math.min(pasted.length, 8) - 1]?.focus();
  };

  return (
    <CustomerAuthLayout
      eyebrow="Account Verification"
      title="Check your email"
      subtitle="We sent an 8-digit confirmation code to your email address."
      footer={
        <span>
          Didn&apos;t receive the code?{' '}
          <button type="button" className="font-bold text-[#1b4332] hover:text-[#2d6a4f] hover:underline">
            Resend code
          </button>
        </span>
      }
    >
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            value={digit}
            maxLength={1}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Verification digit ${i + 1}`}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="h-11 sm:h-14 min-w-0 rounded-xl border border-[#dfe6dd] bg-white text-center text-base sm:text-xl font-bold text-[#1b4332] outline-none transition-all hover:border-[#b7cbb9] focus:border-[#1b4332] focus:ring-4 focus:ring-[#1b4332]/12 px-0"
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
