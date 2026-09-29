'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Star, ShoppingBasket, Plus, Minus, Leaf, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CircularLoader } from '@/components/CustomerSkeleton';
import { supabase } from '@/lib/supabase';
import { isProductExpired, getTodayDateString } from '@/lib/expiry';

const brandGreen = '#1b4332';
const deepGreen = '#1b4332';

function stripEmoji(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}]/gu, '').trim();
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favProducts, setFavProducts] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<Record<string, any>>({});
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load favorites from Supabase
  useEffect(() => {
    async function loadFavorites() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? (await supabase.auth.getUser()).data?.user;
      if (!user) {
        setLoading(false);
        router.replace('/auth/login?redirectTo=/favorites');
        return;
      }

      const { data: favRows } = await supabase
        .from('favourite_vegetables')
        .select('product_id')
        .eq('user_id', user.id);

      if (!favRows || favRows.length === 0) { setLoading(false); return; }

      const productIds = favRows.map(f => f.product_id);

      const today = getTodayDateString();

      const { data: products } = await supabase
        .from('products')
        .select(`
          id, name, price, unit, stock_quantity, profile_pic_url, background_pic_urls,
          is_active, is_organic, description, expire_date,
          categories ( name ),
          merchant_id
        `)
        .in('id', productIds)
        .eq('is_active', true)
        .or(`expire_date.is.null,expire_date.gte.${today}`);

      const validProducts = (products ?? []).filter((p: any) => !isProductExpired(p.expire_date));

      if (validProducts.length === 0) { setLoading(false); return; }

      // Fetch merchant info, reviews, and shop status in parallel
      const merchantIds = [...new Set(validProducts.map((p: any) => p.merchant_id).filter(Boolean))];
      const validProductIds = validProducts.map((p: any) => p.id);
      const [merchantsRes, reviewsRes, shopStatusRes] = await Promise.all([
        merchantIds.length > 0
          ? supabase
              .from('profile_merchants')
              .select('id, full_name, community_name, profile_url, province')
              .in('id', merchantIds)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from('reviews')
          .select('product_id, rating')
          .in('product_id', validProductIds),
        merchantIds.length > 0
          ? fetch(`/api/shop-status?merchantIds=${merchantIds.join(',')}`)
              .then(r => r.json())
              .catch(() => ({ statuses: {} }))
          : Promise.resolve({ statuses: {} }),
      ]);

      const merchants = merchantsRes.data;
      const reviews = reviewsRes.data;
      const shopStatuses: Record<string, boolean> = shopStatusRes?.statuses || {};

      const merchantMap: Record<string, any> = {};
      (merchants ?? []).forEach(m => { merchantMap[m.id] = m; });

      const ratingMap: Record<string, number> = {};
      if (reviews) {
        const grouped: Record<string, number[]> = {};
        reviews.forEach((r: any) => {
          if (!grouped[r.product_id]) grouped[r.product_id] = [];
          grouped[r.product_id].push(r.rating);
        });
        Object.entries(grouped).forEach(([pid, ratings]) => {
          ratingMap[pid] = parseFloat(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          );
        });
      }

      const mapped = validProducts.map((p: any) => {
        const merchant = merchantMap[p.merchant_id] ?? {};
        const realVegImg = p.profile_pic_url || (Array.isArray(p.background_pic_urls) ? p.background_pic_urls[0] : null) || '';
        const isShopOpen = p.merchant_id ? (shopStatuses[p.merchant_id] ?? true) : true;
        return {
          id: p.id,
          name: stripEmoji(p.name),
          category: stripEmoji(p.categories?.name ?? 'Uncategorized'),
          price: Number(p.price),
          unit: p.unit ?? '',
          rating: ratingMap[p.id] ?? 0,
          isAvailable: p.is_active && p.stock_quantity > 0,
          isShopOpen,
          img: realVegImg,
          quantity: p.stock_quantity ?? 0,
          benefit: stripEmoji(p.is_organic ? 'Organically grown' : 'Locally sourced'),
          shopSlug: p.merchant_id,
          shopName: stripEmoji(merchant.community_name ?? merchant.full_name ?? 'Local Farm'),
          shopAvatar: merchant.profile_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(merchant.community_name || merchant.full_name || 'Farm')}&background=1b4332&color=fff&size=50`,
          shopLocation: merchant.province ?? '',
        };
      });

      setFavProducts(mapped);
      setLoading(false);
    }

    // Load cart from localStorage
    try {
      const cart = JSON.parse(localStorage.getItem('cart-products') || '{}');
      setCartItems(Array.isArray(cart) ? {} : cart);
    } catch (e) {}

    loadFavorites();
  }, []);

  const removeProduct = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('favourite_vegetables')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', id);
    setFavProducts(prev => prev.filter(p => p.id !== id));
  };

  const getPendingQty = (id: string) => pendingQty[id] ?? 1;

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
    <div style={{ minHeight: '100vh', backgroundColor: '#FBF8F2', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .qty-stepper { display: inline-flex; align-items: center; border: 1.5px solid #dfe6d9; border-radius: 12px; overflow: hidden; height: 38px; background: #fff; }
        .qty-btn { width: 34px; height: 38px; display: flex; align-items: center; justify-content: center; background: #fafbf9; border: none; cursor: pointer; transition: background 0.15s; }
        .qty-btn:hover:not(:disabled) { background: #eff6ef; }
        .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .qty-val { width: 34px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #182216; border-left: 1.5px solid #dfe6d9; border-right: 1.5px solid #dfe6d9; }
        .fav-card { background: #fff; border-radius: 24px; border: 1.5px solid #dfe6d9; overflow: hidden; box-shadow: 0 14px 40px rgba(43,68,38,0.06); position: relative; transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
        .fav-card:hover { transform: translateY(-4px); box-shadow: 0 22px 50px rgba(46,111,64,0.12); border-color: #c9dfc2; }
      `}</style>

      <main className="enter-up" style={{ maxWidth: '1140px', margin: '0 auto', padding: '44px 5% 80px' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.18em', color: brandGreen, margin: '0 0 6px' }}>Saved Produce</p>
          <h1 className="font-heading" style={{ fontSize: '34px', fontWeight: '900', color: '#182216', margin: '0 0 8px', letterSpacing: '-0.04em' }}>My Saved Favorites</h1>
          <p style={{ color: '#556353', fontSize: '14px', margin: 0 }}>
            {favProducts.length > 0
              ? `${favProducts.length} saved vegetable${favProducts.length > 1 ? 's' : ''} directly from community farms`
              : 'Your saved products in one place.'}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <CircularLoader size={38} label="Loading your favorites..." />
          </div>
        ) : favProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '90px 20px', backgroundColor: '#fff', borderRadius: '28px', border: '1.5px solid #dfe6d9', boxShadow: '0 12px 36px rgba(43,68,38,0.05)' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f43f5e' }}>
              <Heart size={36} fill="#fda4af" color="#f43f5e" />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, margin: '0 0 10px' }}>No favorites yet</h3>
            <p style={{ color: '#647060', fontWeight: '500', fontSize: '14px', marginBottom: '24px' }}>
              Browse local farms and tap the heart on any vegetable to save it here.
            </p>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: deepGreen, color: '#fff', padding: '14px 28px', borderRadius: '14px', fontWeight: '800', fontSize: '14px', textDecoration: 'none', boxShadow: '0 6px 20px rgba(27,67,50,0.25)' }}>
              <span>Browse Produce</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {favProducts.map((product: any) => {
              const inCart = cartItems[product.id];
              const pQty = getPendingQty(product.id);
              return (
                <div key={product.id} className="fav-card">
                  <button onClick={() => removeProduct(product.id)}
                    aria-label="Remove favorite"
                    style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10, backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Heart size={16} fill="#ef4444" color="#ef4444" />
                  </button>

                  {product.isShopOpen === false ? (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, backgroundColor: '#b91c1c', color: '#fff', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: '100px', boxShadow: '0 2px 6px rgba(185,28,28,0.3)' }}>
                      SHOP CLOSED
                    </div>
                  ) : !product.isAvailable ? (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: '100px' }}>Out of Stock</div>
                  ) : inCart ? (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, backgroundColor: deepGreen, color: '#fff', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: '100px' }}>
                      {inCart.qty} in basket
                    </div>
                  ) : null}

                  <Link href={`/shop/${product.shopSlug}`} style={{ textDecoration: 'none', display: 'block', overflow: 'hidden', height: '185px', backgroundColor: '#f4f7f2', position: 'relative' }}>
                    {product.img ? (
                      <img
                        src={product.img}
                        style={{ width: '100%', height: '185px', objectFit: 'cover', opacity: (product.isAvailable && product.isShopOpen !== false) ? 1 : 0.6, transition: 'transform 0.3s ease' }}
                        alt={product.name || 'Local Vegetable'}
                        onError={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.veg-fallback') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="veg-fallback"
                      style={{
                        display: product.img ? 'none' : 'flex',
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#edf5e8',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: '#2e7d32',
                      }}
                    >
                      <Leaf size={38} color="#2e7d32" />
                      <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#388e3c' }}>Fresh Local Vegetable</span>
                    </div>
                  </Link>

                  <div style={{ padding: '18px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: brandGreen }}>{product.category}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 4px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#182216' }}>{product.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fffbeb', padding: '3px 8px', borderRadius: '8px', flexShrink: 0 }}>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>{product.rating || 'N/A'}</span>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#647060', fontWeight: '600' }}>
                      from <Link href={`/shop/${product.shopSlug}`} style={{ color: deepGreen, textDecoration: 'none', fontWeight: '800' }}>{product.shopName}</Link>
                    </p>

                    <div style={{ fontSize: '18px', fontWeight: '900', color: deepGreen, marginBottom: '14px', letterSpacing: '-0.3px' }}>
                      {product.price?.toLocaleString()} KHR
                      <span style={{ fontSize: '12px', color: '#889584', fontWeight: '500' }}> / {product.unit}</span>
                    </div>

                    {product.isShopOpen === false ? (
                      <button disabled style={{ width: '100%', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px', borderRadius: '12px', fontWeight: '700', cursor: 'not-allowed', fontSize: '12px', fontFamily: 'inherit' }}>
                        Shop Closed (Temporarily)
                      </button>
                    ) : product.isAvailable ? (
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
                          style={{ flex: 1, backgroundColor: deepGreen, color: '#fff', border: 'none', height: '38px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(10,73,10,0.18)' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = brandGreen)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = deepGreen)}>
                          <ShoppingBasket size={14} />
                          {inCart ? 'Add More' : 'Add to Basket'}
                        </button>
                      </div>
                    ) : (
                      <button disabled style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'not-allowed', fontSize: '13px', fontFamily: 'inherit' }}>
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
    </div>
  );
}