'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';

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
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Inter, sans-serif', backgroundColor: '#fdfdfb' }}>
      <div style={{ width: '50%', padding: '0 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a', letterSpacing: '-1px' }}>Check your email</h1>
          <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px' }}>We sent a 6-digit code to your email.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '32px' }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el }}
                type="text"
                maxLength={1}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                style={{ width: '56px', height: '64px', textAlign: 'center', fontSize: '24px', fontWeight: '700', borderRadius: '12px', border: '2px solid #e0e0e0', outline: 'none' }}
              />
            ))}
          </div>
          <button onClick={() => router.push('/user-info')} style={{ width: '100%', padding: '14px', borderRadius: '10px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', fontWeight: '600', fontSize: '16px', cursor: 'pointer' }}>
            Verify code
          </button>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '20px' }}>
            Didn't receive the email? <span style={{ color: '#2e7d32', fontWeight: '700', cursor: 'pointer' }}>Click to resend</span>
          </p>
        </div>
      </div>
      <div style={{ width: '50%', backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')", backgroundSize: 'cover', backgroundPosition: 'center', borderLeft: '1px solid #eee' }} />
    </div>
  );
}