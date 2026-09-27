'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  // Supabase's reset-password email link contains a recovery token in the
  // URL. The client library (with detectSessionInUrl enabled) picks this up
  // automatically and fires PASSWORD_RECOVERY once a session is established.
  // We wait for that before letting the user submit a new password.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReadySession(true);
    });

    // In case the event already fired before this component mounted,
    // fall back to checking for an existing session.
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

  const handleSubmit = async () => {
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

  return (
    <div className="rp-wrapper">
      <div className="rp-form-panel">
        <div className="rp-form-inner">
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ef', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2e7d32' }}>
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ color: '#2e7d32', fontWeight: 800, fontSize: '28px', marginBottom: '12px' }}>
                Password updated!
              </h2>
              <p style={{ color: '#666', fontSize: '15px' }}>Redirecting you to log in...</p>
            </div>
          ) : sessionError ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <h2 style={{ color: '#b33a2e', fontWeight: 800, fontSize: '24px', marginBottom: '12px' }}>
                This link has expired
              </h2>
              <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>
                Reset links are only valid for a short time. Please request a new one.
              </p>
              <a href="/auth/forgot-password" style={{ color: '#2e7d32', fontWeight: 700, textDecoration: 'none' }}>
                Request a new link
              </a>
            </div>
          ) : !readySession ? (
            <p style={{ color: '#666', fontSize: '15px' }}>Verifying your link...</p>
          ) : (
            <>
              <h1 className="rp-title">Set a new password</h1>
              <p className="rp-subtitle">Choose a strong password you haven't used before.</p>
              {error && <p className="rp-error">{error}</p>}
              <div className="rp-fields">
                <div>
                  <label className="rp-label">New password</label>
                  <div className="rp-password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rp-input"
                    />
                    <div onClick={() => setShowPassword(!showPassword)} className="rp-eye-toggle">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>At least 8 characters</p>
                </div>
                <div>
                  <label className="rp-label">Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="rp-input"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rp-btn-primary"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="rp-image-panel" />

      <style jsx>{`
        .rp-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: Inter, sans-serif;
          background-color: #fdfdfb;
        }

        .rp-form-panel {
          width: 50%;
          padding: 0 8%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .rp-form-inner {
          max-width: 420px;
          width: 100%;
          margin: 0 auto;
        }

        .rp-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          margin-bottom: 8px;
          color: #1a1a1a;
          letter-spacing: -1px;
        }

        .rp-subtitle {
          color: #666;
          margin-bottom: 32px;
          font-size: 16px;
        }

        .rp-error {
          color: red;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .rp-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .rp-label {
          display: block;
          margin-bottom: 8px;
          color: #444;
          font-weight: 600;
          font-size: 14px;
        }

        .rp-password-wrap {
          position: relative;
        }

        .rp-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
          outline: none;
          font-size: 16px;
          box-sizing: border-box;
        }

        .rp-eye-toggle {
          position: absolute;
          right: 16px;
          top: 14px;
          cursor: pointer;
          color: #888;
        }

        .rp-btn-primary {
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

        .rp-image-panel {
          width: 50%;
          background-image: url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200');
          background-size: cover;
          background-position: center;
          border-left: 1px solid #eee;
        }

        @media (max-width: 1024px) {
          .rp-form-panel { padding: 0 6%; }
        }

        @media (max-width: 820px) {
          .rp-wrapper { flex-direction: column; min-height: 100dvh; }
          .rp-image-panel { display: none; }
          .rp-form-panel { width: 100%; min-height: 100dvh; padding: 32px 6% 48px; justify-content: flex-start; }
        }

        @media (max-width: 480px) {
          .rp-form-panel { padding: 24px 20px 40px; }
        }
      `}</style>
    </div>
  );
}