'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'user' },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/shop`, // ✅
      }
    });
    if (error) { setError(error.message); setLoading(false); return; }
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

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Inter, sans-serif', backgroundColor: '#fdfdfb' }}>
      <div style={{ width: '50%', padding: '0 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>

          {success ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
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
              <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a', letterSpacing: '-1px' }}>Sign up</h1>
              <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px' }}>Join Local Vegetable today</p>
              {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Email address</label>
                  <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '15px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '15px' }} />
                    <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '14px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                      {showPassword ? <><EyeOff size={18} /> Hide</> : <><Eye size={18} /> Show</>}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Use 8+ characters with a mix of letters, numbers & symbols</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} style={{ accentColor: '#2e7d32' }} /> I agree to the <span style={{ textDecoration: 'underline', color: '#000' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', color: '#000' }}>Privacy Policy</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ accentColor: '#2e7d32' }} /> Subscribe to our newsletter
                  </label>
                </div>
                <button onClick={handleRegister} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '10px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', fontWeight: '600', fontSize: '16px', cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                  <span style={{ padding: '0 15px', color: '#bbb', fontSize: '12px', fontWeight: '600' }}>OR CONTINUE WITH</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
                </div>
                <button onClick={handleGoogleSignUp} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
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
      <div style={{ width: '50%', backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')", backgroundSize: 'cover', backgroundPosition: 'center', borderLeft: '1px solid #eee' }} />
    </div>
  );
}