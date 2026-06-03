'use client';

import React, { useState, useMemo, use, useCallback } from 'react';
import { Heart, Star, Leaf, X, Trash2, HeartOff, SlidersHorizontal, ChevronLeft, MapPin, ShieldCheck, Package, Calendar, Box, RotateCcw, Plus, Minus, ShoppingBasket } from 'lucide-react';
import Navbar from '@/components/Navbar';
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
  quantity: number;
  harvestDate: string;
  sellByDate: string;
}

interface CartItem extends Product {
  qty: number;
}

interface Shop {
  slug: string;
  name: string;
  owner: string;
  location: string;
  description: string;
  tags: string[];
  rating: number;
  sales: number;
  customers: number;
  isVerified: boolean;
  coverImg: string;
  avatarImg: string;
  products: Product[];
}

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin: 0; padding: 0;
    background-color: #fafafa;
    color: #1a1a1a;
  }
  .filter-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(6px);
    z-index: 1000;
    display: flex; justify-content: flex-end;
  }
  .filter-panel {
    background: #fff;
    width: 420px; max-width: 95vw; height: 100%;
    display: flex; flex-direction: column;
    box-shadow: -20px 0 60px rgba(0,0,0,0.15);
    animation: slideIn 0.28s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .filter-scroll {
    flex: 1; overflow-y: auto; padding: 0 28px 28px;
  }
  .filter-scroll::-webkit-scrollbar { width: 4px; }
  .filter-scroll::-webkit-scrollbar-track { background: transparent; }
  .filter-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
  .filter-section { padding: 24px 0; border-bottom: 1px solid #f3f4f6; }
  .filter-section:last-child { border-bottom: none; }
  .filter-section-title {
    font-size: 13px; font-weight: 800; color: #374151;
    letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 14px 0;
  }
  .chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: 100px;
    font-size: 13px; font-weight: 700;
    border: 2px solid #e5e7eb;
    background: #fff; color: #555;
    cursor: pointer; transition: all 0.18s; user-select: none;
    font-family: inherit;
  }
  .chip:hover { border-color: #0DB30D; color: #0A490A; }
  .chip.active { border-color: #0DB30D; background: #0DB30D; color: #fff; }

  /* ── Price inputs ── */
  .price-row { display: flex; gap: 10px; align-items: center; }
  .price-field { position: relative; flex: 1; }
  .price-field input {
    width: 100%; box-sizing: border-box;
    border: 2px solid #e5e7eb; border-radius: 12px;
    padding: 12px 12px 12px 46px;
    font-size: 14px; font-weight: 700; color: #111;
    font-family: inherit; outline: none;
    transition: border-color 0.2s; background: #fafafa;
  }
  .price-field input:focus { border-color: #0DB30D; background: #fff; }
  .price-field .currency {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%);
    font-size: 11px; font-weight: 800; color: #9ca3af;
    pointer-events: none;
  }
  .price-dash { font-size: 16px; font-weight: 700; color: #ccc; flex-shrink: 0; }

  .toggle-track {
    width: 44px; height: 24px; border-radius: 100px;
    cursor: pointer; transition: background 0.2s;
    position: relative; flex-shrink: 0;
  }
  .toggle-thumb {
    position: absolute; width: 18px; height: 18px;
    border-radius: 50%; background: #fff; top: 3px;
    transition: left 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .sidebar-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.3); backdrop-filter: blur(4px);
    z-index: 1000; display: flex; justify-content: flex-end;
  }
  .sidebar-content {
    background: white; width: 420px; height: 100%;
    padding: 30px; box-shadow: -10px 0 30px rgba(0,0,0,0.1);
    display: flex; flex-direction: column; box-sizing: border-box;
  }
  .info-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    z-index: 2000; display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .info-modal-content {
    background: white; max-width: 560px; width: 100%;
    border-radius: 32px; position: relative;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    max-height: 90vh; overflow-y: auto;
  }
  .product-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0,0,0,0.12) !important;
  }
  .tag-pill {
    padding: 4px 12px; border-radius: 100px;
    font-size: 12px; font-weight: 700;
    background: #eff6ef; color: #0A490A;
  }

  /* ── Qty stepper ── */
  .qty-stepper {
    display: inline-flex; align-items: center;
    border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;
  }
  .qty-btn {
    display: flex; align-items: center; justify-content: center;
    background: #f9fafb; border: none; cursor: pointer;
    transition: background 0.15s; flex-shrink: 0;
  }
  .qty-btn:hover:not(:disabled) { background: #eff6ef; }
  .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .qty-val {
    font-weight: 800; color: #111; text-align: center;
    border-left: 1.5px solid #e5e7eb;
    border-right: 1.5px solid #e5e7eb;
    display: flex; align-items: center; justify-content: center;
  }
`;

const allShops: Shop[] = [
  {
    slug: 'srey-farm', name: "Srey's Organic Farm", owner: 'Srey Soda', location: 'Kandal Province',
    description: 'Family-run organic farm delivering the freshest leafy greens and rich vegetables since 2018. We grow everything naturally, with love and care for the soil.',
    tags: ['Organic', 'Leafy Greens', 'Root Veg'], rating: 4.9, sales: 1240, customers: 320, isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=47',
    products: [
      { id: 101, name: 'Organic Carrots', category: 'Root Vegetables', price: 7000, unit: '1 kg', benefit: 'Rich in Beta-carotene for sharp eyesight', description: 'Grown in nutrient-rich soil without synthetic pesticides. Harvested at peak ripeness for maximum crunch and vitamin content.', popularity: 95, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80', quantity: 50, harvestDate: 'May 05, 2026', sellByDate: 'May 10, 2026' },
      { id: 102, name: 'Morning Glory', category: 'Leafy Greens', price: 2500, unit: '1 kg', benefit: 'Rich in Iron & boosts your energy', description: 'Traditional Tra-kuon sourced from local water farms. High in fiber and essential minerals, perfect for your daily stir-fry.', popularity: 90, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80', quantity: 80, harvestDate: 'May 06, 2026', sellByDate: 'May 09, 2026' },
      { id: 103, name: 'Fresh Spinach', category: 'Leafy Greens', price: 3500, unit: '500 g', benefit: 'High in iron & folate for healthy blood', description: 'Tender baby spinach leaves harvested early morning. Ideal for salads, smoothies, or a quick sauté with garlic.', popularity: 80, rating: 4.7, isAvailable: true, img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80', quantity: 40, harvestDate: 'May 06, 2026', sellByDate: 'May 10, 2026' },
      { id: 104, name: 'Sweet Potatoes', category: 'Root Vegetables', price: 5500, unit: '1 kg', benefit: 'Rich in Vitamin A & natural energy', description: 'Orange-fleshed sweet potatoes packed with antioxidants.', popularity: 75, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=500&q=80', quantity: 60, harvestDate: 'May 04, 2026', sellByDate: 'May 14, 2026' },
      { id: 105, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4000, unit: '500 g', benefit: 'Packed with Vitamin C for strong immunity', description: 'Sun-ripened tomatoes rich in Lycopene.', popularity: 70, rating: 4.2, isAvailable: false, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80', quantity: 0, harvestDate: 'May 01, 2026', sellByDate: 'May 07, 2026' },
      { id: 106, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 3000, unit: '1 kg', benefit: 'High hydration & great for glowing skin', description: '95% water and packed with electrolytes.', popularity: 85, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80', quantity: 70, harvestDate: 'May 06, 2026', sellByDate: 'May 11, 2026' },
    ]
  },
  {
    slug: 'sokha-leafy', name: 'Sokha Leafy Greens', owner: 'Sokha Pov', location: 'Kampong Cham',
    description: 'Premium leafy greens grown with love in Kampong Cham, picked daily for maximum freshness.',
    tags: ['Leafy Greens', 'Morning Glory', 'Spinach'], rating: 4.5, sales: 1100, customers: 290, isVerified: true,
    coverImg: 'https://www.worldbank.org/content/dam/Worldbank/Highlights%20&%20Features/EAP/cambodia/cambodia-agr.jpg',
    avatarImg: 'https://i.pravatar.cc/100?img=32',
    products: [
      { id: 201, name: 'Morning Glory', category: 'Leafy Greens', price: 2000, unit: '1 kg', benefit: 'Iron-rich for daily energy boost', description: 'Freshly picked water spinach from Kampong Cham.', popularity: 95, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80', quantity: 100, harvestDate: 'May 06, 2026', sellByDate: 'May 09, 2026' },
      { id: 202, name: 'Chinese Kale', category: 'Leafy Greens', price: 3000, unit: '500 g', benefit: 'Calcium & Vitamin K for strong bones', description: 'Crisp Chinese broccoli with tender stems.', popularity: 88, rating: 4.6, isAvailable: true, img: 'https://media.istockphoto.com/id/1358217289/photo/chinese-kale-vegetable-on-white-background.jpg?s=612x612&w=0&k=20&c=tcoaKxfOx2w0Q7QhXLWmO59wy4yPyVSAB2IwxEPjP_k=', quantity: 45, harvestDate: 'May 05, 2026', sellByDate: 'May 10, 2026' },
      { id: 204, name: 'Fresh Spinach', category: 'Leafy Greens', price: 3500, unit: '500 g', benefit: 'Iron & folate for healthy blood', description: 'Tender baby spinach harvested at dawn.', popularity: 80, rating: 4.5, isAvailable: false, img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80', quantity: 0, harvestDate: 'May 03, 2026', sellByDate: 'May 08, 2026' },
    ]
  },
  {
    slug: 'dara-greens', name: "Dara's Green Garden", owner: 'Dara Chan', location: 'Siem Reap',
    description: 'Specialising in tropical fruit vegetables and fresh herbs grown in the rich soil of Siem Reap.',
    tags: ['Mixed', 'Fruit Veg', 'Herbs'], rating: 4.7, sales: 980, customers: 210, isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=21',
    products: [
      { id: 301, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4500, unit: '500 g', benefit: 'Lycopene-rich for heart health', description: 'Bold, sun-ripened Siem Reap tomatoes.', popularity: 90, rating: 4.7, isAvailable: true, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80', quantity: 55, harvestDate: 'May 05, 2026', sellByDate: 'May 10, 2026' },
      { id: 302, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 2800, unit: '1 kg', benefit: 'Hydrating & refreshing for hot days', description: 'Cool, crisp cucumbers from our well-irrigated garden plots.', popularity: 85, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80', quantity: 90, harvestDate: 'May 06, 2026', sellByDate: 'May 12, 2026' },
      { id: 303, name: 'Long Beans', category: 'Fruit Vegetables', price: 3200, unit: '500 g', benefit: 'High protein & fiber for digestion', description: 'Yard-long beans that are a staple of Khmer cooking.', popularity: 78, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1587411768638-ec71f8e33b78?auto=format&fit=crop&w=500&q=80', quantity: 35, harvestDate: 'May 05, 2026', sellByDate: 'May 09, 2026' },
    ]
  },
  {
    slug: 'vanna-harvest', name: "Vanna's Fresh Harvest", owner: 'Vanna Keo', location: 'Battambang',
    description: 'From the rice bowl of Cambodia — Battambang — bringing you a wide variety of seasonal vegetables.',
    tags: ['Mixed', 'Tomatoes', 'Cucumbers'], rating: 4.6, sales: 860, customers: 195, isVerified: false,
    coverImg: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=54',
    products: [
      { id: 401, name: 'Pumpkin', category: 'Fruit Vegetables', price: 5000, unit: '1 kg', benefit: 'Beta-carotene & Vitamin A for immunity', description: 'Dense, sweet Battambang pumpkins.', popularity: 92, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=500&q=80', quantity: 30, harvestDate: 'May 04, 2026', sellByDate: 'May 18, 2026' },
      { id: 402, name: 'Cherry Tomatoes', category: 'Fruit Vegetables', price: 6000, unit: '500 g', benefit: 'High Vitamin C & antioxidants', description: 'Tiny, sweet bursts of flavour. Sun-grown in open fields.', popularity: 85, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=500&q=80', quantity: 25, harvestDate: 'May 06, 2026', sellByDate: 'May 10, 2026' },
      { id: 403, name: 'Eggplant', category: 'Fruit Vegetables', price: 3500, unit: '500 g', benefit: 'Nasunin antioxidant for brain health', description: 'Tender purple eggplants with a mild, creamy flesh.', popularity: 72, rating: 4.3, isAvailable: false, img: 'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg', quantity: 0, harvestDate: 'May 02, 2026', sellByDate: 'May 07, 2026' },
    ]
  },
  {
    slug: 'bopha-roots', name: 'Bopha Root Veggies', owner: 'Bopha Ros', location: 'Phnom Penh',
    description: 'The best root vegetables in Phnom Penh, harvested fresh every morning from our urban farm.',
    tags: ['Root Veg', 'Carrots', 'Potatoes'], rating: 4.5, sales: 750, customers: 180, isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=16',
    products: [
      { id: 501, name: 'Organic Carrots', category: 'Root Vegetables', price: 6500, unit: '1 kg', benefit: 'Beta-carotene for sharp eyesight', description: 'Crunchy urban-grown carrots with vibrant colour and sweetness.', popularity: 93, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80', quantity: 65, harvestDate: 'May 06, 2026', sellByDate: 'May 11, 2026' },
      { id: 502, name: 'White Radish', category: 'Root Vegetables', price: 3000, unit: '1 kg', benefit: 'Digestive enzymes & Vitamin C', description: 'Crisp daikon-style radish great for pickling, soups, or fresh salads.', popularity: 75, rating: 4.4, isAvailable: true, img: 'https://growhoss.com/cdn/shop/products/white-icicle-radish.jpg?v=1691781923', quantity: 40, harvestDate: 'May 05, 2026', sellByDate: 'May 12, 2026' },
      { id: 503, name: 'Sweet Potatoes', category: 'Root Vegetables', price: 5500, unit: '1 kg', benefit: 'Rich in Vitamin A & slow-release energy', description: 'Creamy orange flesh with natural sweetness.', popularity: 80, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=500&q=80', quantity: 50, harvestDate: 'May 04, 2026', sellByDate: 'May 14, 2026' },
    ]
  },
  {
    slug: 'rith-urban', name: 'Rith Urban Farm', owner: 'Rith Nak', location: 'Phnom Penh',
    description: 'A modern hydroponic urban farm in the heart of Phnom Penh, growing pesticide-free vegetables year-round.',
    tags: ['Organic', 'Urban', 'Hydroponic'], rating: 4.3, sales: 520, customers: 130, isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=8',
    products: [
      { id: 601, name: 'Hydroponic Lettuce', category: 'Leafy Greens', price: 8000, unit: '300 g', benefit: 'Zero pesticides, maximum nutrition', description: 'Grown in our controlled indoor hydroponic system.', popularity: 88, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=500&q=80', quantity: 20, harvestDate: 'May 06, 2026', sellByDate: 'May 10, 2026' },
      { id: 603, name: 'Baby Bok Choy', category: 'Leafy Greens', price: 6500, unit: '400 g', benefit: 'Calcium & Vitamin C for bone health', description: 'Miniature bok choy with tender stalks and mild, sweet leaves.', popularity: 76, rating: 4.5, isAvailable: false, img: 'https://images.squarespace-cdn.com/content/v1/5d96d524052c897425394aaf/1736951245568-2RF8M9E0PYIJQBT3IQQX/bok-choy-vs-baby-bok-choy.jpeg?format=1500w', quantity: 0, harvestDate: 'May 03, 2026', sellByDate: 'May 08, 2026' },
    ]
  }
];

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';
const surfaceWhite = '#ffffff';

function parseHarvestDate(str: string): Date { return new Date(str); }
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

// ── Qty Stepper ────────────────────────────────────────────────────────────────
function QtyStepper({ value, onChange, max, size = 'md' }: {
  value: number; onChange: (v: number) => void; max: number; size?: 'sm' | 'md';
}) {
  const btnSize = size === 'sm' ? 32 : 40;
  const valWidth = size === 'sm' ? 34 : 42;
  const iconSize = size === 'sm' ? 13 : 15;
  const fontSize = size === 'sm' ? '13px' : '15px';
  return (
    <div className="qty-stepper" style={{ height: btnSize }}>
      <button className="qty-btn" style={{ width: btnSize, height: btnSize }}
        disabled={value <= 1}
        onClick={e => { e.stopPropagation(); onChange(Math.max(1, value - 1)); }}>
        <Minus size={iconSize} color={value <= 1 ? '#d1d5db' : '#555'} />
      </button>
      <span className="qty-val" style={{ width: valWidth, fontSize, height: btnSize }}>{value}</span>
      <button className="qty-btn" style={{ width: btnSize, height: btnSize }}
        disabled={value >= max}
        onClick={e => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}>
        <Plus size={iconSize} color={value >= max ? '#d1d5db' : '#555'} />
      </button>
    </div>
  );
}

// ── Price inputs extracted OUTSIDE the main component so they never remount ──
// This is the KEY fix: defining filter input components outside prevents
// React from treating them as new components on every render (which caused focus loss).
const MinPriceInput = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="price-field">
    <span className="currency">KHR</span>
    <input
      type="number"
      placeholder="Min"
      value={value}
      min={0}
      onChange={e => onChange(e.target.value)}
    />
  </div>
));
MinPriceInput.displayName = 'MinPriceInput';

const MaxPriceInput = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="price-field">
    <span className="currency">KHR</span>
    <input
      type="number"
      placeholder="Max"
      value={value}
      min={0}
      onChange={e => onChange(e.target.value)}
    />
  </div>
));
MaxPriceInput.displayName = 'MaxPriceInput';

export default function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const shop = allShops.find(s => s.slug === id) || allShops[0];

  // Fixed global categories — same across every shop
  // If a shop has no products in a category, the filter just shows empty results
  const categories = ['All', 'Root Vegetables', 'Leafy Greens', 'Fruit Vegetables'];

  // ── Applied filter state ───────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [harvestFilter, setHarvestFilter] = useState<'All Time' | 'Today' | 'This Week' | 'This Month'>('All Time');

  // ── Draft state (inside panel, committed on Apply) ─────────────────────────
  const [draftCategory, setDraftCategory] = useState('All');
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftHarvest, setDraftHarvest] = useState<'All Time' | 'Today' | 'This Week' | 'This Month'>('All Time');

  // stable callbacks so MinPriceInput / MaxPriceInput never get new function refs
  const handleDraftMinChange = useCallback((v: string) => setDraftMinPrice(v), []);
  const handleDraftMaxChange = useCallback((v: string) => setDraftMaxPrice(v), []);

  const [filterOpen, setFilterOpen] = useState(false);

  // ── Cart: keyed by product id ──────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<Record<number, CartItem>>({});
  // pending qty on each card (before adding to cart)
  const [pendingQty, setPendingQty] = useState<Record<number, number>>({});
  // modal qty
  const [modalQty, setModalQty] = useState(1);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavOpen, setIsFavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const toggleFavorite = (fid: number) => {
  setFavorites(prev => {
    const isAlready = prev.includes(fid);
    const updated = isAlready ? prev.filter(f => f !== fid) : [...prev, fid];
    try {
      const product = shop.products.find(p => p.id === fid);
      const stored: any[] = JSON.parse(localStorage.getItem('fav-products') || '[]');
      if (isAlready) {
        // remove all copies of this product
        localStorage.setItem('fav-products', JSON.stringify(stored.filter(p => p.id !== fid)));
      } else if (product) {
        // only add if not already in the list
        const alreadyStored = stored.some(p => p.id === fid);
        if (!alreadyStored) {
          localStorage.setItem('fav-products', JSON.stringify([...stored, {
            ...product,
            shopName: shop.name,
            shopSlug: shop.slug,
            shopAvatar: shop.avatarImg,
          }]));
        }
      }
    } catch (e) {}
    return updated;
  });
};

  const addToCart = (product: Product, qty: number) => {
    setCartItems(prev => {
      const existing = prev[product.id];
      const newQty = Math.min((existing?.qty ?? 0) + qty, product.quantity);
      return { ...prev, [product.id]: { ...product, qty: newQty } };
    });
    setPendingQty(prev => ({ ...prev, [product.id]: 1 }));
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      const newQty = Math.min((stored[product.id]?.qty ?? 0) + qty, product.quantity);
      stored[product.id] = { ...product, qty: newQty, shopName: shop.name, shopSlug: shop.slug, shopAvatar: shop.avatarImg };
      localStorage.setItem('cart-products', JSON.stringify(stored));
    } catch (e) {}
  };

  const updateCartQty = (productId: number, newQty: number) => {
    if (newQty <= 0) { removeFromCart(productId); return; }
    setCartItems(prev => ({ ...prev, [productId]: { ...prev[productId], qty: newQty } }));
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      if (stored[productId]) { stored[productId].qty = newQty; localStorage.setItem('cart-products', JSON.stringify(stored)); }
    } catch (e) {}
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => { const n = { ...prev }; delete n[productId]; return n; });
    try {
      const stored = JSON.parse(localStorage.getItem('cart-products') || '{}');
      delete stored[productId];
      localStorage.setItem('cart-products', JSON.stringify(stored));
    } catch (e) {}
  };

  const processedProducts = useMemo(() => {
    let list = [...shop.products];
    if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory);
    if (showOnlyAvailable) list = list.filter(p => p.isAvailable);
    if (minPrice !== '') list = list.filter(p => p.price >= Number(minPrice));
    if (maxPrice !== '') list = list.filter(p => p.price <= Number(maxPrice));
    if (harvestFilter !== 'All Time') {
      list = list.filter(p => {
        const d = parseHarvestDate(p.harvestDate);
        if (harvestFilter === 'Today') return isToday(d);
        if (harvestFilter === 'This Week') return isThisWeek(d);
        if (harvestFilter === 'This Month') return isThisMonth(d);
        return true;
      });
    }
    return list.sort((a, b) => b.popularity - a.popularity);
  }, [selectedCategory, showOnlyAvailable, minPrice, maxPrice, harvestFilter, shop]);

  const favProducts = shop.products.filter(p => favorites.includes(p.id));
  const getPendingQty = (pid: number) => pendingQty[pid] ?? 1;

  const harvestOptions: Array<'All Time' | 'Today' | 'This Week' | 'This Month'> = ['All Time', 'Today', 'This Week', 'This Month'];

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{fontStyles}</style>

      {/* ── Product Detail Modal ── */}
      {selectedProduct && (
        <div className="info-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="info-modal-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <img src={selectedProduct.img} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '32px 32px 0 0' }} alt="" />
            <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="#fff" />
            </button>
            <div style={{ padding: '28px' }}>
              <span style={{ color: brandGreen, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>{selectedProduct.category}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '6px 0 4px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, margin: 0 }}>{selectedProduct.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbeb', padding: '5px 10px', borderRadius: '10px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>{selectedProduct.rating}</span>
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, marginBottom: '4px' }}>
                {selectedProduct.price.toLocaleString()} KHR
                <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '400' }}> / {selectedProduct.unit}</span>
              </div>
              {modalQty > 1 && (
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
                  {modalQty} × {selectedProduct.price.toLocaleString()} =&nbsp;
                  <span style={{ color: deepGreen, fontWeight: '800' }}>{(selectedProduct.price * modalQty).toLocaleString()} KHR</span>
                </p>
              )}
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '14px', marginBottom: '18px', marginTop: modalQty <= 1 ? '12px' : 0 }}>{selectedProduct.description}</p>

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
                  <img src={shop.avatarImg} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #eff6ef' }} alt={shop.owner}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.owner)}&background=0DB30D&color=fff&size=50`; }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '800', fontSize: '15px', color: deepGreen }}>{shop.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '13px', marginTop: '3px' }}>
                      <MapPin size={12} /><span>{shop.location} · by {shop.owner}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>⭐ {shop.rating}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>📦 {shop.sales.toLocaleString()} sales</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>👥 {shop.customers} customers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal: fav + qty + add */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => toggleFavorite(selectedProduct.id)}
                  style={{ padding: '10px 12px', borderRadius: '12px', border: '2px solid #f0f0f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={20} fill={favorites.includes(selectedProduct.id) ? "#ef4444" : "none"} color={favorites.includes(selectedProduct.id) ? "#ef4444" : "#333"} />
                </button>
                {selectedProduct.isAvailable && (
                  <QtyStepper value={modalQty} onChange={setModalQty} max={selectedProduct.quantity} size="md" />
                )}
                <button disabled={!selectedProduct.isAvailable}
                  onClick={() => { addToCart(selectedProduct, modalQty); setModalQty(1); setSelectedProduct(null); }}
                  style={{ flex: 1, backgroundColor: selectedProduct.isAvailable ? brandGreen : '#f3f4f6', color: selectedProduct.isAvailable ? '#fff' : '#9ca3af', border: 'none', padding: '13px', borderRadius: '12px', fontWeight: '700', cursor: selectedProduct.isAvailable ? 'pointer' : 'not-allowed', fontSize: '14px', fontFamily: 'inherit' }}>
                  {selectedProduct.isAvailable ? `Add${modalQty > 1 ? ` ${modalQty}` : ''} to Basket` : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Sidebar ── */}
      {isCartOpen && (
        <div className="sidebar-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="sidebar-content" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: deepGreen }}>Your Basket</h3>
              <X size={22} style={{ cursor: 'pointer', color: '#9ca3af' }} onClick={() => setIsCartOpen(false)} />
            </div>
            <p style={{ margin: '0 0 22px', fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
              {cartTotalQty} item{cartTotalQty !== 1 ? 's' : ''}
            </p>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {cartList.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '60px' }}>
                  <ShoppingBasket size={40} color="#e5e7eb" style={{ marginBottom: '12px' }} />
                  <p style={{ color: '#bbb', fontWeight: '600', fontSize: '14px' }}>Your basket is empty.</p>
                </div>
              ) : cartList.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
                  <img src={item.img} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} alt="" />
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

      {/* ── Favourites Sidebar ── */}
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

      {/* ── Filter Panel ── */}
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
              {/* Product Type */}
              <div className="filter-section">
                <p className="filter-section-title">Product Type</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {categories.map(cat => (
                    <button key={cat} className={`chip${draftCategory === cat ? ' active' : ''}`} onClick={() => setDraftCategory(cat)}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Price Range — uses stable extracted components to fix focus bug */}
              <div className="filter-section">
                <p className="filter-section-title">Price Range</p>
                <div className="price-row">
                  <MinPriceInput value={draftMinPrice} onChange={handleDraftMinChange} />
                  <span className="price-dash">—</span>
                  <MaxPriceInput value={draftMaxPrice} onChange={handleDraftMaxChange} />
                </div>
                {(draftMinPrice !== '' || draftMaxPrice !== '') && (
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                    {draftMinPrice !== '' ? `${Number(draftMinPrice).toLocaleString()} KHR` : '0'} — {draftMaxPrice !== '' ? `${Number(draftMaxPrice).toLocaleString()} KHR` : 'any'}
                  </p>
                )}
              </div>

              {/* Harvest Date */}
              <div className="filter-section">
                <p className="filter-section-title">Harvest Date</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {harvestOptions.map(opt => (
                    <button key={opt} className={`chip${draftHarvest === opt ? ' active' : ''}`} onClick={() => setDraftHarvest(opt)}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="filter-section">
                <p className="filter-section-title">Availability</p>
                <div onClick={() => setDraftAvailable(!draftAvailable)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px 18px', border: '2px solid', borderColor: draftAvailable ? brandGreen : '#e5e7eb', borderRadius: '14px', transition: 'all 0.18s', background: draftAvailable ? '#f0fdf0' : '#fafafa' }}>
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
              <button onClick={resetDraft}
                style={{ flex: 1, padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', background: '#fff', fontWeight: '700', fontSize: '14px', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}>
                <RotateCcw size={14} /> Reset All
              </button>
              <button onClick={applyFilters}
                style={{ flex: 2, padding: '14px', border: 'none', borderRadius: '12px', background: brandGreen, fontWeight: '800', fontSize: '14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                Apply Filters {activeFilterCount > 0 && <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '100px', fontSize: '12px' }}>{activeFilterCount}</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 5%' }}>
        <a href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px', marginBottom: '30px' }}>
          <ChevronLeft size={16} /> Back to Shops
        </a>

        {/* Shop Header */}
        <div style={{ borderRadius: '32px', backgroundColor: surfaceWhite, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '50px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: '280px' }}>
            <img src={shop.coverImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6))' }} />
            <img src={shop.avatarImg} style={{ position: 'absolute', bottom: '20px', left: '40px', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover', backgroundColor: '#e5e7eb' }} alt={shop.owner}
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.owner)}&background=0DB30D&color=fff&size=80`; }} />
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', display: 'flex', gap: '30px' }}>
              {[{ label: 'Sales', value: shop.sales.toLocaleString() }, { label: 'Customers', value: shop.customers.toLocaleString() }, { label: 'Rating', value: `⭐ ${shop.rating}` }].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '24px 40px 36px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: deepGreen }}>{shop.name}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '14px', marginBottom: '16px' }}>
              <MapPin size={14} /><span>{shop.location}</span><span style={{ marginLeft: '8px', color: '#ccc' }}>·</span><span style={{ marginLeft: '8px' }}>by {shop.owner}</span>
            </div>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.7', maxWidth: '700px', margin: '0 0 20px 0' }}>{shop.description}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{shop.tags.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}</div>
          </div>
        </div>

        {/* Product Controls */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color={brandGreen} /> Products
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#999', marginLeft: '4px' }}>({processedProducts.length} of {shop.products.length} items)</span>
              </h3>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Click any product card to see full details, dates & merchant info.</p>
            </div>
            <button onClick={openFilter}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', border: `2px solid ${activeFilterCount > 0 ? brandGreen : '#e5e7eb'}`, borderRadius: '14px', background: activeFilterCount > 0 ? '#f0fdf0' : '#fff', color: activeFilterCount > 0 ? deepGreen : '#444', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && <span style={{ backgroundColor: brandGreen, color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px' }}>{activeFilterCount}</span>}
            </button>
          </div>

          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {selectedCategory !== 'All' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: '#eff6ef', color: deepGreen, fontSize: '12px', fontWeight: '700' }}>{selectedCategory}<X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('All')} /></span>}
              {(minPrice !== '' || maxPrice !== '') && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '100px', backgroundColor: '#eff6ef', color: deepGreen, fontSize: '12px', fontWeight: '700' }}>{minPrice || '0'} – {maxPrice || '∞'} KHR<X size={12} style={{ cursor: 'pointer' }} onClick={() => { setMinPrice(''); setMaxPrice(''); }} /></span>}
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

        {/* Product Grid */}
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

                  {!veg.isAvailable && (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>Out of Stock</div>
                  )}
                  {veg.isAvailable && inCart && (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, backgroundColor: deepGreen, color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px' }}>
                      {inCart.qty} in basket
                    </div>
                  )}

                  <img src={veg.img} style={{ width: '100%', height: '190px', objectFit: 'cover', opacity: veg.isAvailable ? 1 : 0.55 }} alt={veg.name} />

                  <div style={{ padding: '18px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: brandGreen }}>{veg.category}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 6px' }}>
                      <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>{veg.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fffbeb', padding: '3px 7px', borderRadius: '8px' }}>
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#92400e' }}>{veg.rating}</span>
                      </div>
                    </div>

                    <div style={{ color: deepGreen, fontWeight: '800', fontSize: '17px', marginBottom: '12px' }}>
                      {veg.price.toLocaleString()} KHR <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '400' }}>/ {veg.unit}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                      <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#aaa', fontWeight: '700', marginBottom: '3px' }}>QTY</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: deepGreen }}>{veg.isAvailable ? veg.quantity : '—'}</div>
                      </div>
                      <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#aaa', fontWeight: '700', marginBottom: '3px' }}>HARVESTED</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: deepGreen }}>{veg.harvestDate.replace(', 2026', '')}</div>
                      </div>
                      <div style={{ backgroundColor: '#fff5f5', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#aaa', fontWeight: '700', marginBottom: '3px' }}>SELL BY</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444' }}>{veg.sellByDate.replace(', 2026', '')}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
                      <Leaf size={12} color={brandGreen} />
                      <span style={{ fontSize: '12px', fontWeight: '700', color: deepGreen }}>{veg.benefit}</span>
                    </div>

                    {/* Qty stepper + Add button */}
                    {veg.isAvailable ? (
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

      <Footer />
    </div>
  );
}
