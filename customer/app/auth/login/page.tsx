'use client';

import React, { useState, Suspense } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CircularLoader } from '@/components/CustomerSkeleton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Decide where to send the user after ANY successful sign-in ──
  // If they've already completed their profile (name + delivery location),
  // skip straight to the shop / intended page. Otherwise, make them
  // finish onboarding first.
  const redirectBasedOnProfile = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profile_users')
      .select('first_name, location')
      .eq('id', userId)
      .maybeSingle();

    // If the lookup itself failed (RLS, network, etc.), don't hang forever —
    // log it and fall back to sending them to user-info rather than leaving
    // the button stuck on "Signing in...".
    if (profileError) {
      console.error('Profile lookup failed:', profileError);
      router.push('/auth/user-info');
      return;
    }

    const profileComplete = !!profile?.first_name && !!profile?.location;

    if (!profileComplete) {
      router.push('/auth/user-info');
      return;
    }

    const redirectTo = searchParams.get('redirectTo') || '/';
    router.push(redirectTo);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('signInWithPassword error:', error);
        setError(error.message || `Login failed (${error.status ?? 'unknown'})`);
        return;
      }

      await redirectBasedOnProfile(data.user.id);
    } catch (err) {
      // Catches anything unexpected (network failure, thrown exception, etc.)
      // so the button never gets stuck on "Signing in..." indefinitely.
      console.error('Login failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth login ──
  // The profile-complete check for Google users lives in
  // app/auth/callback/route.ts (it mirrors redirectBasedOnProfile above).
  // The one thing THIS component is responsible for is making sure the
  // page the user was originally trying to reach survives the round trip
  // through Google and back to /auth/callback — otherwise the callback
  // route has no way to know where to send them and always falls back to '/'.
  const handleGoogleLogin = async () => {
    const redirectTo = searchParams.get('redirectTo') || '/';
    const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="login-wrapper">
      <div className="login-form-panel">
        <div className="login-form-inner">
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Log in to your Local Vegetable account</p>
          {error && <p className="login-error">{error}</p>}
          <div className="login-fields">
            <div>
              <label className="login-label">Email address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
              />
            </div>
            <div>
              <div className="login-password-row">
                <label className="login-label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="/auth/forgot-password" className="login-forgot">Forgot password?</Link>
              </div>
              <div className="login-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
                <div onClick={() => setShowPassword(!showPassword)} className="login-eye-toggle">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>
            <button onClick={handleLogin} disabled={loading} className="login-btn-primary" style={{ opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? (
                <>
                  <CircularLoader size={18} strokeWidth={2.5} />
                  <span>Signing in…</span>
                </>
              ) : 'Sign in'}
            </button>
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">OR</span>
              <div className="login-divider-line" />
            </div>
            <button onClick={handleGoogleLogin} className="login-btn-google">
              <img src="https://authjs.dev/img/providers/google.svg" width="18" alt="Google" /> Continue with Google
            </button>
            <p className="login-signup-text">
              Don't have an account? <Link href="/auth/register" className="login-signup-link">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
      <div className="login-image-panel" />

      <style jsx>{`
        .login-wrapper {
          display: flex;
          min-height: 100vh;
          width: 100%;
          font-family: Inter, sans-serif;
          background-color: #fdfdfb;
        }

        .login-form-panel {
          width: 50%;
          padding: 0 8%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-form-inner {
          max-width: 420px;
          width: 100%;
          margin: 0 auto;
        }

        .login-title {
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          margin-bottom: 8px;
          color: #1a1a1a;
          letter-spacing: -1px;
        }

        .login-subtitle {
          color: #666;
          margin-bottom: 32px;
          font-size: 16px;
        }

        .login-error {
          color: red;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .login-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-label {
          display: block;
          margin-bottom: 8px;
          color: #444;
          font-weight: 600;
          font-size: 14px;
        }

        .login-password-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .login-forgot {
          font-size: 13px;
          color: #2e7d32;
          font-weight: 600;
          cursor: pointer;
        }

        .login-password-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
          outline: none;
          font-size: 16px; /* 16px prevents iOS auto-zoom on focus */
          box-sizing: border-box;
        }

        .login-eye-toggle {
          position: absolute;
          right: 16px;
          top: 14px;
          cursor: pointer;
          color: #888;
        }

        .login-btn-primary {
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

        .login-btn-google {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 15px;
          box-sizing: border-box;
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: 10px 0;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background-color: #eee;
        }

        .login-divider-text {
          padding: 0 15px;
          color: #bbb;
          font-size: 12px;
        }

        .login-signup-text {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 20px;
        }

        .login-signup-link {
          color: #2e7d32;
          font-weight: 700;
          text-decoration: none;
        }

        .login-image-panel {
          width: 50%;
          background-image: url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200');
          background-size: cover;
          background-position: center;
          border-left: 1px solid #eee;
        }

        /* Tablets (iPad portrait and similar) */
        @media (max-width: 1024px) {
          .login-form-panel {
            padding: 0 6%;
          }
        }

        /* Below this width, drop the side image and stack full-width form.
           Covers phones and small/narrow tablets in portrait. */
        @media (max-width: 820px) {
          .login-wrapper {
            flex-direction: column;
            min-height: 100dvh;
          }

          .login-image-panel {
            display: none;
          }

          .login-form-panel {
            width: 100%;
            min-height: 100dvh;
            padding: 32px 6% 48px;
            justify-content: flex-start;
          }
        }

        /* Phones */
        @media (max-width: 480px) {
          .login-form-panel {
            padding: 24px 20px 40px;
          }

          .login-title {
            margin-top: 8px;
          }

          .login-subtitle {
            margin-bottom: 24px;
          }

          .login-fields {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}