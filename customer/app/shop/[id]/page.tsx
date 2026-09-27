'use client';

import React, { useState, useMemo, use, useCallback, useEffect } from 'react';
import { Heart, Star, Leaf, X, Trash2, HeartOff, SlidersHorizontal, ChevronLeft, MapPin, ShieldCheck, Package, Calendar, Box, RotateCcw, Plus, Minus, ShoppingBasket } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { CircularLoader } from '@/components/CustomerSkeleton';
import { supabase } from '@/lib/supabase';
import { isProductExpired, getTodayDateString } from '@/lib/expiry';

interface Product {
  id: string;
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
  quantity: number;
  harvestDate: string;
  sellByDate: string;
}

interface CartItem extends Product {
  qty: number;
}

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';
const surfaceWhite = '#ffffff';
const categories = ['All', 'Root Vegetables', 'Leafy Greens', 'Fruit Vegetables'];
const harvestOptions = ['All Time', 'Today', 'This Week', 'This Month'] as const;
type HarvestFilter = typeof harvestOptions[number];

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 0; background-color: #fafafa; color: #1a1a1a; }
  .filter-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(6px); z-index: 1000; display: flex; justify-content: flex-end; }
  .filter-panel { background: #fff; width: 420px; max-width: 95vw; height: 100%; display: flex; flex-direction: column; box-shadow: -20px 0 60px rgba(0,0,0,0.15); animation: slideIn 0.28s cubic-bezier(0.16,1,0.3,1); }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideInCart { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes floatPulse { 0%, 100% { box-shadow: 0 8px 32px rgba(13,179,13,0.45); } 50% { box-shadow: 0 8px 40px rgba(13,179,13,0.65); } }
  @keyframes badgePop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.25); } 100% { transform: scale(1); opacity: 1; } }
  .filter-scroll { flex: 1; overflow-y: auto; padding: 0 28px 28px; }
  .filter-scroll::-webkit-scrollbar { width: 4px; }
  .filter-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
  .filter-section { padding: 24px 0; border-bottom: 1px solid #f3f4f6; }
  .filter-section:last-child { border-bottom: none; }
  .filter-section-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 14px 0; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 100px; font-size: 13px; font-weight: 700; border: 2px solid #e5e7eb; background: #fff; color: #555; cursor: pointer; transition: all 0.18s; user-select: none; font-family: inherit; }
  .chip:hover { border-color: #0DB30D; color: #0A490A; }
  .chip.active { border-color: #0DB30D; background: #0DB30D; color: #fff; }
  .price-row { display: flex; gap: 10px; align-items: center; }
  .price-field { position: relative; flex: 1; }
  .price-field input { width: 100%; box-sizing: border-box; border: 2px solid #e5e7eb; border-radius: 12px; padding: 12px 12px 12px 46px; font-size: 14px; font-weight: 700; color: #111; font-family: inherit; outline: none; transition: border-color 0.2s; background: #fafafa; }
  .price-field input:focus { border-color: #0DB30D; background: #fff; }
  .price-field .currency { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: #9ca3af; pointer-events: none; }
  .price-dash { font-size: 16px; font-weight: 700; color: #ccc; flex-shrink: 0; }
  .toggle-track { width: 44px; height: 24px; border-radius: 100px; cursor: pointer; transition: background 0.2s; position: relative; flex-shrink: 0; }
  .toggle-thumb { position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 3px; transition: left 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
  .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: flex-end; }
  .sidebar-content { background: white; width: 420px; height: 100%; padding: 30px; box-shadow: -10px 0 30px rgba(0,0,0,0.1); display: flex; flex-direction: column; box-sizing: border-box; animation: slideInCart 0.28s cubic-bezier(0.16,1,0.3,1); }
  .info-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .info-modal-content { background: white; max-width: 560px; width: 100%; border-radius: 32px; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; }
  .product-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -4px rgba(0,0,0,0.12) !important; }
  .qty-stepper { display: inline-flex; align-items: center; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  .qty-btn { display: flex; align-items: center; justify-content: center; background: #f9fafb; border: none; cursor: pointer; transition: background 0.15s; flex-shrink: 0; }
  .qty-btn:hover:not(:disabled) { background: #eff6ef; }
  .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .qty-val { font-weight: 800; color: #111; text-align: center; border-left: 1.5px solid #e5e7eb; border-right: 1.5px solid #e5e7eb; display: flex; align-items: center; justify-content: center; }
  .float-cart-btn { position: fixed; bottom: 32px; right: 32px; z-index: 900; width: 62px; height: 62px; background: linear-gradient(135deg, #0DB30D, #0A490A); border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(13,179,13,0.45); transition: transform 0.2s ease, box-shadow 0.2s ease; animation: floatPulse 3s ease-in-out infinite; font-family: inherit; }
  .float-cart-btn:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 12px 40px rgba(13,179,13,0.6); animation: none; }
  .float-cart-btn:active { transform: scale(0.96); }
  .float-cart-badge { position: absolute; top: -4px; right: -4px; background: #ef4444; color: #fff; font-size: 11px; font-weight: 800; min-width: 22px; height: 22px; border-radius: 11px; display: flex; align-items: center; justify-content: center; padding: 0 5px; border: 2px solid #fff; animation: badgePop 0.3s cubic-bezier(0.16,1,0.3,1); font-family: inherit; }
`;

function parseDate(str: string): Date { return new Date(str); }
function isToday(d: Date): boolean {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function isThisWeek(d: Date): boolean {
  const n = new Date();
  const s = new Date(n); s.setDate(n.getDate() - n.getDay());
  const e = new Date(s); e.setDate(s.getDate() + 6);
  return d >= s && d <= e;
}
function isThisMonth(d: Date): boolean {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

function QtyStepper({ value, onChange, max, size = 'md' }: {
  value: number; onChange: (v: number) => void; max: number; size?: 'sm' | 'md';
}) {
  const btnSize = size === 'sm' ? 32 : 40;
  const valWidth = size === 'sm' ? 34 : 42;
  const iconSize = size === 'sm' ? 13 : 15;
  const fontSize = size === 'sm' ? '13px' : '15px';
  return (
    <div className="qty-stepper" style={{ height: btnSize }}>
      <button className="qty-btn" style={{ width: btnSize, height: btnSize }} disabled={value <= 1}
        onClick={e => { e.stopPropagation(); onChange(Math.max(1, value - 1)); }}>
        <Minus size={iconSize} color={value <= 1 ? '#d1d5db' : '#555'} />
      </button>
      <span className="qty-val" style={{ width: valWidth, fontSize, height: btnSize }}>{value}</span>
      <button className="qty-btn" style={{ width: btnSize, height: btnSize }} disabled={value >= max}
        onClick={e => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}>
        <Plus size={iconSize} color={value >= max ? '#d1d5db' : '#555'} />
      </button>
    </div>
  );
}

const MinPriceInput = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="price-field">
    <span className="currency">KHR</span>
    <input type="number" placeholder="Min" value={value} min={0} onChange={e => onChange(e.target.value)} />
  </div>
));
MinPriceInput.displayName = 'MinPriceInput';

const MaxPriceInput = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="price-field">
    <span className="currency">KHR</span>
    <input type="number" placeholder="Max" value={value} min={0} onChange={e => onChange(e.target.value)} />
  </div>
));
MaxPriceInput.displayName = 'MaxPriceInput';

export default function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { requireAuth } = useAuth();

  // Data state
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [harvestFilter, setHarvestFilter] = useState<HarvestFilter>('All Time');
  const [draftCategory, setDraftCategory] = useState('All');
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftHarvest, setDraftHarvest] = useState<HarvestFilter>('All Time');
  const [filterOpen, setFilterOpen] = useState(false);
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [pendingQty, setPendingQty] = useState<Record<string, number>>({});
  const [modalQty, setModalQty] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavOpen, setIsFavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(true);

  const handleDraftMinChange = useCallback((v: string) => setDraftMinPrice(v), []);
  const handleDraftMaxChange = useCallback((v: string) => setDraftMaxPrice(v), []);

  // Fetch shop + products
  useEffect(() => {
    async function fetchShopData() {
      const [merchantRes, statusRes] = await Promise.all([
        supabase.from('profile_merchants').select('*').eq('id', id).single(),
        fetch(`/api/shop-status?merchantId=${id}`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      const merchant = merchantRes.data;
      if (statusRes?.is_open !== undefined) {
        setIsShopOpen(Boolean(statusRes.is_open));
      } else if (merchant?.is_open !== undefined) {
        setIsShopOpen(Boolean(merchant.is_open));
      }

      const today = getTodayDateString();

      const { data: prods } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('merchant_id', id)
        .eq('is_active', true)
        .or(`expire_date.is.null,expire_date.gte.${today}`);

      const validProds = (prods ?? []).filter((p: any) => !isProductExpired(p.expire_date));
      const productIds = validProds.map((p: any) => p.id);
      let ratingMap: Record<string, number> = {};

      if (productIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('product_id, rating')
          .in('product_id', productIds);

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
      }

      setShop(merchant);
      setProducts(
        validProds.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.categories?.name ?? 'Uncategorized',
          price: Number(p.price),
          unit: p.unit ?? '',
          benefit: p.is_organic ? 'Organically grown' : 'Locally sourced',
          description: p.description ?? '',
          popularity: p.stock_quantity ?? 0,
          rating: ratingMap[p.id] ?? 0,
          isAvailable: p.is_active && p.stock_quantity > 0,
          img: p.profile_pic_url ?? 'https://placehold.co/400x300?text=No+Image',
          quantity: p.stock_quantity ?? 0,
          harvestDate: p.harvest_date ?? '',
          sellByDate: p.expire_date ?? '',
        }))
      );
      setLoading(false);
    }
    fetchShopData();
  }, [id]);

  // Load favorites — UNCHANGED
  useEffect(() => {
    async function loadFavorites() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('favourite_vegetables')
        .select('product_id')
        .eq('user_id', user.id);
      if (data) setFavorites(data.map((f: any) => f.product_id));
    }
    loadFavorites();
  }, []);

  // Load cart from localStorage — UNCHANGED
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart-products') || '{}');
      if (!Array.isArray(cart)) {
        const simplified: Record<string, CartItem> = {};
        Object.entries(cart).forEach(([k, v]: any) => { simplified[k] = v; });
        setCartItems(simplified);
      }
    } catch (e) {}
  }, []);

  // Derived values
  const cartList = Object.values(cartItems);
  const cartTotalQty = cartList.reduce((s, i) => s + i.qty, 0);
  const cartTotalPrice = cartList.reduce((s, i) => s + i.price * i.qty, 0);

  const activeFilterCount = [
    selectedCategory !== 'All', showOnlyAvailable,
    minPrice !== '', maxPrice !== '', harvestFilter !== 'All Time',
  ].filter(Boolean).length;

  const openFilter = () => {
    setDraftCategory(selectedCategory); setDraftAvailable(showOnlyAvailable);
    setDraftMinPrice(minPrice); setDraftMaxPrice(maxPrice); setDraftHarvest(harvestFilter);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setSelectedCategory(draftCategory); setShowOnlyAvailable(draftAvailable);
    setMinPrice(draftMinPrice); setMaxPrice(draftMaxPrice); setHarvestFilter(draftHarvest);
    setFilterOpen(false);
  };

  const resetDraft = () => {
    setDraftCategory('All'); setDraftAvailable(false);
    setDraftMinPrice(''); setDraftMaxPrice(''); setDraftHarvest('All Time');
  };

  // toggleFavorite — UNCHANGED
  const toggleFavorite = async (fid: string) => {
    if (!requireAuth()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isAlready = favorites.includes(fid);
    if (isAlready) {
      await supabase.from('favourite_vegetables').delete().eq('user_id', user.id).eq('product_id', fid);
      setFavorites(prev => prev.filter(f => f !== fid));
    } else {
      await supabase.from('favourite_vegetables').insert({ user_id: user.id, product_id: fid });
      setFavorites(prev => [...prev, fid]);
    }
  };

  // addToCart — UNCHANGED
  const addToCart = (product: Product, qty: number) => {
    if (!requireAuth()) return;
    if (product.quantity <= 0) return;
    const addAmount = Math.max(1, qty);
    const existing = cartItems[product.id];
    const newQty = Math.max(1, Math.min((existing?.qty ?? 0) + addAmount, product.quantity));
    setCartItems(prev => ({ ...prev, [product.id]: { ...product, qty: newQty } }));
    setPendingQty(prev => ({ ...prev, [product.id]: 1 }));
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      const sName = shop?.community_name ?? shop?.full_name ?? 'Local Farm';
      const sAvatar = shop?.profile_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sName)}&background=0DB30D&color=fff&size=50`;
      stored[product.id] = { ...product, qty: newQty, shopName: sName, shopSlug: shop?.id ?? '', shopAvatar: sAvatar };
      localStorage.setItem('cart-products', JSON.stringify(stored));
    } catch (e) {}
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) { removeFromCart(productId); return; }
    const item = cartItems[productId];
    const maxQty = item?.quantity ?? products.find(p => p.id === productId)?.quantity ?? 999;
    const clamped = Math.max(1, Math.min(newQty, maxQty));
    setCartItems(prev => ({ ...prev, [productId]: { ...prev[productId], qty: clamped } }));
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      if (stored[productId]) { stored[productId].qty = clamped; localStorage.setItem('cart-products', JSON.stringify(stored)); }
    } catch (e) {}
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => { const n = { ...prev }; delete n[productId]; return n; });
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      delete stored[productId];
      localStorage.setItem('cart-products', JSON.stringify(stored));
    } catch (e) {}
  };

  const processedProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory);
    if (showOnlyAvailable) list = list.filter(p => p.isAvailable);
    if (minPrice !== '') list = list.filter(p => p.price >= Number(minPrice));
    if (maxPrice !== '') list = list.filter(p => p.price <= Number(maxPrice));
    if (harvestFilter !== 'All Time') {
      list = list.filter(p => {
        const d = parseDate(p.harvestDate);
        if (harvestFilter === 'Today') return isToday(d);
        if (harvestFilter === 'This Week') return isThisWeek(d);
        if (harvestFilter === 'This Month') return isThisMonth(d);
        return true;
      });
    }
    return list.sort((a, b) => b.popularity - a.popularity);
  }, [products, selectedCategory, showOnlyAvailable, minPrice, maxPrice, harvestFilter]);

  const favProducts = products.filter(p => favorites.includes(p.id));
  const getPendingQty = (pid: string) => pendingQty[pid] ?? 1;

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularLoader size={48} />
    </div>
  );

  if (!shop) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#ef4444', fontWeight: '700', fontSize: '16px' }}>
      Shop not found.
    </div>
  );

  const shopName = shop.community_name ?? shop.full_name ?? 'Unknown Shop';
  const shopOwner = shop.full_name ?? '';
  const shopLocation = shop.province ?? '';
  const shopAvatar = shop.profile_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName)}&background=0DB30D&color=fff&size=80`;
  const shopCover = shop.background_urls?.[0] || 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80';
  const shopVerified = shop.is_verified ?? false;

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{fontStyles}</style>

      {/* ── Product Detail Modal — UNCHANGED ── */}
      {selectedProduct && (
        <div className="info-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="info-modal-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <img src={selectedProduct.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop'} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '32px 32px 0 0' }} alt="" />
            <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#fff" />
            </button>
            <div style={{ padding: '28px' }}>
              <span style={{ color: brandGreen, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>{selectedProduct.category}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '6px 0 4px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, margin: 0 }}>{selectedProduct.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbeb', padding: '5px 10px', borderRadius: '10px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>{selectedProduct.rating || 'N/A'}</span>
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, marginBottom: '4px' }}>
                {selectedProduct.price.toLocaleString()} KHR
                <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}> / {selectedProduct.unit}</span>
              </div>
              {modalQty > 1 && (
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
                  {modalQty} x {selectedProduct.price.toLocaleString()} = <span style={{ color: deepGreen, fontWeight: '800' }}>{(selectedProduct.price * modalQty).toLocaleString()} KHR</span>
                </p>
              )}
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px', marginBottom: '18px', marginTop: modalQty <= 1 ? '12px' : 0 }}>{selectedProduct.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                  { icon: <Box size={15} color={brandGreen} />, label: 'In Stock', value: selectedProduct.isAvailable ? `${selectedProduct.quantity} units` : 'Out of Stock', red: false },
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
              <div style={{ backgroundColor: '#eff6ef', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Leaf color={brandGreen} size={18} />
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: deepGreen }}>Health Highlights</span>
                  <span style={{ fontSize: '13px', color: '#444' }}>{selectedProduct.benefit}</span>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>Sold by</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={shopAvatar} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #eff6ef' }} alt={shopOwner}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName)}&background=0DB30D&color=fff&size=50`; }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '15px', color: deepGreen }}>{shopName}</span>
                      {shopVerified && <ShieldCheck size={15} color={brandGreen} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '13px', marginTop: '3px' }}>
                      <MapPin size={12} /><span>{shopLocation}{shopOwner ? ` - by ${shopOwner}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => toggleFavorite(selectedProduct.id)}
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '2px solid #f0f0f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={20} fill={favorites.includes(selectedProduct.id) ? "#ef4444" : "none"} color={favorites.includes(selectedProduct.id) ? "#ef4444" : "#333"} />
                </button>
                {selectedProduct.isAvailable && isShopOpen && (
                  <QtyStepper value={modalQty} onChange={setModalQty} max={selectedProduct.quantity} size="md" />
                )}
                <button disabled={!selectedProduct.isAvailable || !isShopOpen}
                  onClick={() => { addToCart(selectedProduct, modalQty); setModalQty(1); setSelectedProduct(null); }}
                  style={{ flex: 1, backgroundColor: !isShopOpen ? '#fee2e2' : selectedProduct.isAvailable ? brandGreen : '#f3f4f6', color: !isShopOpen ? '#b91c1c' : selectedProduct.isAvailable ? '#fff' : '#9ca3af', border: !isShopOpen ? '1px solid #fecdd3' : 'none', padding: '13px', borderRadius: '12px', fontWeight: '800', cursor: selectedProduct.isAvailable && isShopOpen ? 'pointer' : 'not-allowed', fontSize: '14px', fontFamily: 'inherit' }}>
                  {!isShopOpen ? 'Shop Closed' : selectedProduct.isAvailable ? `Add${modalQty > 1 ? ` ${modalQty}` : ''} to Basket` : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Slide-out Panel ── */}
      {isCartOpen && (
        <div className="sidebar-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="sidebar-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: deepGreen }}>Your Basket</h3>
              <X size={22} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setIsCartOpen(false)} />
            </div>
            <p style={{ margin: '0 0 22px', fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>{cartTotalQty} item{cartTotalQty !== 1 ? 's' : ''}</p>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cartList.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                  <ShoppingBasket size={40} color="#e5e7eb" style={{ marginBottom: '12px' }} />
                  <p style={{ color: '#bbb', fontWeight: '600', fontSize: '14px' }}>Your basket is empty.</p>
                </div>
              ) : cartList.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
                  <img src={item.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop'} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h5>
                    <p style={{ margin: '0 0 8px', color: '#9ca3af', fontSize: '12px' }}>{item.price.toLocaleString()} KHR / {item.unit}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <QtyStepper value={item.qty} onChange={v => updateCartQty(item.id, v)} max={item.quantity} size="sm" />
                      <span style={{ fontWeight: '800', fontSize: '14px', color: deepGreen }}>{(item.price * item.qty).toLocaleString()} KHR</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)}
                    style={{ border: 'none', background: '#fff0f0', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}>
                    <Trash2 size={13} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>
            {cartList.length > 0 && (
              <div style={{ paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: '#f9fafb', borderRadius: '12px', marginBottom: '14px' }}>
                  <span style={{ fontWeight: '700', color: '#555', fontSize: '14px' }}>Total</span>
                  <span style={{ fontWeight: '800', color: deepGreen, fontSize: '16px' }}>{cartTotalPrice.toLocaleString()} KHR</span>
                </div>
                <button style={{ width: '100%', padding: '15px', backgroundColor: brandGreen, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit' }}>
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Favorites Slide-out Panel — UNCHANGED ── */}
      {isFavOpen && (
        <div className="sidebar-overlay" onClick={() => setIsFavOpen(false)}>
          <div className="sidebar-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: deepGreen }}>Your Favorites</h3>
              <X size={22} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setIsFavOpen(false)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {favProducts.length === 0 ? (
                <p style={{ color: '#bbb', textAlign: 'center', marginTop: '60px', fontWeight: '600', fontSize: '14px' }}>No favorites yet.</p>
              ) : favProducts.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6', alignItems: 'center' }}>
                  <img src={item.img} style={{ width: '58px', height: '58px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: '700' }}>{item.name}</h5>
                    <p style={{ margin: 0, color: brandGreen, fontWeight: '700', fontSize: '13px' }}>{item.price.toLocaleString()} KHR</p>
                  </div>
                  <HeartOff size={17} color="#ef4444" style={{ cursor: 'pointer', opacity: 0.75, flexShrink: 0 }} onClick={() => toggleFavorite(item.id)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Panel — UNCHANGED ── */}
      {filterOpen && (
        <div className="filter-overlay" onClick={() => setFilterOpen(false)}>
          <div className="filter-panel" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: deepGreen }}>Filters</h3>
                {activeFilterCount > 0 && <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied</span>}
              </div>
              <X size={22} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setFilterOpen(false)} />
            </div>
            <div className="filter-scroll">
              <div className="filter-section">
                <p className="filter-section-title">Product Type</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(cat => (
                    <button key={cat} className={`chip${draftCategory === cat ? ' active' : ''}`} onClick={() => setDraftCategory(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <p className="filter-section-title">Price Range</p>
                <div className="price-row">
                  <MinPriceInput value={draftMinPrice} onChange={handleDraftMinChange} />
                  <span className="price-dash">-</span>
                  <MaxPriceInput value={draftMaxPrice} onChange={handleDraftMaxChange} />
                </div>
              </div>
              <div className="filter-section">
                <p className="filter-section-title">Harvest Date</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {harvestOptions.map(opt => (
                    <button key={opt} className={`chip${draftHarvest === opt ? ' active' : ''}`} onClick={() => setDraftHarvest(opt)}>{opt}</button>
                  ))}
                </div>
              </div>
              <div className="filter-section">
                <p className="filter-section-title">Availability</p>
                <div onClick={() => setDraftAvailable(!draftAvailable)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px 18px', border: '2px solid', borderColor: draftAvailable ? brandGreen : '#e5e7eb', borderRadius: '14px', background: draftAvailable ? '#f0fdf0' : '#fafafa' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#111' }}>In Stock Only</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>Hide out-of-stock products</p>
                  </div>
                  <div className="toggle-track" style={{ background: draftAvailable ? brandGreen : '#e5e7eb' }}>
                    <div className="toggle-thumb" style={{ left: draftAvailable ? '23px' : '3px' }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '12px' }}>
              <button onClick={resetDraft} style={{ flex: 1, padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', background: '#fff', fontWeight: '700', fontSize: '14px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}>
                <RotateCcw size={14} /> Reset All
              </button>
              <button onClick={applyFilters} style={{ flex: 2, padding: '14px', border: 'none', borderRadius: '12px', background: brandGreen, fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                Apply Filters {activeFilterCount > 0 && <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '100px', fontSize: '12px' }}>{activeFilterCount}</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CART BUTTON (NEW) ── */}
      <button
        className="float-cart-btn"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Open basket, ${cartTotalQty} items`}
      >
        <ShoppingBasket size={26} color="#fff" strokeWidth={2.2} />
        {cartTotalQty > 0 && (
          <span className="float-cart-badge">
            {cartTotalQty > 99 ? '99+' : cartTotalQty}
          </span>
        )}
      </button>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 5%' }}>
        <a href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px', marginBottom: '30px' }}>
          <ChevronLeft size={16} /> Back to Shops
        </a>

        {/* ── Shop Header — UNCHANGED ── */}
        <div style={{ borderRadius: '32px', backgroundColor: surfaceWhite, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '50px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: '280px' }}>
            <img src={shopCover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6))' }} />
            <img src={shopAvatar} style={{ position: 'absolute', bottom: '20px', left: '40px', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover', backgroundColor: '#e5e7eb' }} alt={shopOwner}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName)}&background=0DB30D&color=fff&size=80`; }} />
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', display: 'flex', gap: '30px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{products.length}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Products</div>
              </div>
              {shopVerified && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>✓</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>Verified</div>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '24px 40px 36px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: deepGreen }}>{shopName}</h2>
              {shopVerified && <ShieldCheck size={20} color={brandGreen} />}
              {!isShopOpen ? (
                <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                  ● Shop Closed
                </span>
              ) : (
                <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                  ● Open for Orders
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '14px', marginBottom: '16px' }}>
              <MapPin size={14} />
              <span>{shopLocation}</span>
              {shopOwner && <><span style={{ marginLeft: '8px', color: '#ccc' }}>·</span><span style={{ marginLeft: '8px' }}>by {shopOwner}</span></>}
            </div>

            {!isShopOpen && (
              <div style={{
                marginTop: '12px',
                backgroundColor: '#fff1f2',
                border: '1.5px solid #fecdd3',
                borderRadius: '16px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#9f1239'
              }}>
                <span style={{ fontSize: '22px' }}>🚪</span>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px' }}>Farm Shop Temporarily Closed</div>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                    This local grower has paused operations for today. You can still browse the harvest catalog, but new orders cannot be placed at this time.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Products Section — UNCHANGED ── */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color={brandGreen} /> Products
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#999', marginLeft: '4px' }}>({processedProducts.length} of {products.length} items)</span>
              </h3>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Click any product card to see full details.</p>
            </div>
            <button onClick={openFilter}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', border: `2px solid ${activeFilterCount > 0 ? brandGreen : '#e5e7eb'}`, borderRadius: '14px', background: activeFilterCount > 0 ? '#f0fdf0' : '#fff', color: activeFilterCount > 0 ? deepGreen : '#444', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && <span style={{ backgroundColor: brandGreen, color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px' }}>{activeFilterCount}</span>}
            </button>
          </div>

          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {selectedCategory !== 'All' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: '#eff6ef', color: deepGreen, fontSize: '12px', fontWeight: '700' }}>{selectedCategory}<X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('All')} /></span>}
              {(minPrice !== '' || maxPrice !== '') && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: '#eff6ef', color: deepGreen, fontSize: '12px', fontWeight: '700' }}>{minPrice || '0'} - {maxPrice || 'any'} KHR<X size={12} style={{ cursor: 'pointer' }} onClick={() => { setMinPrice(''); setMaxPrice(''); }} /></span>}
              {harvestFilter !== 'All Time' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: '#eff6ef', color: deepGreen, fontSize: '12px', fontWeight: '700' }}>{harvestFilter}<X size={12} style={{ cursor: 'pointer' }} onClick={() => setHarvestFilter('All Time')} /></span>}
              {showOnlyAvailable && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: '#eff6ef', color: deepGreen, fontSize: '12px', fontWeight: '700' }}>In Stock Only<X size={12} style={{ cursor: 'pointer' }} onClick={() => setShowOnlyAvailable(false)} /></span>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', backgroundColor: selectedCategory === cat ? brandGreen : '#fff', color: selectedCategory === cat ? '#fff' : '#666', fontWeight: '600', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.2s' }}>{cat}</button>
            ))}
          </div>
        </div>

        {processedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>No products match your filters.</p>
            <button onClick={() => { setSelectedCategory('All'); setShowOnlyAvailable(false); setMinPrice(''); setMaxPrice(''); setHarvestFilter('All Time'); }}
              style={{ marginTop: '12px', padding: '10px 24px', backgroundColor: brandGreen, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px', marginBottom: '80px' }}>
            {processedProducts.map(veg => {
              const inCart = cartItems[veg.id];
              const pQty = getPendingQty(veg.id);
              return (
                <div key={veg.id} className="product-card" onClick={() => { setSelectedProduct(veg); setModalQty(1); }}
                  style={{ borderRadius: '24px', backgroundColor: surfaceWhite, position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  <button onClick={e => { e.stopPropagation(); toggleFavorite(veg.id); }}
                    style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, backgroundColor: surfaceWhite, border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Heart size={18} fill={favorites.includes(veg.id) ? "#ef4444" : "none"} color={favorites.includes(veg.id) ? "#ef4444" : "#333"} />
                  </button>
                  {!isShopOpen ? (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: '#991b1b', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.25)', letterSpacing: '0.04em' }}>
                      SHOP CLOSED
                    </div>
                  ) : !veg.isAvailable ? (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>Out of Stock</div>
                  ) : inCart ? (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: deepGreen, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>{inCart.qty} in basket</div>
                  ) : null}
                  <img src={veg.img || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop'} style={{ width: '100%', height: '190px', objectFit: 'cover', opacity: !isShopOpen ? 0.65 : veg.isAvailable ? 1 : 0.55 }} alt={veg.name} />
                  <div style={{ padding: '18px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: brandGreen }}>{veg.category}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 6px' }}>
                      <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>{veg.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fffbeb', padding: '3px 7px', borderRadius: '8px' }}>
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#92400e' }}>{veg.rating || 'N/A'}</span>
                      </div>
                    </div>
                    <div style={{ color: deepGreen, fontWeight: '800', fontSize: '17px', marginBottom: '12px' }}>
                      {veg.price.toLocaleString()} KHR <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '400' }}>/ {veg.unit}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                      <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#aaa', fontWeight: '700', marginBottom: '3px' }}>QTY</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: deepGreen }}>{veg.isAvailable ? veg.quantity : '-'}</div>
                      </div>
                      <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#aaa', fontWeight: '700', marginBottom: '3px' }}>HARVESTED</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: deepGreen }}>{veg.harvestDate || '-'}</div>
                      </div>
                      <div style={{ backgroundColor: '#fff5f5', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#aaa', fontWeight: '700', marginBottom: '3px' }}>SELL BY</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444' }}>{veg.sellByDate || '-'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
                      <Leaf size={12} color={brandGreen} />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: deepGreen }}>{veg.benefit}</span>
                    </div>
                    {!isShopOpen ? (
                      <button disabled style={{ width: '100%', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'not-allowed', fontSize: '12px', fontFamily: 'inherit' }}>
                        Closed (Temporarily)
                      </button>
                    ) : veg.isAvailable ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <QtyStepper value={pQty} onChange={v => setPendingQty(prev => ({ ...prev, [veg.id]: v }))} max={veg.quantity} size="sm" />
                        <button onClick={e => { e.stopPropagation(); addToCart(veg, pQty); }}
                          style={{ flex: 1, backgroundColor: brandGreen, color: '#fff', border: 'none', height: '32px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                          {inCart ? 'Add More' : 'Add to Basket'}
                        </button>
                      </div>
                    ) : (
                      <button disabled style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '700', cursor: 'not-allowed', fontSize: '14px', fontFamily: 'inherit' }}>
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
