'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, ChevronRight, ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
  quantity: number; // max stock
  qty: number;      // how many in cart
  shopName: string;
  shopSlug: string;
  shopAvatar: string;
}

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';

// ── Read cart from localStorage (handles both old array and new object format) ──
function readCart(): CartProduct[] {
  try {
    const raw = localStorage.getItem('cart-products');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // new format: object keyed by id
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
      return Object.values(parsed as Record<string, CartProduct>).filter(
        (p): p is CartProduct => p !== null && typeof p === 'object' && 'price' in p
      );
    }
    // old format: array — add qty:1 if missing
    if (Array.isArray(parsed)) {
      return parsed
        .filter((p): p is CartProduct => p !== null && typeof p === 'object' && 'price' in p)
        .map(p => ({ ...p, qty: p.qty ?? 1 }));
    }
    return [];
  } catch {
    return [];
  }
}

function writeCart(items: CartProduct[]) {
  // always save as object keyed by id (new format)
  const obj: Record<number, CartProduct> = {};
  items.forEach(p => { obj[p.id] = p; });
  localStorage.setItem('cart-products', JSON.stringify(obj));
}

export default function CartPage() {
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [checkedOut, setCheckedOut] = useState(false);

  useEffect(() => {
    setCartProducts(readCart());
  }, []);

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
  };

  const clearCart = () => {
    setCartProducts([]);
    localStorage.setItem('cart-products', JSON.stringify({}));
  };

  const handleCheckout = () => {
    setCheckedOut(true);
    clearCart();
  };

  const totalQty = cartProducts.reduce((s, p) => s + (p.qty ?? 1), 0);
  const total = cartProducts.reduce((s, p) => s + p.price * (p.qty ?? 1), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .checkout-btn {
          width: 100%; padding: 18px;
          background: #0A490A; color: #fff;
          border: none; border-radius: 14px;
          font-size: 16px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
        }
        .checkout-btn:hover { background: #0DB30D; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(13,179,13,0.3); }
        .remove-btn {
          background: #fff5f5; border: none; border-radius: 10px;
          padding: 10px; cursor: pointer; color: #ef4444;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .remove-btn:hover { background: #fee2e2; }
        .qty-stepper {
          display: inline-flex; align-items: center;
          border: 2px solid #e5e7eb; border-radius: 10px; overflow: hidden; height: 36px;
        }
        .qty-btn {
          width: 34px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: #f9fafb; border: none; cursor: pointer; transition: background 0.15s;
        }
        .qty-btn:hover:not(:disabled) { background: #eff6ef; }
        .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .qty-val {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #111;
          border-left: 1.5px solid #e5e7eb; border-right: 1.5px solid #e5e7eb;
        }
      `}</style>

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

        {checkedOut ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: deepGreen, margin: '0 0 12px' }}>Order Placed!</h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '32px' }}>Thank you for supporting local Cambodian farmers. Your order is being processed.</p>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: deepGreen, color: '#fff', padding: '16px 32px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
              Continue Shopping <ChevronRight size={18} />
            </Link>
          </div>
        ) : cartProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛒</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, margin: '0 0 12px' }}>Your basket is empty</h2>
            <p style={{ color: '#888', fontSize: '15px', marginBottom: '32px' }}>Browse shops and add vegetables to get started.</p>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: deepGreen, color: '#fff', padding: '16px 32px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
              Browse Shops <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }}>

            {/* Product list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cartProducts.map(product => {
                const itemQty = product.qty ?? 1;
                return (
                  <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <img src={product.img} style={{ width: '90px', height: '90px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} alt={product.name} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: brandGreen }}>{product.category}</span>
                      <h4 style={{ margin: '2px 0 4px', fontSize: '16px', fontWeight: '800', color: '#111' }}>{product.name}</h4>

                      <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px' }}>
                        {product.price.toLocaleString()} KHR / {product.unit}
                      </div>

                      {/* Qty stepper + subtotal */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
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

                      {/* Dates */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', backgroundColor: '#f0faf0', color: deepGreen, padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          🌱 Harvested: {product.harvestDate}
                        </span>
                        <span style={{ fontSize: '11px', backgroundColor: '#fff5f5', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          ⏱ Sell by: {product.sellByDate}
                        </span>
                      </div>

                      {/* Shop */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src={product.shopAvatar} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} alt=""
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.shopName)}&background=0DB30D&color=fff&size=18`; }} />
                        <Link href={`/shop/${product.shopSlug}`} style={{ fontSize: '12px', color: '#888', textDecoration: 'none', fontWeight: '600' }}>
                          {product.shopName}
                        </Link>
                      </div>
                    </div>

                    <button className="remove-btn" onClick={() => removeProduct(product.id)}>
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

            {/* Order summary */}
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

              {/* Mini item list */}
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

              <button className="checkout-btn" onClick={handleCheckout}>
                <ShoppingBag size={18} /> Confirm Order
              </button>
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#aaa', marginTop: '14px', lineHeight: '1.5' }}>
                Supporting local Cambodian farmers 🌱
              </p>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
