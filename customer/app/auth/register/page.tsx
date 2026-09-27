'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { CircularLoader } from '@/components/CustomerSkeleton';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!agreedToTerms) { setError('Please agree to the Terms of Service first.'); return; }
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'user' },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/shop`,
      }
    });

    if (error) { setError(error.message); setLoading(false); return; }

    // ── Supabase quirk: if the email is already registered, signUp does NOT
    // return an error (this is intentional, to prevent attackers from using
    // this form to check which emails have accounts). Instead it returns a
    // user object with an EMPTY identities array. Without this check, the
    // form would show "Check your email!" even though nothing actually
    // happened — no new account, no new email sent. ──
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists. Try logging in instead.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) setError(error.message);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    outline: 'none',
    fontSize: '15px',
    boxSizing: 'border-box',
  };

  const btnPrimaryStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#2e7d32',
    color: '#fff',
    border: 'none',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  const btnGoogleStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '15px',
    boxSizing: 'border-box',
  };

  return (
    <div className="register-wrapper">
      <div className="register-form-panel">
        <div className="register-form-inner">
          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ef', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2e7d32' }}>
                <Mail size={32} />
              </div>
              <h2 style={{ color: '#2e7d32', fontWeight: '800', fontSize: '28px', marginBottom: '12px' }}>Check your email!</h2>
              <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6' }}>
                We sent a confirmation link to <strong>{email}</strong>.<br />Click it to activate your account.
              </p>
              <p style={{ color: '#999', fontSize: '13px', marginTop: '24px' }}>
                Already confirmed? <Link href="/auth/login" style={{ color: '#2e7d32', fontWeight: '700', textDecoration: 'none' }}>Log in</Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="register-title">Sign up</h1>
              <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px' }}>Join Local Vegetable today</p>
              {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Email address</label>
                  <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
                    <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '14px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                      {showPassword ? <><EyeOff size={18} /> Hide</> : <><Eye size={18} /> Show</>}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Use 8+ characters with a mix of letters, numbers & symbols</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ accentColor: '#2e7d32' }} />
                    I agree to the <Link href="#" style={{ textDecoration: 'underline', color: '#000' }}>Terms of Service</Link> and <Link href="#" style={{ textDecoration: 'underline', color: '#000' }}>Privacy Policy</Link>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ accentColor: '#2e7d32' }} /> Subscribe to our newsletter
                  </label>
                </div>
                <button onClick={handleRegister} disabled={loading} style={{ ...btnPrimaryStyle, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? (
                    <>
                      <CircularLoader size={18} strokeWidth={2.5} />
                      <span>Creating account…</span>
                    </>
                  ) : 'Create account'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                  <span style={{ padding: '0 15px', color: '#bbb', fontSize: '12px', fontWeight: '600' }}>OR CONTINUE WITH</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                </div>
                <button onClick={handleGoogleSignUp} style={btnGoogleStyle}>
                  <img src="https://authjs.dev/img/providers/google.svg" width="18" alt="Google" /> Continue with Google
                </button>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '20px' }}>
                  Already have an account? <Link href="/auth/login" style={{ color: '#2e7d32', fontWeight: '700', textDecoration: 'none' }}>Log In</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="register-image-panel" />

      <style jsx>{`
        .register-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: Inter, sans-serif;
          background-color: #fdfdfb;
        }

        .register-form-panel {
          width: 50%;
          padding: 0 8%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .register-form-inner {
          max-width: 420px;
          width: 100%;
          margin: 0 auto;
        }

        .register-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          margin-bottom: 8px;
          color: #1a1a1a;
          letter-spacing: -1px;
        }

        .register-image-panel {
          width: 50%;
          background-image: url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200');
          background-size: cover;
          background-position: center;
          border-left: 1px solid #eee;
        }

        @media (max-width: 1024px) {
          .register-form-panel {
            padding: 0 6%;
          }
        }

        @media (max-width: 820px) {
          .register-wrapper {
            flex-direction: column;
            min-height: 100dvh;
          }

          .register-image-panel {
            display: none;
          }

          .register-form-panel {
            width: 100%;
            min-height: 100dvh;
            padding: 32px 6% 48px;
            justify-content: flex-start;
          }
        }

        @media (max-width: 480px) {
          .register-form-panel {
            padding: 24px 20px 40px;
          }
        }
      `}</style>
    </div>
  );
}