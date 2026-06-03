'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Star, Heart, ShoppingBasket, Store, ChevronDown, SlidersHorizontal, X, RotateCcw, Plus, Minus, Leaf, Box, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';

interface Product {
  id: number; name: string; category: string; price: number; unit: string;
  benefit: string; description: string; popularity: number; rating: number;
  isAvailable: boolean; img: string; quantity: number;
  harvestDate: string; sellByDate: string;
  shopSlug: string; shopName: string; shopAvatar: string; shopLocation: string;
}

// ── All products from all shops flat ─────────────────────────────────────────
const allProducts: Product[] = [
  // Srey's Organic Farm
  { id: 101, name: 'Organic Carrots', category: 'Root Vegetables', price: 7000, unit: '1 kg', benefit: 'Rich in Beta-carotene for sharp eyesight', description: 'Grown in nutrient-rich soil without synthetic pesticides. Harvested at peak ripeness for maximum crunch and vitamin content.', popularity: 95, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80', quantity: 50, harvestDate: 'May 05, 2026', sellByDate: 'May 10, 2026', shopSlug: 'srey-farm', shopName: "Srey's Organic Farm", shopAvatar: 'https://i.pravatar.cc/100?img=47', shopLocation: 'Kandal Province' },
  { id: 102, name: 'Morning Glory', category: 'Leafy Greens', price: 2500, unit: '1 kg', benefit: 'Rich in Iron & boosts your energy', description: 'Traditional Tra-kuon sourced from local water farms. High in fiber and essential minerals, perfect for your daily stir-fry.', popularity: 90, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80', quantity: 80, harvestDate: 'May 06, 2026', sellByDate: 'May 09, 2026', shopSlug: 'srey-farm', shopName: "Srey's Organic Farm", shopAvatar: 'https://i.pravatar.cc/100?img=47', shopLocation: 'Kandal Province' },
  { id: 103, name: 'Fresh Spinach', category: 'Leafy Greens', price: 3500, unit: '500 g', benefit: 'High in iron & folate for healthy blood', description: 'Tender baby spinach leaves harvested early morning. Ideal for salads, smoothies, or a quick sauté with garlic.', popularity: 80, rating: 4.7, isAvailable: true, img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80', quantity: 40, harvestDate: 'May 06, 2026', sellByDate: 'May 10, 2026', shopSlug: 'srey-farm', shopName: "Srey's Organic Farm", shopAvatar: 'https://i.pravatar.cc/100?img=47', shopLocation: 'Kandal Province' },
  { id: 104, name: 'Sweet Potatoes', category: 'Root Vegetables', price: 5500, unit: '1 kg', benefit: 'Rich in Vitamin A & natural energy', description: 'Orange-fleshed sweet potatoes packed with antioxidants.', popularity: 75, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=500&q=80', quantity: 60, harvestDate: 'May 04, 2026', sellByDate: 'May 14, 2026', shopSlug: 'srey-farm', shopName: "Srey's Organic Farm", shopAvatar: 'https://i.pravatar.cc/100?img=47', shopLocation: 'Kandal Province' },
  { id: 105, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4000, unit: '500 g', benefit: 'Packed with Vitamin C for strong immunity', description: 'Sun-ripened tomatoes rich in Lycopene.', popularity: 70, rating: 4.2, isAvailable: false, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80', quantity: 0, harvestDate: 'May 01, 2026', sellByDate: 'May 07, 2026', shopSlug: 'srey-farm', shopName: "Srey's Organic Farm", shopAvatar: 'https://i.pravatar.cc/100?img=47', shopLocation: 'Kandal Province' },
  { id: 106, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 3000, unit: '1 kg', benefit: 'High hydration & great for glowing skin', description: '95% water and packed with electrolytes.', popularity: 85, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80', quantity: 70, harvestDate: 'May 06, 2026', sellByDate: 'May 11, 2026', shopSlug: 'srey-farm', shopName: "Srey's Organic Farm", shopAvatar: 'https://i.pravatar.cc/100?img=47', shopLocation: 'Kandal Province' },
  // Sokha Leafy Greens
  { id: 201, name: 'Morning Glory', category: 'Leafy Greens', price: 2000, unit: '1 kg', benefit: 'Iron-rich for daily energy boost', description: 'Freshly picked water spinach from Kampong Cham.', popularity: 95, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80', quantity: 100, harvestDate: 'May 06, 2026', sellByDate: 'May 09, 2026', shopSlug: 'sokha-leafy', shopName: 'Sokha Leafy Greens', shopAvatar: 'https://i.pravatar.cc/100?img=32', shopLocation: 'Kampong Cham' },
  { id: 202, name: 'Chinese Kale', category: 'Leafy Greens', price: 3000, unit: '500 g', benefit: 'Calcium & Vitamin K for strong bones', description: 'Crisp Chinese broccoli with tender stems.', popularity: 88, rating: 4.6, isAvailable: true, img: 'https://media.istockphoto.com/id/1358217289/photo/chinese-kale-vegetable-on-white-background.jpg?s=612x612&w=0&k=20&c=tcoaKxfOx2w0Q7QhXLWmO59wy4yPyVSAB2IwxEPjP_k=', quantity: 45, harvestDate: 'May 05, 2026', sellByDate: 'May 10, 2026', shopSlug: 'sokha-leafy', shopName: 'Sokha Leafy Greens', shopAvatar: 'https://i.pravatar.cc/100?img=32', shopLocation: 'Kampong Cham' },
  { id: 204, name: 'Fresh Spinach', category: 'Leafy Greens', price: 3500, unit: '500 g', benefit: 'Iron & folate for healthy blood', description: 'Tender baby spinach harvested at dawn.', popularity: 80, rating: 4.5, isAvailable: false, img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80', quantity: 0, harvestDate: 'May 03, 2026', sellByDate: 'May 08, 2026', shopSlug: 'sokha-leafy', shopName: 'Sokha Leafy Greens', shopAvatar: 'https://i.pravatar.cc/100?img=32', shopLocation: 'Kampong Cham' },
  // Dara's Green Garden
  { id: 301, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4500, unit: '500 g', benefit: 'Lycopene-rich for heart health', description: 'Bold, sun-ripened Siem Reap tomatoes.', popularity: 90, rating: 4.7, isAvailable: true, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80', quantity: 55, harvestDate: 'May 05, 2026', sellByDate: 'May 10, 2026', shopSlug: 'dara-greens', shopName: "Dara's Green Garden", shopAvatar: 'https://i.pravatar.cc/100?img=21', shopLocation: 'Siem Reap' },
  { id: 302, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 2800, unit: '1 kg', benefit: 'Hydrating & refreshing for hot days', description: 'Cool, crisp cucumbers from our well-irrigated garden.', popularity: 85, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80', quantity: 90, harvestDate: 'May 06, 2026', sellByDate: 'May 12, 2026', shopSlug: 'dara-greens', shopName: "Dara's Green Garden", shopAvatar: 'https://i.pravatar.cc/100?img=21', shopLocation: 'Siem Reap' },
  { id: 303, name: 'Long Beans', category: 'Fruit Vegetables', price: 3200, unit: '500 g', benefit: 'High protein & fiber for digestion', description: 'Yard-long beans that are a staple of Khmer cooking.', popularity: 78, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1587411768638-ec71f8e33b78?auto=format&fit=crop&w=500&q=80', quantity: 35, harvestDate: 'May 05, 2026', sellByDate: 'May 09, 2026', shopSlug: 'dara-greens', shopName: "Dara's Green Garden", shopAvatar: 'https://i.pravatar.cc/100?img=21', shopLocation: 'Siem Reap' },
  // Vanna's Fresh Harvest
  { id: 401, name: 'Pumpkin', category: 'Fruit Vegetables', price: 5000, unit: '1 kg', benefit: 'Beta-carotene & Vitamin A for immunity', description: 'Dense, sweet Battambang pumpkins.', popularity: 92, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=500&q=80', quantity: 30, harvestDate: 'May 04, 2026', sellByDate: 'May 18, 2026', shopSlug: 'vanna-harvest', shopName: "Vanna's Fresh Harvest", shopAvatar: 'https://i.pravatar.cc/100?img=54', shopLocation: 'Battambang' },
  { id: 402, name: 'Cherry Tomatoes', category: 'Fruit Vegetables', price: 6000, unit: '500 g', benefit: 'High Vitamin C & antioxidants', description: 'Tiny, sweet bursts of flavour. Sun-grown in open fields.', popularity: 85, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=500&q=80', quantity: 25, harvestDate: 'May 06, 2026', sellByDate: 'May 10, 2026', shopSlug: 'vanna-harvest', shopName: "Vanna's Fresh Harvest", shopAvatar: 'https://i.pravatar.cc/100?img=54', shopLocation: 'Battambang' },
  { id: 403, name: 'Eggplant', category: 'Fruit Vegetables', price: 3500, unit: '500 g', benefit: 'Nasunin antioxidant for brain health', description: 'Tender purple eggplants with a mild, creamy flesh.', popularity: 72, rating: 4.3, isAvailable: false, img: 'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg', quantity: 0, harvestDate: 'May 02, 2026', sellByDate: 'May 07, 2026', shopSlug: 'vanna-harvest', shopName: "Vanna's Fresh Harvest", shopAvatar: 'https://i.pravatar.cc/100?img=54', shopLocation: 'Battambang' },
  // Bopha Root Veggies
  { id: 501, name: 'Organic Carrots', category: 'Root Vegetables', price: 6500, unit: '1 kg', benefit: 'Beta-carotene for sharp eyesight', description: 'Crunchy urban-grown carrots with vibrant colour.', popularity: 93, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80', quantity: 65, harvestDate: 'May 06, 2026', sellByDate: 'May 11, 2026', shopSlug: 'bopha-roots', shopName: 'Bopha Root Veggies', shopAvatar: 'https://i.pravatar.cc/100?img=16', shopLocation: 'Phnom Penh' },
  { id: 502, name: 'White Radish', category: 'Root Vegetables', price: 3000, unit: '1 kg', benefit: 'Digestive enzymes & Vitamin C', description: 'Crisp daikon-style radish great for pickling or soups.', popularity: 75, rating: 4.4, isAvailable: true, img: 'https://growhoss.com/cdn/shop/products/white-icicle-radish.jpg?v=1691781923', quantity: 40, harvestDate: 'May 05, 2026', sellByDate: 'May 12, 2026', shopSlug: 'bopha-roots', shopName: 'Bopha Root Veggies', shopAvatar: 'https://i.pravatar.cc/100?img=16', shopLocation: 'Phnom Penh' },
  { id: 503, name: 'Sweet Potatoes', category: 'Root Vegetables', price: 5500, unit: '1 kg', benefit: 'Rich in Vitamin A & slow-release energy', description: 'Creamy orange flesh with natural sweetness.', popularity: 80, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=500&q=80', quantity: 50, harvestDate: 'May 04, 2026', sellByDate: 'May 14, 2026', shopSlug: 'bopha-roots', shopName: 'Bopha Root Veggies', shopAvatar: 'https://i.pravatar.cc/100?img=16', shopLocation: 'Phnom Penh' },
  // Rith Urban Farm
  { id: 601, name: 'Hydroponic Lettuce', category: 'Leafy Greens', price: 8000, unit: '300 g', benefit: 'Zero pesticides, maximum nutrition', description: 'Grown in our controlled indoor hydroponic system.', popularity: 88, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=500&q=80', quantity: 20, harvestDate: 'May 06, 2026', sellByDate: 'May 10, 2026', shopSlug: 'rith-urban', shopName: 'Rith Urban Farm', shopAvatar: 'https://i.pravatar.cc/100?img=8', shopLocation: 'Phnom Penh' },
  { id: 603, name: 'Baby Bok Choy', category: 'Leafy Greens', price: 6500, unit: '400 g', benefit: 'Calcium & Vitamin C for bone health', description: 'Miniature bok choy with tender stalks and mild, sweet leaves.', popularity: 76, rating: 4.5, isAvailable: false, img: 'https://images.squarespace-cdn.com/content/v1/5d96d524052c897425394aaf/1736951245568-2RF8M9E0PYIJQBT3IQQX/bok-choy-vs-baby-bok-choy.jpeg?format=1500w', quantity: 0, harvestDate: 'May 03, 2026', sellByDate: 'May 08, 2026', shopSlug: 'rith-urban', shopName: 'Rith Urban Farm', shopAvatar: 'https://i.pravatar.cc/100?img=8', shopLocation: 'Phnom Penh' },
];

// ── Shop meta (for modal "Sold By" section) ──────────────────────────────────
// ← NEW: lightweight lookup so the modal can show shop rating/sales/customers
const shopMeta: Record<string, { rating: number; sales: number; customers: number }> = {
  'srey-farm':     { rating: 4.9, sales: 1240, customers: 320 },
  'sokha-leafy':   { rating: 4.5, sales: 1100, customers: 290 },
  'dara-greens':   { rating: 4.7, sales: 980,  customers: 210 },
  'vanna-harvest': { rating: 4.6, sales: 860,  customers: 195 },
  'bopha-roots':   { rating: 4.5, sales: 750,  customers: 180 },
  'rith-urban':    { rating: 4.3, sales: 520,  customers: 130 },
};

const categories = ['All', 'Root Vegetables', 'Leafy Greens', 'Fruit Vegetables'];

const sortOptions = [
  { value: 'Most Popular', label: 'Most Popular' },
  { value: 'Price: Low to High', label: 'Price: Low to High' },
  { value: 'Price: High to Low', label: 'Price: High to Low' },
  { value: 'Top Rated', label: 'Top Rated' },
];

// ── Stable price inputs ───────────────────────────────────────────────────────
const MinPriceInput = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div style={{ position: 'relative', flex: 1 }}>
    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '800', color: '#9ca3af', pointerEvents: 'none' }}>KHR</span>
    <input type="number" placeholder="Min" value={value} min={0} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #e5e7eb', borderRadius: '10px', padding: '10px 10px 10px 42px', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit', outline: 'none', background: '#fafafa' }}
      onFocus={e => e.target.style.borderColor = brandGreen}
      onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
  </div>
));
MinPriceInput.displayName = 'MinPriceInput';

const MaxPriceInput = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div style={{ position: 'relative', flex: 1 }}>
    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: '800', color: '#9ca3af', pointerEvents: 'none' }}>KHR</span>
    <input type="number" placeholder="Max" value={value} min={0} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', boxSizing: 'border-box', border: '2px solid #e5e7eb', borderRadius: '10px', padding: '10px 10px 10px 42px', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit', outline: 'none', background: '#fafafa' }}
      onFocus={e => e.target.style.borderColor = brandGreen}
      onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
  </div>
));
MaxPriceInput.displayName = 'MaxPriceInput';

function QtyStepper({ value, onChange, max }: { value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '2px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', height: '34px' }}>
      <button disabled={value <= 1} onClick={e => { e.stopPropagation(); onChange(Math.max(1, value - 1)); }}
        style={{ width: '32px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: 'none', cursor: value <= 1 ? 'not-allowed' : 'pointer', opacity: value <= 1 ? 0.35 : 1 }}>
        <Minus size={12} color="#555" />
      </button>
      <span style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#111', borderLeft: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb' }}>{value}</span>
      <button disabled={value >= max} onClick={e => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
        style={{ width: '32px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: 'none', cursor: value >= max ? 'not-allowed' : 'pointer', opacity: value >= max ? 0.35 : 1 }}>
        <Plus size={12} color="#555" />
      </button>
    </div>
  );
}

// ── Modal Qty Stepper (larger) ─────────────────────────────────────────────── ← NEW
function QtyStepperLg({ value, onChange, max }: { value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', height: '46px' }}>
      <button disabled={value <= 1} onClick={e => { e.stopPropagation(); onChange(Math.max(1, value - 1)); }}
        style={{ width: '42px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: 'none', cursor: value <= 1 ? 'not-allowed' : 'pointer', opacity: value <= 1 ? 0.35 : 1 }}>
        <Minus size={15} color="#555" />
      </button>
      <span style={{ width: '42px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', color: '#111', borderLeft: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb' }}>{value}</span>
      <button disabled={value >= max} onClick={e => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
        style={{ width: '42px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', border: 'none', cursor: value >= max ? 'not-allowed' : 'pointer', opacity: value >= max ? 0.35 : 1 }}>
        <Plus size={15} color="#555" />
      </button>
    </div>
  );
}

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Filter panel
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState('All');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  const handleDraftMin = useCallback((v: string) => setDraftMinPrice(v), []);
  const handleDraftMax = useCallback((v: string) => setDraftMaxPrice(v), []);

  // Cart & favorites
  const [cartItems, setCartItems] = useState<Record<number, { qty: number }>>({});
  const [pendingQty, setPendingQty] = useState<Record<number, number>>({});
  const [favorites, setFavorites] = useState<number[]>([]);

  // ← NEW: product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ← NEW: close modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedProduct(null); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Load cart & favorites from localStorage on mount
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart-products') || '{}');
      if (!Array.isArray(cart)) {
        const simplified: Record<number, { qty: number }> = {};
        Object.entries(cart).forEach(([k, v]: any) => { simplified[Number(k)] = { qty: v.qty ?? 1 }; });
        setCartItems(simplified);
      }
      const favs = JSON.parse(localStorage.getItem('fav-products') || '[]');
      setFavorites(favs.map((p: any) => p.id));
    } catch (e) {}
  }, []);

  const activeFilterCount = [selectedCategory !== 'All', minPrice !== '', maxPrice !== '', showOnlyAvailable].filter(Boolean).length;

  const openFilter = () => {
    setDraftCategory(selectedCategory); setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice); setDraftAvailable(showOnlyAvailable);
    setFilterOpen(true);
  };
  const applyFilters = () => {
    setSelectedCategory(draftCategory); setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice); setShowOnlyAvailable(draftAvailable);
    setFilterOpen(false);
  };
  const resetDraft = () => { setDraftCategory('All'); setDraftMinPrice(''); setDraftMaxPrice(''); setDraftAvailable(false); };

  const toggleFavorite = (product: Product) => {
    const isAlready = favorites.includes(product.id);
    const updated = isAlready ? favorites.filter(f => f !== product.id) : [...favorites, product.id];
    setFavorites(updated);
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('fav-products') || '[]');
      if (isAlready) {
        localStorage.setItem('fav-products', JSON.stringify(stored.filter(p => p.id !== product.id)));
      } else {
        const alreadyStored = stored.some(p => p.id === product.id);
        if (!alreadyStored) {
          localStorage.setItem('fav-products', JSON.stringify([...stored, product]));
        }
      }
    } catch (e) {}
  };

  const addToCart = (product: Product, qty: number) => {
    const existing = cartItems[product.id]?.qty ?? 0;
    const newQty = Math.min(existing + qty, product.quantity);
    setCartItems(prev => ({ ...prev, [product.id]: { qty: newQty } }));
    setPendingQty(prev => ({ ...prev, [product.id]: 1 }));
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      stored[product.id] = { ...product, qty: newQty };
      localStorage.setItem('cart-products', JSON.stringify(stored));
    } catch (e) {}
  };

  const processed = useMemo(() => {
    let list = [...allProducts];
    if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.shopName.toLowerCase().includes(search.toLowerCase()));
    if (showOnlyAvailable) list = list.filter(p => p.isAvailable);
    if (minPrice !== '') list = list.filter(p => p.price >= Number(minPrice));
    if (maxPrice !== '') list = list.filter(p => p.price <= Number(maxPrice));
    switch (sortBy) {
      case 'Price: Low to High': return list.sort((a, b) => a.price - b.price);
      case 'Price: High to Low': return list.sort((a, b) => b.price - a.price);
      case 'Top Rated': return list.sort((a, b) => b.rating - a.rating);
      default: return list.sort((a, b) => b.popularity - a.popularity);
    }
  }, [search, selectedCategory, sortBy, showOnlyAvailable, minPrice, maxPrice]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      {/* ── NEW: Product Detail Modal ─────────────────────────────────────── */}
      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', maxWidth: '560px', width: '100%', borderRadius: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {/* Hero image */}
            <img src={selectedProduct.img} alt={selectedProduct.name}
              style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '32px 32px 0 0' }} />

            {/* Close button */}
            <button onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#fff" />
            </button>

            <div style={{ padding: '28px' }}>
              {/* Category + name + rating */}
              <span style={{ color: brandGreen, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedProduct.category}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '6px 0 4px' }}>
                <h3 style={{ fontSize: '26px', fontWeight: '800', color: deepGreen, margin: 0 }}>{selectedProduct.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbeb', padding: '5px 10px', borderRadius: '10px', flexShrink: 0, marginLeft: '12px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>{selectedProduct.rating}</span>
                </div>
              </div>

              {/* Price */}
              <div style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, marginBottom: '4px' }}>
                {selectedProduct.price.toLocaleString()} KHR
                <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}> / {selectedProduct.unit}</span>
              </div>
              {modalQty > 1 && (
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
                  {modalQty} × {selectedProduct.price.toLocaleString()} =&nbsp;
                  <span style={{ color: deepGreen, fontWeight: '800' }}>{(selectedProduct.price * modalQty).toLocaleString()} KHR</span>
                </p>
              )}

              {/* Description */}
              <p style={{ color: '#666', lineHeight: '1.65', fontSize: '14px', margin: `${modalQty > 1 ? '0' : '12px'} 0 20px` }}>{selectedProduct.description}</p>

              {/* Info tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                {[
                  { icon: <Box size={15} color={brandGreen} />, label: 'In Stock', value: selectedProduct.isAvailable ? `${selectedProduct.quantity} units` : 'Out of Stock', red: false },
                  { icon: <Calendar size={15} color={brandGreen} />, label: 'Harvested', value: selectedProduct.harvestDate, red: false },
                  { icon: <Calendar size={15} color="#ef4444" />, label: 'Sell By', value: selectedProduct.sellByDate, red: true },
                ].map((info, i) => (
                  <div key={i} style={{ backgroundColor: info.red ? '#fff5f5' : '#f9fafb', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{info.icon}</div>
                    <div style={{ fontSize: '10px', color: '#aaa', fontWeight: '600', marginBottom: '4px' }}>{info.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: info.red ? '#ef4444' : '#333' }}>{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Health highlight */}
              <div style={{ backgroundColor: '#eff6ef', padding: '14px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Leaf color={brandGreen} size={18} />
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: deepGreen }}>Health Highlights</span>
                  <span style={{ fontSize: '13px', color: '#444' }}>{selectedProduct.benefit}</span>
                </div>
              </div>

              {/* Sold by */}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '18px', marginBottom: '22px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>Sold By</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img src={selectedProduct.shopAvatar} alt=""
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #eff6ef' }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.shopName)}&background=0DB30D&color=fff&size=50`; }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '800', fontSize: '15px', color: deepGreen }}>{selectedProduct.shopName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '13px', marginTop: '3px' }}>
                      <MapPin size={12} />
                      <span>{selectedProduct.shopLocation}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>⭐ {shopMeta[selectedProduct.shopSlug]?.rating ?? selectedProduct.rating}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>📦 {(shopMeta[selectedProduct.shopSlug]?.sales ?? 0).toLocaleString()} sales</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>👥 {shopMeta[selectedProduct.shopSlug]?.customers ?? 0} customers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions: fav + qty + add to basket */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => toggleFavorite(selectedProduct)}
                  style={{ padding: '10px 13px', borderRadius: '12px', border: '2px solid #f0f0f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={20} fill={favorites.includes(selectedProduct.id) ? '#ef4444' : 'none'} color={favorites.includes(selectedProduct.id) ? '#ef4444' : '#333'} />
                </button>
                {selectedProduct.isAvailable && (
                  <QtyStepperLg value={modalQty} onChange={setModalQty} max={selectedProduct.quantity} />
                )}
                <button
                  disabled={!selectedProduct.isAvailable}
                  onClick={() => { addToCart(selectedProduct, modalQty); setModalQty(1); setSelectedProduct(null); }}
                  style={{ flex: 1, backgroundColor: selectedProduct.isAvailable ? brandGreen : '#f3f4f6', color: selectedProduct.isAvailable ? '#fff' : '#9ca3af', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: selectedProduct.isAvailable ? 'pointer' : 'not-allowed', fontSize: '14px', fontFamily: 'inherit' }}>
                  {selectedProduct.isAvailable ? `Add${modalQty > 1 ? ` ${modalQty}` : ''} to Basket` : 'Out of Stock'}
                </button>
              </div>

              {/* View Shop button */}
              <Link href={`/shop/${selectedProduct.shopSlug}`}
                onClick={() => setSelectedProduct(null)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px', padding: '13px', borderRadius: '12px', border: '2px solid #e5e7eb', color: deepGreen, fontWeight: '700', fontSize: '14px', textDecoration: 'none', backgroundColor: '#fff', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = brandGreen; (e.currentTarget as HTMLAnchorElement).style.background = '#f0fdf0'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; }}>
                <Store size={15} /> View Shop
              </Link>
            </div>
          </div>
        </div>
      )}
      {/* ── END Modal ─────────────────────────────────────────────────────── */}

      {/* Filter Panel */}
      {filterOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setFilterOpen(false)}>
          <div style={{ background: '#fff', width: '420px', maxWidth: '95vw', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.15)', animation: 'slideIn 0.28s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: deepGreen }}>Filters</h3>
                {activeFilterCount > 0 && <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>{activeFilterCount} applied</span>}
              </div>
              <X size={22} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setFilterOpen(false)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px' }}>
              {/* Product Type */}
              <div style={{ padding: '24px 0', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '13px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>Product Type</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setDraftCategory(cat)}
                      style={{ padding: '9px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: `2px solid ${draftCategory === cat ? brandGreen : '#e5e7eb'}`, background: draftCategory === cat ? brandGreen : '#fff', color: draftCategory === cat ? '#fff' : '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              {/* Price Range */}
              <div style={{ padding: '24px 0', borderBottom: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: '13px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>Price Range</p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <MinPriceInput value={draftMinPrice} onChange={handleDraftMin} />
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#ccc' }}>—</span>
                  <MaxPriceInput value={draftMaxPrice} onChange={handleDraftMax} />
                </div>
              </div>
              {/* Availability */}
              <div style={{ padding: '24px 0' }}>
                <p style={{ fontSize: '13px', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>Availability</p>
                <div onClick={() => setDraftAvailable(!draftAvailable)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px 18px', border: `2px solid ${draftAvailable ? brandGreen : '#e5e7eb'}`, borderRadius: '14px', background: draftAvailable ? '#f0fdf0' : '#fafafa' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#111' }}>In Stock Only</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>Hide out-of-stock products</p>
                  </div>
                  <div style={{ width: '44px', height: '24px', borderRadius: '100px', background: draftAvailable ? brandGreen : '#e5e7eb', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', top: '3px', left: draftAvailable ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 28px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '12px' }}>
              <button onClick={resetDraft} style={{ flex: 1, padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', background: '#fff', fontWeight: '700', fontSize: '14px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}>
                <RotateCcw size={14} /> Reset
              </button>
              <button onClick={applyFilters} style={{ flex: 2, padding: '14px', border: 'none', borderRadius: '12px', background: brandGreen, fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                Apply Filters {activeFilterCount > 0 && <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '100px', fontSize: '12px' }}>{activeFilterCount}</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '50px 5%' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <span style={{ color: brandGreen, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Fresh From The Farm</span>
          <h2 style={{ fontSize: '40px', fontWeight: '800', color: deepGreen, margin: '8px 0 10px' }}>All Products</h2>
          <p style={{ color: '#666', fontSize: '16px' }}>Browse fresh vegetables from all local farms in one place.</p>
        </div>

        {/* Search + Sort + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', border: '1.5px solid #e8e8e8', borderRadius: '12px', padding: '11px 16px' }}>
            <Search size={16} color="#999" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or farms..." style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', fontFamily: 'inherit', color: '#333', background: 'transparent' }} />
          </div>

          {/* Sort dropdown */}
          <div style={{ position: 'relative' }} ref={sortRef}>
            <button onClick={() => setSortOpen(!sortOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: '12px', padding: '11px 16px', fontFamily: 'inherit', fontSize: '14px', fontWeight: '700', color: '#333', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {sortBy} <ChevronDown size={14} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1.5px solid #e8e8e8', borderRadius: '16px', padding: '8px', minWidth: '200px', zIndex: 500, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                {sortOptions.map(opt => (
                  <div key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: sortBy === opt.value ? '700' : '600', color: sortBy === opt.value ? deepGreen : '#555', background: sortBy === opt.value ? '#eff6ef' : 'transparent', cursor: 'pointer' }}>
                    {opt.label} {sortBy === opt.value && '✓'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter button */}
          <button onClick={openFilter}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 18px', border: `2px solid ${activeFilterCount > 0 ? brandGreen : '#e5e7eb'}`, borderRadius: '12px', background: activeFilterCount > 0 ? '#f0fdf0' : '#fff', color: activeFilterCount > 0 ? deepGreen : '#444', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <SlidersHorizontal size={15} /> Filters
            {activeFilterCount > 0 && <span style={{ backgroundColor: brandGreen, color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px' }}>{activeFilterCount}</span>}
          </button>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              style={{ padding: '10px 22px', borderRadius: '100px', border: 'none', backgroundColor: selectedCategory === cat ? brandGreen : '#fff', color: selectedCategory === cat ? '#fff' : '#666', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p style={{ color: '#888', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
          Showing <span style={{ color: deepGreen, fontWeight: '800' }}>{processed.length}</span> of {allProducts.length} products
        </p>

        {/* Product Grid */}
        {processed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>No products match your filters.</p>
            <button onClick={() => { setSelectedCategory('All'); setMinPrice(''); setMaxPrice(''); setShowOnlyAvailable(false); setSearch(''); }}
              style={{ marginTop: '12px', padding: '10px 24px', backgroundColor: brandGreen, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '80px' }}>
            {processed.map(product => {
              const inCart = cartItems[product.id];
              const pQty = pendingQty[product.id] ?? 1;
              const isFav = favorites.includes(product.id);
              return (
                // ← NEW: card is now clickable to open modal
                <div key={product.id}
                  onClick={() => { setSelectedProduct(product); setModalQty(1); }}
                  style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
                >
                  {/* Out of stock badge */}
                  {!product.isAvailable && (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>Out of Stock</div>
                  )}
                  {/* In cart badge */}
                  {product.isAvailable && inCart && (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 10, backgroundColor: deepGreen, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>{inCart.qty} in basket</div>
                  )}
                  {/* Favorite button */}
                  <button onClick={e => { e.stopPropagation(); toggleFavorite(product); }} // ← stopPropagation so click doesn't open modal
                    style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10, backgroundColor: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                    <Heart size={16} fill={isFav ? "#ef4444" : "none"} color={isFav ? "#ef4444" : "#999"} />
                  </button>

                  <img src={product.img} style={{ width: '100%', height: '185px', objectFit: 'cover', opacity: product.isAvailable ? 1 : 0.55 }} alt={product.name} />

                  <div style={{ padding: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: brandGreen }}>{product.category}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 6px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111' }}>{product.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fffbeb', padding: '3px 7px', borderRadius: '8px', flexShrink: 0 }}>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#92400e' }}>{product.rating}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '17px', fontWeight: '800', color: deepGreen, marginBottom: '10px' }}>
                      {product.price.toLocaleString()} KHR <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>/ {product.unit}</span>
                    </div>

                    {/* Shop info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px', padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: '10px' }}>
                      <img src={product.shopAvatar} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.shopName}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{product.shopLocation}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '12px' }}>
                      <Leaf size={11} color={brandGreen} />
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#555' }}>{product.benefit}</span>
                    </div>

                    {/* Buttons — stopPropagation so clicks don't open modal */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      {/* Row 1: Qty + Add to Basket */}
                      {product.isAvailable ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <QtyStepper value={pQty} onChange={v => setPendingQty(prev => ({ ...prev, [product.id]: v }))} max={product.quantity} />
                          <button onClick={() => addToCart(product, pQty)}
                            style={{ flex: 1, backgroundColor: brandGreen, color: '#fff', border: 'none', height: '34px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <ShoppingBasket size={13} /> {inCart ? 'Add More' : 'Add to Basket'}
                          </button>
                        </div>
                      ) : (
                        <button disabled style={{ width: '100%', backgroundColor: '#f3f4f6', color: '#9ca3af', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', cursor: 'not-allowed', fontSize: '13px', fontFamily: 'inherit' }}>
                          Out of Stock
                        </button>
                      )}
                      {/* Row 2: View Shop */}
                      <Link href={`/shop/${product.shopSlug}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '10px', border: '2px solid #e5e7eb', color: deepGreen, fontWeight: '700', fontSize: '12px', textDecoration: 'none', transition: 'all 0.2s', backgroundColor: '#fff' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = brandGreen; (e.currentTarget as HTMLAnchorElement).style.background = '#f0fdf0'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; }}>
                        <Store size={13} /> View Shop
                      </Link>
                    </div>
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
