'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    // Supabase intentionally doesn't tell us if the email exists or not
    // (prevents account enumeration) — so we always show the same
    // success message unless there's an actual request error (rate limit, etc).
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="fp-wrapper">
      <div className="fp-form-panel">
        <div className="fp-form-inner">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ef', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2e7d32' }}>
                <Mail size={32} />
              </div>
              <h2 style={{ color: '#2e7d32', fontWeight: 800, fontSize: '28px', marginBottom: '12px' }}>
                Check your email!
              </h2>
              <p style={{ color: '#666', fontSize: '15px', lineHeight: 1.6 }}>
                If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
              </p>
              <p style={{ color: '#999', fontSize: '13px', marginTop: '24px' }}>
                <Link href="/auth/login" style={{ color: '#2e7d32', fontWeight: 700, textDecoration: 'none' }}>
                  Back to log in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="fp-title">Forgot password?</h1>
              <p className="fp-subtitle">
                Enter the email address linked to your account and we'll send you a reset link.
              </p>
              {error && <p className="fp-error">{error}</p>}
              <div className="fp-fields">
                <div>
                  <label className="fp-label">Email address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="fp-input"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="fp-btn-primary"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
                <p className="fp-back-text">
                  <Link href="/auth/login" className="fp-back-link">← Back to log in</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="fp-image-panel" />

      <style jsx>{`
        .fp-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: Inter, sans-serif;
          background-color: #fdfdfb;
        }

        .fp-form-panel {
          width: 50%;
          padding: 0 8%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .fp-form-inner {
          max-width: 420px;
          width: 100%;
          margin: 0 auto;
        }

        .fp-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          margin-bottom: 8px;
          color: #1a1a1a;
          letter-spacing: -1px;
        }

        .fp-subtitle {
          color: #666;
          margin-bottom: 32px;
          font-size: 16px;
          line-height: 1.5;
        }

        .fp-error {
          color: red;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .fp-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .fp-label {
          display: block;
          margin-bottom: 8px;
          color: #444;
          font-weight: 600;
          font-size: 14px;
        }

        .fp-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
          outline: none;
          font-size: 16px;
          box-sizing: border-box;
        }

        .fp-btn-primary {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          background-color: #2e7d32;
          color: #fff;
          border: none;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          box-sizing: border-box;
        }

        .fp-back-text {
          text-align: center;
          font-size: 14px;
          margin-top: 4px;
        }

        .fp-back-link {
          color: #2e7d32;
          font-weight: 700;
          text-decoration: none;
        }

        .fp-image-panel {
          width: 50%;
          background-image: url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200');
          background-size: cover;
          background-position: center;
          border-left: 1px solid #eee;
        }

        @media (max-width: 1024px) {
          .fp-form-panel { padding: 0 6%; }
        }

        @media (max-width: 820px) {
          .fp-wrapper { flex-direction: column; min-height: 100dvh; }
          .fp-image-panel { display: none; }
          .fp-form-panel { width: 100%; min-height: 100dvh; padding: 32px 6% 48px; justify-content: flex-start; }
        }

        @media (max-width: 480px) {
          .fp-form-panel { padding: 24px 20px 40px; }
        }
      `}</style>
    </div>
  );
}