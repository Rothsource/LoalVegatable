'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Star, ShoppingBasket, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';

export default function FavoritesPage() {
  const [favProducts, setFavProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<Record<number, any>>({});
  const [pendingQty, setPendingQty] = useState<Record<number, number>>({});

  useEffect(() => {
    try {
      const products = JSON.parse(localStorage.getItem('fav-products') || '[]');
      setFavProducts(products);
      const cart = JSON.parse(localStorage.getItem('cart-products') || '{}');
      setCartItems(Array.isArray(cart) ? {} : cart);
    } catch (e) {}
  }, []);

  const removeProduct = (id: number) => {
    const updated = favProducts.filter(p => p.id !== id);
    setFavProducts(updated);
    localStorage.setItem('fav-products', JSON.stringify(updated));
  };

  const getPendingQty = (id: number) => pendingQty[id] ?? 1;

  const addToCart = (product: any, qty: number) => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      const existing = stored[product.id];
      const newQty = Math.min((existing?.qty ?? 0) + qty, product.quantity ?? 99);
      stored[product.id] = { ...product, qty: newQty };
      localStorage.setItem('cart-products', JSON.stringify(stored));
      setCartItems(stored);
      setPendingQty(prev => ({ ...prev, [product.id]: 1 }));
    } catch (e) {}
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .qty-stepper {
          display: inline-flex; align-items: center;
          border: 2px solid #e5e7eb; border-radius: 10px; overflow: hidden; height: 34px;
        }
        .qty-btn {
          width: 32px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          background: #f9fafb; border: none; cursor: pointer; transition: background 0.15s;
        }
        .qty-btn:hover:not(:disabled) { background: #eff6ef; }
        .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .qty-val {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: #111;
          border-left: 1.5px solid #e5e7eb; border-right: 1.5px solid #e5e7eb;
        }
        .fav-card {
          background: #fff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .fav-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
      `}</style>
      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '50px 5%' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ color: brandGreen, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Saved</span>
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: deepGreen, margin: '8px 0 8px' }}>My Favorites</h2>
          <p style={{ color: '#888', fontSize: '15px' }}>
            {favProducts.length > 0 ? `${favProducts.length} saved product${favProducts.length > 1 ? 's' : ''}` : 'Your saved products in one place.'}
          </p>
        </div>

        {/* Products grid */}
        {favProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤍</div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, margin: '0 0 10px' }}>No favorites yet</h3>
            <p style={{ color: '#bbb', fontWeight: '600', fontSize: '15px', marginBottom: '24px' }}>
              Browse shops and tap the heart on any product to save it here.
            </p>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: brandGreen, color: '#fff', padding: '14px 28px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
              Browse Products →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {favProducts.map((product: any) => {
              const inCart = cartItems[product.id];
              const pQty = getPendingQty(product.id);
              return (
                <div key={product.id} className="fav-card">
                  {/* Remove from favorites */}
                  <button onClick={() => removeProduct(product.id)}
                    style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10, backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Heart size={16} fill="#ef4444" color="#ef4444" />
                  </button>

                  {/* Out of stock badge */}
                  {!product.isAvailable && (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>Out of Stock</div>
                  )}
                  {/* In cart badge */}
                  {product.isAvailable && inCart && (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, backgroundColor: deepGreen, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>
                      {inCart.qty} in basket
                    </div>
                  )}

                  <Link href={`/shop/${product.shopSlug ?? product.shopId}`} style={{ textDecoration: 'none' }}>
                    <img src={product.img} style={{ width: '100%', height: '180px', objectFit: 'cover', opacity: product.isAvailable ? 1 : 0.6 }} alt={product.name} />
                  </Link>

                  <div style={{ padding: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: brandGreen }}>{product.category}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 4px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111' }}>{product.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fffbeb', padding: '3px 8px', borderRadius: '8px', flexShrink: 0 }}>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>{product.rating}</span>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                      from <Link href={`/shop/${product.shopSlug ?? product.shopId}`} style={{ color: brandGreen, textDecoration: 'none', fontWeight: '700' }}>{product.shopName}</Link>
                    </p>

                    <div style={{ fontSize: '17px', fontWeight: '800', color: deepGreen, marginBottom: '14px' }}>
                      {product.price?.toLocaleString()} KHR
                      <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '400' }}> / {product.unit}</span>
                    </div>

                    {/* Qty stepper + Add to Basket */}
                    {product.isAvailable ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div className="qty-stepper">
                          <button className="qty-btn" disabled={pQty <= 1}
                            onClick={() => setPendingQty(prev => ({ ...prev, [product.id]: Math.max(1, pQty - 1) }))}>
                            <Minus size={12} color={pQty <= 1 ? '#d1d5db' : '#555'} />
                          </button>
                          <span className="qty-val">{pQty}</span>
                          <button className="qty-btn" disabled={pQty >= (product.quantity ?? 99)}
                            onClick={() => setPendingQty(prev => ({ ...prev, [product.id]: pQty + 1 }))}>
                            <Plus size={12} color={pQty >= (product.quantity ?? 99) ? '#d1d5db' : '#555'} />
                          </button>
                        </div>
                        <button onClick={() => addToCart(product, pQty)}
                          style={{ flex: 1, backgroundColor: brandGreen, color: '#fff', border: 'none', height: '34px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <ShoppingBasket size={13} />
                          {inCart ? 'Add More' : 'Add to Basket'}
                        </button>
                      </div>
                    ) : (
                      <button disabled style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: '700', cursor: 'not-allowed', fontSize: '13px', fontFamily: 'inherit' }}>
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
