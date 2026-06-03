'use client';

import React, { useState } from 'react';
import { ShoppingCart, Heart, Leaf, Users, ShieldCheck, Trash2, HeartOff, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  benefit: string;
  description: string;
  popularity: number;
  rating: number;
  isAvailable: boolean;
  img: string;
}

export default function Home() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavOpen, setIsFavOpen] = useState(false);

  const brandGreen = '#0DB30D';
  const deepGreen = '#0A490A';

  const initialProducts: Product[] = [
    { id: 1, name: 'Organic Carrots', category: 'Root Vegetables', price: 7000, unit: '1 kg', benefit: 'Rich in Beta-carotene for sharp eyesight', description: 'Our organic carrots are grown in nutrient-rich soil without synthetic pesticides.', popularity: 95, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80' },
    { id: 2, name: 'Morning Glory', category: 'Leafy Greens', price: 2500, unit: '1 kg', benefit: 'Rich in Iron & boosts your energy', description: 'Traditional Tra-kuon sourced from local water farms.', popularity: 90, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80' },
    { id: 3, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 3000, unit: '1 kg', benefit: 'High hydration & great for glowing skin', description: 'These cucumbers are 95% water and packed with electrolytes.', popularity: 85, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80' },
    { id: 4, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4000, unit: '500 g', benefit: 'Packed with Vitamin C for strong immunity', description: 'Sun-ripened tomatoes rich in Lycopene.', popularity: 80, rating: 4.2, isAvailable: false, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80' },
  ];

  const toggleFavorite = (id: number) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const removeFromCart = (index: number) => setCartItems(prev => prev.filter((_, i) => i !== index));

  const Sidebar = ({ isOpen, onClose, title, items, type }: any) => {
    if (!isOpen) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
        <div style={{ background: 'white', width: '400px', height: '100%', padding: '30px', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: deepGreen }}>{title}</h3>
            <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>Your {type} is empty.</p>
            ) : items.map((item: any, idx: number) => (
              <div key={`${item.id}-${idx}`} style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                <img src={item.img} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{item.name}</h5>
                  <p style={{ margin: 0, color: brandGreen, fontWeight: '700', fontSize: '14px' }}>{item.price.toLocaleString()} KHR</p>
                </div>
                {type === 'cart'
                  ? <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeFromCart(idx)} />
                  : <HeartOff size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => toggleFavorite(item.id)} />
                }
              </div>
            ))}
          </div>
          {type === 'cart' && items.length > 0 && (
            <div style={{ paddingTop: '20px' }}>
              <button style={{ width: '100%', padding: '16px', backgroundColor: brandGreen, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                Checkout ({items.reduce((sum: number, i: any) => sum + i.price, 0).toLocaleString()} KHR)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <Sidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Your Basket" items={cartItems} type="cart" />
      <Sidebar isOpen={isFavOpen} onClose={() => setIsFavOpen(false)} title="Your Favorites" items={initialProducts.filter(p => favorites.includes(p.id))} type="favorites" />

      {/* ✅ Reusable Navbar */}
      <Navbar />

      {/* ✅ Reusable Hero */}
      <Hero />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '80px 5%' }}>

        {/* About Us */}
        <section id="about-us" style={{ marginBottom: '100px', backgroundColor: '#fff', borderRadius: '40px', padding: '60px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: deepGreen }}>The Local Vegetable Mission</h2>
            <p style={{ color: '#666', maxWidth: '600px', margin: '15px auto' }}>We bridge the gap between hard-working farmers and your family, ensuring a sustainable future for Cambodian agriculture.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '100px' }}>
            {[
              { icon: <Leaf color={brandGreen} size={60} />, title: "Quality & Safety", desc: (
    <>
      We utilize automated diagnostics to ensure <br /> only the healthiest produce is selected.
    </>
  )
},
              { icon: <Users color={brandGreen} size={60} />, title: "Fair Trade", desc: (
    <>
      Our marketplace guarantees stable pricing <br /> protecting farmers from market volatility.
    </>
  )},
              { icon: <ShieldCheck color={brandGreen} size={60} />, title: "Traceable Sourcing", desc: (
    <>
      Every vegetable is verified through <br /> our source tracking system.
    </>
  )
}
            ].map((feature, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: '#eff6ef', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>{feature.icon}</div>
                <h5 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 10px' }}>{feature.title}</h5>
                <p style={{ fontSize: '15.8px', color: '#666', lineHeight: '1.6' }}>{feature.desc}</p>
              </div>
            ))}
          </div>  
        </section>

      </main>

      {/* ✅ Reusable Footer */}
      <Footer />
    </div>
  );
}