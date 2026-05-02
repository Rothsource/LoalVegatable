'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Inter, sans-serif', backgroundColor: '#fdfdfb' }}>
      <div style={{ width: '50%', padding: '0 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a', letterSpacing: '-1px' }}>Sign up</h1>
          <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px' }}>Join Local Vegetable today</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Email address</label>
              <input type="email" placeholder="name@example.com" style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '15px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a password"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '15px' }} 
                />
                <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '14px', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                  {showPassword ? <><EyeOff size={18} /> Hide</> : <><Eye size={18} /> Show</>}
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>Use 8+ characters with a mix of letters, numbers & symbols</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#2e7d32' }} /> I agree to the <span style={{ textDecoration: 'underline', color: '#000' }}>Terms of Service</span> and <span style={{ textDecoration: 'underline', color: '#000' }}>Privacy Policy</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#2e7d32' }} /> Subscribe to our newsletter
                </label>
            </div>
            <button onClick={() => router.push('/otp')} style={{ width: '100%', padding: '14px', borderRadius: '10px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', fontWeight: '600', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
              Create account
            </button>
            <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
              <span style={{ padding: '0 15px', color: '#bbb', fontSize: '12px', fontWeight: '600' }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#eee' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                <img src="https://authjs.dev/img/providers/google.svg" width="18" alt="Google" /> Google
              </button>
              <button style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                <img src="https://authjs.dev/img/providers/facebook.svg" width="18" alt="Facebook" /> Facebook
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '20px' }}>
              Already have an account? <Link href="/login" style={{ color: '#2e7d32', fontWeight: '700', textDecoration: 'none' }}>Log In</Link>
            </p>
          </div>
        </div>
      </div>
      <div style={{ width: '50%', backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')", backgroundSize: 'cover', backgroundPosition: 'center', borderLeft: '1px solid #eee' }} />
    </div>
  );
}