'use client';

import React, { useState, useMemo } from 'react';
import { Search, Star, MapPin, ShoppingBag, Filter, ChevronRight, Leaf, TrendingUp, Award, Users } from 'lucide-react';
import Link from 'next/link';

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
`;

interface Shop {
  id: string;
  name: string;
  owner: string;
  location: string;
  rating: number;
  totalSales: number;
  totalCustomers: number;
  isVerified: boolean;
  category: string;
  img: string;
  avatar: string;
  tags: string[];
  description: string;
}

const shops: Shop[] = [
  {
    id: 'srey-farm',
    name: "Srey's Organic Farm",
    owner: 'Srey Leak',
    location: 'Kandal Province',
    rating: 4.9,
    totalSales: 1240,
    totalCustomers: 320,
    isVerified: true,
    category: 'Organic',
    img: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=100&q=80',
    tags: ['Organic', 'Leafy Greens', 'Root Veg'],
    description: 'Family-run organic farm delivering the freshest leafy greens and root vegetables since 2018.',
  },
  {
    id: 'dara-greens',
    name: "Dara's Green Garden",
    owner: 'Dara Chan',
    location: 'Siem Reap',
    rating: 4.7,
    totalSales: 980,
    totalCustomers: 210,
    isVerified: true,
    category: 'Mixed',
    img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80',
    tags: ['Mixed', 'Fruit Veg', 'Herbs'],
    description: 'Specializing in tropical fruit vegetables and fresh herbs grown in the rich soil of Siem Reap.',
  },
  {
    id: 'bopha-roots',
    name: "Bopha Root Veggies",
    owner: 'Bopha Nim',
    location: 'Phnom Penh',
    rating: 4.5,
    totalSales: 750,
    totalCustomers: 180,
    isVerified: false,
    category: 'Root Vegetables',
    img: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80',
    tags: ['Root Veg', 'Carrots', 'Potatoes'],
    description: 'The best root vegetables in Phnom Penh, harvested fresh every morning from our urban farm.',
  },
  {
    id: 'sokha-leafy',
    name: "Sokha Leafy Greens",
    owner: 'Sokha Pov',
    location: 'Kampong Cham',
    rating: 4.8,
    totalSales: 1100,
    totalCustomers: 290,
    isVerified: true,
    category: 'Leafy Greens',
    img: 'https://www.worldbank.org/content/dam/Worldbank/Highlights%20&%20Features/EAP/cambodia/cambodia-agr.jpg',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    tags: ['Leafy Greens', 'Morning Glory', 'Spinach'],
    description: 'Premium leafy greens grown with love in Kampong Cham, picked daily for maximum freshness.',
  },
  {
    id: 'vanna-harvest',
    name: "Vanna's Fresh Harvest",
    owner: 'Vanna Keo',
    location: 'Battambang',
    rating: 4.6,
    totalSales: 860,
    totalCustomers: 195,
    isVerified: true,
    category: 'Mixed',
    img: 'https://www.eastwestseed.com/wp-content/uploads/2025/10/1-ba1f0adf.jpg',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=100&q=80',
    tags: ['Mixed', 'Tomatoes', 'Cucumbers'],
    description: 'From the rice bowl of Cambodia — Battambang — bringing you a wide variety of seasonal vegetables.',
  },
  {
    id: 'rith-urban',
    name: "Rith Urban Farm",
    owner: 'Rith Meas',
    location: 'Phnom Penh',
    rating: 4.3,
    totalSales: 520,
    totalCustomers: 130,
    isVerified: false,
    category: 'Organic',
    img: 'https://www.shutterstock.com/image-photo/siem-reap-province-cambodia-november-600nw-2317799261.jpg',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    tags: ['Organic', 'Urban', 'Hydroponic'],
    description: 'A modern hydroponic urban farm in the heart of Phnom Penh, growing pesticide-free vegetables year-round.',
  },
];

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';

export default function ShopPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Organic', 'Mixed', 'Leafy Greens', 'Root Vegetables'];

  const filtered = useMemo(() => {
    let list = [...shops];
    if (selectedCategory !== 'All') list = list.filter(s => s.category === selectedCategory);
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase()));
    switch (sortBy) {
      case 'Top Rated': return list.sort((a, b) => b.rating - a.rating);
      case 'Most Sales': return list.sort((a, b) => b.totalSales - a.totalSales);
      case 'Most Customers': return list.sort((a, b) => b.totalCustomers - a.totalCustomers);
      case 'Least Customers': return list.sort((a, b) => a.totalCustomers - b.totalCustomers);
      default: return list.sort((a, b) => b.totalSales - a.totalSales);
    }
  }, [search, sortBy, selectedCategory]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{fontStyles}</style>

      {/* Nav */}
      <nav style={{ padding: '20px 8%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ color: deepGreen, fontSize: '22px', fontWeight: '800', margin: 0 }}>LOCAL VEGETABLE</h1>
        </Link>
        <div style={{ display: 'flex', gap: '25px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px' }}>Home</Link>
          <Link href="/#about-us" style={{ textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px' }}>About Us</Link>
          <Link href="/shop" style={{ textDecoration: 'none', color: brandGreen, fontWeight: '700', fontSize: '14px' }}>Shop</Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '50px 5%' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <span style={{ color: brandGreen, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '2px' }}>Browse Sellers</span>
          <h2 style={{ fontSize: '40px', fontWeight: '800', color: deepGreen, margin: '8px 0 12px' }}>Our Local Shops</h2>
          <p style={{ color: '#666', fontSize: '16px' }}>Discover trusted local farmers and buy directly from them.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {[
            { icon: <Users size={22} color={brandGreen} />, label: 'Active Sellers', value: '6+' },
            { icon: <ShoppingBag size={22} color={brandGreen} />, label: 'Total Orders', value: '5,450+' },
            { icon: <Award size={22} color={brandGreen} />, label: 'Verified Shops', value: '4' },
          ].map((stat, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ backgroundColor: '#eff6ef', padding: '12px', borderRadius: '12px' }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: deepGreen }}>{stat.value}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '12px 16px' }}>
            <Search size={16} color="#999" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shops or location..." style={{ border: 'none', outline: 'none', fontSize: '14px', width: '100%', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '12px 16px' }}>
            <Filter size={16} color="#999" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
              <option>Most Popular</option>
              <option>Top Rated</option>
              <option>Most Sales</option>
              <option>Most Customers</option>
              <option>Least Customers</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '35px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '10px 22px', borderRadius: '100px', border: 'none', backgroundColor: selectedCategory === cat ? brandGreen : '#fff', color: selectedCategory === cat ? '#fff' : '#666', fontWeight: '600', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Shop Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px' }}>
          {filtered.map(shop => (
            <Link key={shop.id} href={`/shop/${shop.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; }}
              >
                {/* Cover Image */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  <img src={shop.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  {shop.isVerified && (
                    <div style={{ position: 'absolute', top: '14px', left: '14px', backgroundColor: brandGreen, color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={11} /> Verified
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '14px', right: '14px', backgroundColor: '#fff', borderRadius: '100px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>{shop.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <img src={shop.avatar} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eff6ef' }} alt="" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111' }}>{shop.name}</h4>
                      <span style={{ fontSize: '13px', color: '#888' }}>by {shop.owner}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                    <MapPin size={13} color="#888" />
                    <span style={{ fontSize: '13px', color: '#888' }}>{shop.location}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', margin: '0 0 16px' }}>{shop.description}</p>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {shop.tags.map(tag => (
                      <span key={tag} style={{ fontSize: '11px', fontWeight: '700', color: brandGreen, backgroundColor: '#eff6ef', padding: '4px 10px', borderRadius: '100px' }}>{tag}</span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: deepGreen }}>{shop.totalSales.toLocaleString()}</div>
                        <div style={{ fontSize: '11px', color: '#aaa' }}>Sales</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: deepGreen }}>{shop.totalCustomers}</div>
                        <div style={{ fontSize: '11px', color: '#aaa' }}>Customers</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: brandGreen, color: '#fff', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}>
                      Visit Shop <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer style={{ backgroundColor: deepGreen, color: '#fff', padding: '40px 8%', marginTop: '80px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#a3c2a3' }}>© 2026 Local Vegetable. All rights reserved.</p>
      </footer>
    </div>
  );
}
