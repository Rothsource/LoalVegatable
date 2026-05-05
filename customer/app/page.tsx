'use client';

import React, { useState } from 'react';
import { ShoppingCart, Heart, ChevronRight, Leaf, Users, ShieldCheck, Trash2, HeartOff, X } from 'lucide-react';

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

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  body { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    margin: 0; 
    padding: 0; 
    scroll-behavior: smooth; 
    background-color: #fafafa;
    color: #1a1a1a;
  }
  .sidebar-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    justify-content: flex-end;
  }
  .sidebar-content {
    background: white;
    width: 400px;
    height: 100%;
    padding: 30px;
    box-shadow: -10px 0 30px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    box-sizing: border-box; 
  }
`;

export default function Home() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isFavOpen, setIsFavOpen] = useState<boolean>(false);

  const brandGreen = '#0DB30D'; 
  const deepGreen = '#0A490A'; 
  const surfaceWhite = '#ffffff';

  const initialProducts: Product[] = [
    { id: 1, name: 'Organic Carrots', category: 'Root Vegetables', price: 7000, unit: '1 kg', benefit: 'Rich in Beta-carotene for sharp eyesight', description: 'Our organic carrots are grown in nutrient-rich soil without synthetic pesticides. They are harvested at peak ripeness to ensure maximum crunch and vitamin content.', popularity: 95, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80' },
    { id: 2, name: 'Morning Glory', category: 'Leafy Greens', price: 2500, unit: '1 kg', benefit: 'Rich in Iron & boosts your energy', description: 'Traditional Tra-kuon sourced from local water farms. It is high in fiber and essential minerals, making it a perfect healthy addition to your daily stir-fry.', popularity: 90, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80' },
    { id: 3, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 3000, unit: '1 kg', benefit: 'High hydration & great for glowing skin', description: 'These cucumbers are 95% water and packed with electrolytes. They are grown using sustainable irrigation to maintain their crisp texture and cooling properties.', popularity: 85, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80' },
    { id: 4, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4000, unit: '500 g', benefit: 'Packed with Vitamin C for strong immunity', description: 'Sun-ripened tomatoes rich in Lycopene. We use deep transfer learning models to verify the health of the plant leaves before harvest to ensure top quality.', popularity: 80, rating: 4.2, isAvailable: false, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80' },
  ];

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]);
  };
  const removeFromCart = (index: number) => { setCartItems(prev => prev.filter((_, i) => i !== index)); };

  const Sidebar = ({ isOpen, onClose, title, items, type }: any) => {
    if (!isOpen) return null;
    return (
      <div className="sidebar-overlay" onClick={onClose}>
        <div className="sidebar-content" onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: deepGreen }}>{title}</h3>
            <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>Your {type} is empty.</p>
            ) : (
              items.map((item: any, idx: number) => (
                <div key={`${item.id}-${idx}`} style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                  <img src={item.img} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{item.name}</h5>
                    <p style={{ margin: 0, color: brandGreen, fontWeight: '700', fontSize: '14px' }}>{item.price.toLocaleString()} KHR</p>
                  </div>
                  {type === 'cart' ? (
                    <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removeFromCart(idx)} />
                  ) : (
                    <HeartOff size={18} color="#ef4444" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => toggleFavorite(item.id)} />
                  )}
                </div>
              ))
            )}
          </div>
          {type === 'cart' && items.length > 0 && (
            <div style={{ paddingTop: '20px', paddingBottom: '10px' }}>
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
    <div style={{ minHeight: '100vh' }}>
      <style>{fontStyles}</style>

      <Sidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Your Basket" items={cartItems} type="cart" />
      <Sidebar isOpen={isFavOpen} onClose={() => setIsFavOpen(false)} title="Your Favorites" items={initialProducts.filter(p => favorites.includes(p.id))} type="favorites" />

      {/* Navigation */}
      <nav style={{ padding: '20px 8%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: surfaceWhite, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="#home" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: deepGreen, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>LOCAL VEGETABLE</h1>
        </a>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '25px' }}>
            {['Home', 'About Us', 'Shop'].map((item) => (
              <a
                key={item}
                href={item === 'Shop' ? '/shop' : `#${item.toLowerCase().replace(' ', '-')}`}
                style={{ textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px' }}
              >
                {item}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsFavOpen(true)}>
              <Heart size={20} color="#333" fill={favorites.length > 0 ? "#ef4444" : "none"} />
            </div>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={20} color="#333" /> 
              <span style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: brandGreen, color: '#fff', fontSize: '10px', height: '18px', width: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{cartItems.length}</span>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 5%' }}>
        
        {/* Hero */}
        <section id="home" style={{ display: 'flex', alignItems: 'center', gap: '40px', backgroundColor: '#eff6ef', padding: '80px 60px', borderRadius: '40px', marginBottom: '80px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: brandGreen, fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Freshly Picked Today</span>
            <h2 style={{ fontSize: '56px', color: deepGreen, fontWeight: '800', lineHeight: '1.1', margin: '15px 0 25px 0' }}>Empowering Local <br /> Cambodian Farmers.</h2>
            <p style={{ color: '#4b5563', fontSize: '18px', marginBottom: '40px', maxWidth: '480px', lineHeight: '1.7' }}>Join our digital marketplace. We guarantee fair prices for farmers and deliver high-quality, safe vegetables directly to your home.</p>
            <a href="/shop" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#FFB800', color: '#000', border: 'none', padding: '18px 36px', borderRadius: '12px', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Shop Fresh Harvest <ChevronRight size={20} />
              </button>
            </a>
          </div>
          <div style={{ flex: 1 }}>
            <img src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1000&q=80" style={{ width: '100%', height: '450px', objectFit: 'cover', borderRadius: '30px' }} alt="" />
          </div>
        </section>

        {/* About Us */}
        <section id="about-us" style={{ marginBottom: '100px', backgroundColor: surfaceWhite, borderRadius: '40px', padding: '60px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
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

      <footer style={{ backgroundColor: deepGreen, color: '#fff', padding: '80px 8% 40px 8%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', paddingBottom: '60px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div><h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>LOCAL VEGETABLE</h3><p style={{ fontSize: '14px', color: '#a3c2a3' }}>Empowering local Cambodian farmers through fair digital trade.</p></div>
          <div><h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Support</h4><div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#a3c2a3' }}><span>Shipping Policy</span><span>FAQs</span><span>Contact Us</span></div></div>
          <div><h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Legal</h4><div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#a3c2a3' }}><span>Terms of Service</span><span>Privacy Policy</span></div></div>
          <div><h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Contact</h4><div style={{ fontSize: '14px', color: '#a3c2a3' }}>Email: roth@localveg.com<br />Phnom Penh, Cambodia</div></div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b8a6b', marginTop: '40px' }}>© 2026 Local Vegetable. All rights reserved.</p>
      </footer>
    </div>
  );
}
