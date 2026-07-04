'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, ChevronRight, ShoppingBag, ArrowLeft, Plus, Minus, X, Star, Leaf, Box, Calendar, MapPin, Phone, CreditCard, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { ssr: false });

interface CartProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;   
  benefit: string;
  img: string;
  rating: number;
  harvestDate: string;
  sellByDate: string;
  quantity: number;
  qty: number;
  shopName: string;
  shopSlug: string;
  shopAvatar: string;
  shopLocation?: string;
  description?: string;
}

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';

// Cambodia provinces
const CAMBODIA_PROVINCES = [
  'Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Kampong Chhnang',
  'Kampong Speu', 'Kampong Thom', 'Kampot', 'Kandal', 'Kep', 'Koh Kong',
  'Kratié', 'Mondulkiri', 'Oddar Meanchey', 'Pailin', 'Preah Sihanouk',
  'Preah Vihear', 'Prey Veng', 'Pursat', 'Ratanakiri', 'Stung Treng',
  'Svay Rieng', 'Takéo', 'Tboung Khmum',
];

// ── localStorage helpers — UNCHANGED ─────────────────────────────────────────
function readCart(): CartProduct[] {
  try {
    const raw = localStorage.getItem('cart-products');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
      return Object.values(parsed as Record<string, CartProduct>).filter(
        (p): p is CartProduct => p !== null && typeof p === 'object' && 'price' in p
      );
    }
    if (Array.isArray(parsed)) {
      return parsed
        .filter((p): p is CartProduct => p !== null && typeof p === 'object' && 'price' in p)
        .map(p => ({ ...p, qty: p.qty ?? 1 }));
    }
    return [];
  } catch { return []; }
}

function writeCart(items: CartProduct[]) {
  const obj: Record<number, CartProduct> = {};
  items.forEach(p => { obj[p.id] = p; });
  localStorage.setItem('cart-products', JSON.stringify(obj));
}

// ── ABA QR generator (static demo — replace with real ABA API in production) ─
function ABAQRCode({ amount }: { amount: number }) {
  // In production, generate a real ABA QR via ABA PayWay API.
  // This renders a visual placeholder matching ABA's brand style.
  const abaKHR = Math.round(amount);
  const abaUSD = (amount / 4100).toFixed(2);
  return (
    <div style={{ textAlign: 'center' }}>
      {/* ABA Logo bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#0066b2', borderRadius: '8px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#fff', fontWeight: '800', fontSize: '15px', letterSpacing: '-0.5px' }}>ABA</span>
          <span style={{ color: '#7ec8f7', fontWeight: '600', fontSize: '11px' }}>BANK</span>
        </div>
        <span style={{ color: '#555', fontWeight: '600', fontSize: '13px' }}>Scan to Pay</span>
      </div>

      {/* QR placeholder — replace with <img src={realQrUrl} /> */}
      <div style={{
        width: '180px', height: '180px', margin: '0 auto 14px',
        border: '3px solid #0066b2', borderRadius: '16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#f0f7ff', position: 'relative', overflow: 'hidden',
      }}>
        {/* QR corner marks */}
        {[
          { top: 10, left: 10 }, { top: 10, right: 10 },
          { bottom: 10, left: 10 }, { bottom: 10, right: 10 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', width: 28, height: 28,
            borderColor: '#0066b2', borderStyle: 'solid',
            borderWidth: i === 0 ? '3px 0 0 3px' : i === 1 ? '3px 3px 0 0' : i === 2 ? '0 0 3px 3px' : '0 3px 3px 0',
            borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
            ...pos,
          }} />
        ))}
        {/* QR dots pattern (decorative) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,14px)', gap: '4px', opacity: 0.55 }}>
          {Array.from({ length: 49 }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '2px', background: [0,1,2,6,7,13,14,42,43,44,45,46,48].includes(i) ? '#0066b2' : Math.random() > 0.5 ? '#0066b2' : 'transparent' }} />
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#0066b2', fontWeight: '700' }}>ABA PayWay</div>
      </div>

      {/* Amount */}
      <div style={{ background: '#f0f7ff', borderRadius: '12px', padding: '12px 20px', display: 'inline-block', marginBottom: '10px', border: '1.5px solid #cce0f5' }}>
        <div style={{ fontSize: '11px', color: '#0066b2', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount Due</div>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#0066b2' }}>${abaUSD} USD</div>
        <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', marginTop: '2px' }}>{abaKHR.toLocaleString()} KHR</div>
      </div>

      <p style={{ fontSize: '12px', color: '#aaa', margin: '8px 0 0', lineHeight: '1.5' }}>
        Open ABA Mobile → Scan QR → Confirm payment
      </p>
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Delivery' },
    { n: 2, label: 'Payment' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '32px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '14px',
              background: step >= s.n ? deepGreen : '#e5e7eb',
              color: step >= s.n ? '#fff' : '#9ca3af',
              transition: 'all 0.3s',
            }}>
              {step > s.n ? <CheckCircle2 size={18} color="#fff" /> : s.n}
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: step >= s.n ? deepGreen : '#9ca3af' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: '2px', background: step > 1 ? deepGreen : '#e5e7eb', margin: '0 8px', marginBottom: '20px', transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main CartPage ─────────────────────────────────────────────────────────────
export default function CartPage() {
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  // flow: 'cart' | 'checkout-delivery' | 'checkout-payment' | 'success'
  const [flow, setFlow] = useState<'cart' | 'checkout-delivery' | 'checkout-payment' | 'success'>('cart');
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(null);

  // Delivery form state
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => { setCartProducts(readCart()); }, []);

  // Close modal on Escape — UNCHANGED
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedProduct(null); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // ── Cart mutations — ALL UNCHANGED ─────────────────────────────────────
  const updateQty = (productId: number, newQty: number) => {
    if (newQty <= 0) { removeProduct(productId); return; }
    const updated = cartProducts.map(p =>
      p.id === productId ? { ...p, qty: Math.min(newQty, p.quantity) } : p
    );
    setCartProducts(updated);
    writeCart(updated);
  };

  const removeProduct = (productId: number) => {
    const updated = cartProducts.filter(p => p.id !== productId);
    setCartProducts(updated);
    writeCart(updated);
    if (selectedProduct?.id === productId) setSelectedProduct(null);
  };

  const clearCart = () => {
    setCartProducts([]);
    localStorage.setItem('cart-products', JSON.stringify({}));
  };

  // ── Checkout steps ──────────────────────────────────────────────────────
  const validateDelivery = () => {
    const errors: Record<string, string> = {};
    if (!province) errors.province = 'Please select your province';
    if (!address.trim() || address.trim().length < 5) errors.address = 'Please enter a full delivery address';
    if (!phone.trim() || !/^[0-9+\s\-]{8,15}$/.test(phone.trim())) errors.phone = 'Please enter a valid phone number';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeliveryNext = () => {
    if (validateDelivery()) setFlow('checkout-payment');
  };

  const handleConfirmPayment = () => {
    clearCart();
    setFlow('success');
  };

  const totalQty = cartProducts.reduce((s, p) => s + (p.qty ?? 1), 0);
  const total = cartProducts.reduce((s, p) => s + p.price * (p.qty ?? 1), 0);

  // ── Input style helper ──────────────────────────────────────────────────
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    border: `2px solid ${hasError ? '#ef4444' : '#e5e7eb'}`,
    borderRadius: '12px', padding: '13px 16px',
    fontSize: '14px', fontWeight: '600', color: '#111',
    fontFamily: 'inherit', outline: 'none', background: '#fafafa',
    transition: 'border-color 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .checkout-btn { width: 100%; padding: 18px; background: #0A490A; color: #fff; border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .checkout-btn:hover { background: #0DB30D; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(13,179,13,0.3); }
        .checkout-btn:disabled { background: #d1d5db; cursor: not-allowed; transform: none; box-shadow: none; }
        .remove-btn { background: #fff5f5; border: none; border-radius: 10px; padding: 10px; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .remove-btn:hover { background: #fee2e2; }
        .qty-stepper { display: inline-flex; align-items: center; border: 2px solid #e5e7eb; border-radius: 10px; overflow: hidden; height: 36px; }
        .qty-btn { width: 34px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f9fafb; border: none; cursor: pointer; transition: background 0.15s; }
        .qty-btn:hover:not(:disabled) { background: #eff6ef; }
        .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .qty-val { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #111; border-left: 1.5px solid #e5e7eb; border-right: 1.5px solid #e5e7eb; }
        .cart-card { background: #fff; border-radius: 20px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); display: flex; gap: 16px; align-items: flex-start; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .cart-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .form-input:focus { border-color: #0A490A !important; background: #fff !important; }
        .province-select:focus { border-color: #0A490A !important; outline: none; }
        .pay-confirm-btn { width: 100%; padding: 18px; background: #0066b2; color: #fff; border: none; border-radius: 14px; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; }
        .pay-confirm-btn:hover { background: #0052a3; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,102,178,0.35); }
      `}</style>

      {/* ── Product Detail Modal — UNCHANGED ── */}
      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', maxWidth: '520px', width: '100%', borderRadius: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            <img src={selectedProduct.img} alt={selectedProduct.name}
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '32px 32px 0 0' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <button onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#fff" />
            </button>
            <div style={{ padding: '28px' }}>
              <span style={{ color: brandGreen, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedProduct.category}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '6px 0 4px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, margin: 0 }}>{selectedProduct.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbeb', padding: '5px 10px', borderRadius: '10px', flexShrink: 0, marginLeft: '12px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>{selectedProduct.rating || 'N/A'}</span>
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, marginBottom: '4px' }}>
                {selectedProduct.price.toLocaleString()} KHR
                <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}> / {selectedProduct.unit}</span>
              </div>
              {selectedProduct.qty > 1 && (
                <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
                  {selectedProduct.qty} × {selectedProduct.price.toLocaleString()} = <span style={{ color: deepGreen, fontWeight: '800' }}>{(selectedProduct.price * selectedProduct.qty).toLocaleString()} KHR</span>
                </p>
              )}
              {selectedProduct.description && (
                <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px', marginBottom: '18px', marginTop: '10px' }}>{selectedProduct.description}</p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                  { icon: <Box size={15} color={brandGreen} />, label: 'In Cart', value: `${selectedProduct.qty} units`, red: false },
                  { icon: <Calendar size={15} color={brandGreen} />, label: 'Harvested', value: selectedProduct.harvestDate || '-', red: false },
                  { icon: <Calendar size={15} color="#ef4444" />, label: 'Sell By', value: selectedProduct.sellByDate || '-', red: true },
                ].map((info, i) => (
                  <div key={i} style={{ backgroundColor: info.red ? '#fff5f5' : '#f9fafb', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{info.icon}</div>
                    <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '600', marginBottom: '4px' }}>{info.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: info.red ? '#ef4444' : '#333' }}>{info.value}</div>
                  </div>
                ))}
              </div>
              {selectedProduct.benefit && (
                <div style={{ backgroundColor: '#eff6ef', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <Leaf color={brandGreen} size={18} />
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: deepGreen }}>Health Highlights</span>
                    <span style={{ fontSize: '13px', color: '#444' }}>{selectedProduct.benefit}</span>
                  </div>
                </div>
              )}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>Sold By</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={selectedProduct.shopAvatar} alt=""
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #eff6ef' }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.shopName)}&background=0DB30D&color=fff&size=48`; }} />
                  <div>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: deepGreen }}>{selectedProduct.shopName}</span>
                    {selectedProduct.shopLocation && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '13px', marginTop: '3px' }}>
                        <MapPin size={12} /><span>{selectedProduct.shopLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <div className="qty-stepper" style={{ height: '46px' }}>
                  <button className="qty-btn" style={{ width: '42px', height: '46px' }} disabled={selectedProduct.qty <= 1}
                    onClick={() => { updateQty(selectedProduct.id, selectedProduct.qty - 1); setSelectedProduct(prev => prev ? { ...prev, qty: Math.max(1, prev.qty - 1) } : null); }}>
                    <Minus size={15} color={selectedProduct.qty <= 1 ? '#d1d5db' : '#555'} />
                  </button>
                  <span className="qty-val" style={{ width: '42px', height: '46px', fontSize: '15px' }}>{selectedProduct.qty}</span>
                  <button className="qty-btn" style={{ width: '42px', height: '46px' }} disabled={selectedProduct.qty >= selectedProduct.quantity}
                    onClick={() => { updateQty(selectedProduct.id, selectedProduct.qty + 1); setSelectedProduct(prev => prev ? { ...prev, qty: Math.min(prev.quantity, prev.qty + 1) } : null); }}>
                    <Plus size={15} color={selectedProduct.qty >= selectedProduct.quantity ? '#d1d5db' : '#555'} />
                  </button>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '800', color: deepGreen }}>
                  {(selectedProduct.price * selectedProduct.qty).toLocaleString()} KHR
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => removeProduct(selectedProduct.id)}
                  style={{ flex: 1, padding: '13px', borderRadius: '12px', border: '2px solid #fee2e2', background: '#fff5f5', color: '#ef4444', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Remove from Cart
                </button>
                <Link href={`/shop/${selectedProduct.shopSlug}`} onClick={() => setSelectedProduct(null)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '13px', borderRadius: '12px', border: '2px solid #e5e7eb', color: deepGreen, fontWeight: '700', fontSize: '14px', textDecoration: 'none', backgroundColor: '#fff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = brandGreen; (e.currentTarget as HTMLAnchorElement).style.background = '#f0fdf0'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; }}>
                  View Shop
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navbar />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '50px 5%' }}>
        <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px', marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Back to Shops
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#eff6ef', padding: '14px', borderRadius: '16px' }}>
            <ShoppingCart size={28} color={deepGreen} />
          </div>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: deepGreen, margin: 0 }}>Your Basket</h1>
            <p style={{ color: '#888', margin: '4px 0 0', fontSize: '14px' }}>
              {totalQty} {totalQty === 1 ? 'item' : 'items'} · {cartProducts.length} {cartProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            FLOW: SUCCESS
        ════════════════════════════════════════════════════ */}
        {flow === 'success' && (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: deepGreen, margin: '0 0 12px' }}>Order Placed!</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '8px' }}>Thank you for supporting local Cambodian farmers.</p>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '32px' }}>
              Delivering to <strong style={{ color: deepGreen }}>{province}</strong> · {phone}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ef', padding: '10px 20px', borderRadius: '10px', marginBottom: '32px' }}>
              <CheckCircle2 size={16} color={brandGreen} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: deepGreen }}>Payment confirmed via ABA Bank</span>
            </div>
            <br />
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: deepGreen, color: '#fff', padding: '16px 32px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
              Continue Shopping <ChevronRight size={18} />
            </Link>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            FLOW: EMPTY CART
        ════════════════════════════════════════════════════ */}
        {flow === 'cart' && cartProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛒</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, margin: '0 0 12px' }}>Your basket is empty</h2>
            <p style={{ color: '#888', fontSize: '15px', marginBottom: '32px' }}>Browse shops and add vegetables to get started.</p>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: deepGreen, color: '#fff', padding: '16px 32px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
              Browse Shops <ChevronRight size={18} />
            </Link>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            FLOW: CART VIEW
        ════════════════════════════════════════════════════ */}
        {flow === 'cart' && cartProducts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }}>

            {/* Product list — UNCHANGED */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartProducts.map(product => {
                const itemQty = product.qty ?? 1;
                return (
                  <div key={product.id} className="cart-card" onClick={() => setSelectedProduct(product)}>
                    <img src={product.img} style={{ width: '90px', height: '90px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} alt={product.name}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: brandGreen }}>{product.category}</span>
                      <h4 style={{ margin: '2px 0 4px', fontSize: '16px', fontWeight: '800', color: '#111' }}>{product.name}</h4>
                      <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>
                        {product.price.toLocaleString()} KHR / {product.unit}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }} onClick={e => e.stopPropagation()}>
                        <div className="qty-stepper">
                          <button className="qty-btn" disabled={itemQty <= 1} onClick={() => updateQty(product.id, itemQty - 1)}>
                            <Minus size={13} color={itemQty <= 1 ? '#d1d5db' : '#555'} />
                          </button>
                          <span className="qty-val">{itemQty}</span>
                          <button className="qty-btn" disabled={itemQty >= product.quantity} onClick={() => updateQty(product.id, itemQty + 1)}>
                            <Plus size={13} color={itemQty >= product.quantity ? '#d1d5db' : '#555'} />
                          </button>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: deepGreen }}>
                          {(product.price * itemQty).toLocaleString()} KHR
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', backgroundColor: '#f0faf0', color: deepGreen, padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          🌱 Harvested: {product.harvestDate}
                        </span>
                        <span style={{ fontSize: '11px', backgroundColor: '#fff5f5', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          ⏱ Sell by: {product.sellByDate}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <img src={product.shopAvatar} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} alt=""
                          onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.shopName)}&background=0DB30D&color=fff&size=18`; }} />
                        <Link href={`/shop/${product.shopSlug}`} style={{ fontSize: '12px', color: '#888', textDecoration: 'none', fontWeight: '600' }}>
                          {product.shopName}
                        </Link>
                      </div>
                    </div>
                    <button className="remove-btn" onClick={e => { e.stopPropagation(); removeProduct(product.id); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <button onClick={clearCart}
                style={{ background: 'none', border: '1.5px dashed #e0e0e0', borderRadius: '14px', padding: '14px', color: '#aaa', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0e0e0'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}>
                Clear entire basket
              </button>
            </div>

            {/* Order summary — UNCHANGED except button text */}
            <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: deepGreen, margin: '0 0 24px' }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555' }}>
                  <span>Products</span>
                  <span style={{ fontWeight: '700', color: '#111' }}>{cartProducts.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555' }}>
                  <span>Total items</span>
                  <span style={{ fontWeight: '700', color: '#111' }}>{totalQty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#555' }}>
                  <span>Delivery fee</span>
                  <span style={{ fontWeight: '700', color: brandGreen }}>Free 🎉</span>
                </div>
                <div style={{ height: '1px', backgroundColor: '#f0f0f0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px' }}>
                  <span style={{ fontWeight: '700', color: '#111' }}>Total</span>
                  <span style={{ fontWeight: '800', color: deepGreen }}>{total.toLocaleString()} KHR</span>
                </div>
              </div>
              <div style={{ backgroundColor: '#f9fdf9', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                {cartProducts.map(p => {
                  const q = p.qty ?? 1;
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name} {q > 1 && <span style={{ color: brandGreen }}>×{q}</span>}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: deepGreen, marginLeft: '8px', flexShrink: 0 }}>
                        {(p.price * q).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Now starts checkout flow instead of confirming directly */}
              <button className="checkout-btn" onClick={() => setFlow('checkout-delivery')}>
                <ShoppingBag size={18} /> Proceed to Checkout
              </button>
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#aaa', marginTop: '14px', lineHeight: '1.5' }}>
                Supporting local Cambodian farmers 🌱
              </p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            FLOW: CHECKOUT — STEP 1: DELIVERY
        ════════════════════════════════════════════════════ */}
        {flow === 'checkout-delivery' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '36px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <StepIndicator step={1} />

              <h2 style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, margin: '0 0 6px' }}>Delivery Details</h2>
              <p style={{ color: '#888', fontSize: '14px', margin: '0 0 28px' }}>Where should we deliver your vegetables?</p>

              {/* Province */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  <MapPin size={14} color={deepGreen} /> Province / City
                </label>
                <select
                  className="province-select"
                  value={province}
                  onChange={e => { setProvince(e.target.value); setFormErrors(prev => ({ ...prev, province: '' })); }}
                  style={{ ...inputStyle(!!formErrors.province), appearance: 'none', cursor: 'pointer', color: province ? '#111' : '#9ca3af' }}
                >
                  <option value="" disabled>Select your province…</option>
                  {CAMBODIA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {formErrors.province && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', margin: '6px 0 0' }}>{formErrors.province}</p>}
              </div>

              {/* Address */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  <MapPin size={14} color={deepGreen} /> Street Address
                </label>
                <DeliveryMap
                  onAddressSelect={(addr) => {
                  setAddress(addr);
                  setFormErrors(prev => ({ ...prev, address: '' }));
                    }}
                  />
                <textarea
                  className="form-input"
                  placeholder="House number, street, village, commune…"
                  value={address}
                  rows={3}
                  onChange={e => { setAddress(e.target.value); setFormErrors(prev => ({ ...prev, address: '' })); }}
                  style={{ ...inputStyle(!!formErrors.address), resize: 'vertical', lineHeight: '1.5' }}
                />
                {formErrors.address && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', margin: '6px 0 0' }}>{formErrors.address}</p>}
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                  <Phone size={14} color={deepGreen} /> Phone Number
                </label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="e.g. 012 345 678"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setFormErrors(prev => ({ ...prev, phone: '' })); }}
                  style={inputStyle(!!formErrors.phone)}
                />
                {formErrors.phone && <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', margin: '6px 0 0' }}>{formErrors.phone}</p>}
              </div>

              {/* Nav buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setFlow('cart')}
                  style={{ flex: 1, padding: '15px', border: '2px solid #e5e7eb', borderRadius: '14px', background: '#fff', fontWeight: '700', fontSize: '15px', color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  className="checkout-btn"
                  style={{ flex: 2 }}
                  onClick={handleDeliveryNext}>
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Mini order summary sidebar */}
            <MiniOrderSummary cartProducts={cartProducts} total={total} />
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            FLOW: CHECKOUT — STEP 2: PAYMENT (ABA)
        ════════════════════════════════════════════════════ */}
        {flow === 'checkout-payment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '36px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <StepIndicator step={2} />

              <h2 style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, margin: '0 0 6px' }}>Pay with ABA Bank</h2>
              <p style={{ color: '#888', fontSize: '14px', margin: '0 0 28px' }}>Scan the QR code with your ABA Mobile app to complete payment.</p>

              {/* Delivery summary pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0fdf0', border: '1.5px solid #d1fae5', borderRadius: '12px', padding: '12px 16px', marginBottom: '28px' }}>
                <MapPin size={15} color={brandGreen} />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: deepGreen }}>{province}</span>
                  <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>{address.length > 40 ? address.slice(0, 40) + '…' : address}</span>
                </div>
              </div>

              {/* ABA QR */}
              <div style={{ border: '2px solid #cce0f5', borderRadius: '20px', padding: '28px', marginBottom: '28px', backgroundColor: '#f8fbff' }}>
                <ABAQRCode amount={total} />
              </div>

              {/* How to pay steps */}
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '14px', padding: '18px', marginBottom: '28px' }}>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>How to pay</p>
                {[
                  'Open ABA Mobile on your phone',
                  'Tap "Scan" and point at the QR code above',
                  'Check the amount and tap "Pay"',
                  'Come back here and tap "I\'ve Paid" below',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < 3 ? '10px' : 0 }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: deepGreen, color: '#fff', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                    <span style={{ fontSize: '13px', color: '#555', fontWeight: '600', lineHeight: '1.5' }}>{step}</span>
                  </div>
                ))}
              </div>

              {/* Nav buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setFlow('checkout-delivery')}
                  style={{ flex: 1, padding: '15px', border: '2px solid #e5e7eb', borderRadius: '14px', background: '#fff', fontWeight: '700', fontSize: '15px', color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button className="pay-confirm-btn" style={{ flex: 2 }} onClick={handleConfirmPayment}>
                  <CheckCircle2 size={18} /> I've Paid
                </button>
              </div>
            </div>

            {/* Mini order summary sidebar */}
            <MiniOrderSummary cartProducts={cartProducts} total={total} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ── Mini order summary (reused in both checkout steps) ───────────────────────
function MiniOrderSummary({ cartProducts, total }: { cartProducts: CartProduct[]; total: number }) {
  const deepGreen = '#0A490A';
  const brandGreen = '#0DB30D';
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', position: 'sticky', top: '90px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '800', color: deepGreen, margin: '0 0 16px' }}>Order Summary</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {cartProducts.map(p => {
          const q = p.qty ?? 1;
          return (
            <div key={p.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <img src={p.img} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} alt=""
                onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=eff6ef&color=0A490A`; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>×{q} · {p.price.toLocaleString()} KHR</p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: deepGreen, flexShrink: 0 }}>{(p.price * q).toLocaleString()}</span>
            </div>
          );
        })}
      </div>
      <div style={{ height: '1px', backgroundColor: '#f0f0f0', marginBottom: '14px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#555' }}>Total</span>
        <span style={{ fontSize: '16px', fontWeight: '800', color: deepGreen }}>{total.toLocaleString()} KHR</span>
      </div>
      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf0', padding: '10px 12px', borderRadius: '10px' }}>
        <span style={{ fontSize: '12px' }}>🎉</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: deepGreen }}>Free delivery</span>
      </div>
    </div>
  );
}
