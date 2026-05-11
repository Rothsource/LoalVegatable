'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import { Leaf, Users, ShieldCheck } from 'lucide-react';

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <Navbar />
      <Hero />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 5%' }}>
        <section id="about-us" style={{ marginBottom: '100px', backgroundColor: '#fff', borderRadius: '40px', padding: '60px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: deepGreen }}>The Local Vegetable Mission</h2>
            <p style={{ color: '#666', maxWidth: '600px', margin: '15px auto' }}>We bridge the gap between hard-working farmers and your family, ensuring a sustainable future for Cambodian agriculture.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            {[
              { icon: <Leaf color={brandGreen} size={30} />, title: "Quality & Safety", desc: "We utilize automated diagnostics to ensure only the healthiest produce is selected." },
              { icon: <Users color={brandGreen} size={30} />, title: "Fair Trade", desc: "Our marketplace guarantees stable pricing, protecting farmers from market volatility." },
              { icon: <ShieldCheck color={brandGreen} size={30} />, title: "Traceable Sourcing", desc: "Every vegetable is verified through our source tracking system for your peace of mind." }
            ].map((feature, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: '#eff6ef', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>{feature.icon}</div>
                <h5 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 10px' }}>{feature.title}</h5>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
