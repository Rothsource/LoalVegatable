'use client';

import React, { useState, useMemo, use } from 'react';
import { Heart, ShoppingCart, Star, Leaf, Info, X, Trash2, HeartOff, Filter, Plus, ChevronLeft, MapPin, ShieldCheck, Package } from 'lucide-react';

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
  .custom-checkbox {
    width: 20px; height: 20px;
    border: 2px solid #0DB30D;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s;
  }
  .sidebar-overlay {
    position: fixed; top: 0; right: 0; bottom: 0; left: 0;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex; justify-content: flex-end;
  }
  .sidebar-content {
    background: white; width: 400px; height: 100%;
    padding: 30px;
    box-shadow: -10px 0 30px rgba(0,0,0,0.1);
    display: flex; flex-direction: column;
    box-sizing: border-box;
  }
  .info-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px);
    z-index: 2000;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .info-modal-content {
    background: white; max-width: 500px; width: 100%;
    border-radius: 32px; padding: 40px; position: relative;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  }
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0,0,0,0.12) !important;
  }
  .product-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .tag-pill {
    padding: 4px 12px; border-radius: 100px;
    font-size: 12px; font-weight: 700;
    background: #eff6ef; color: #0A490A;
  }
`;

// --- ALL SHOPS DATA ---
const allShops: Shop[] = [
  {
    slug: 'srey-farm',
    name: "Srey's Organic Farm",
    owner: 'Srey Soda',
    location: 'Kandal Province',
    description: 'Family-run organic farm delivering the freshest leafy greens and rich vegetables since 2018. We grow everything naturally, with love and care for the soil.',
    tags: ['Organic', 'Leafy Greens', 'Root Veg'],
    rating: 4.9,
    sales: 1240,
    customers: 320,
    isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=47',
    products: [
      { id: 101, name: 'Organic Carrots', category: 'Root Vegetables', price: 7000, unit: '1 kg', benefit: 'Rich in Beta-carotene for sharp eyesight', description: 'Grown in nutrient-rich soil without synthetic pesticides. Harvested at peak ripeness for maximum crunch and vitamin content.', popularity: 95, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80' },
      { id: 102, name: 'Morning Glory', category: 'Leafy Greens', price: 2500, unit: '1 kg', benefit: 'Rich in Iron & boosts your energy', description: 'Traditional Tra-kuon sourced from local water farms. High in fiber and essential minerals, perfect for your daily stir-fry.', popularity: 90, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80' },
      { id: 103, name: 'Fresh Spinach', category: 'Leafy Greens', price: 3500, unit: '500 g', benefit: 'High in iron & folate for healthy blood', description: 'Tender baby spinach leaves harvested early morning. Ideal for salads, smoothies, or a quick sauté with garlic.', popularity: 80, rating: 4.7, isAvailable: true, img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80' },
      { id: 104, name: 'Sweet Potatoes', category: 'Root Vegetables', price: 5500, unit: '1 kg', benefit: 'Rich in Vitamin A & natural energy', description: 'Orange-fleshed sweet potatoes packed with antioxidants. Naturally sweet, great for roasting, steaming, or soup.', popularity: 75, rating: 4.6, isAvailable: true, img: 'https://assets.cntraveller.in/photos/60ba1fbf591f977adc977875/16:9/w_960,c_limit/2C16FW9.jpg' },
      { id: 105, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4000, unit: '500 g', benefit: 'Packed with Vitamin C for strong immunity', description: 'Sun-ripened tomatoes rich in Lycopene. We verify plant health before harvest to ensure only top-quality produce reaches you.', popularity: 70, rating: 4.2, isAvailable: false, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80' },
      { id: 106, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 3000, unit: '1 kg', benefit: 'High hydration & great for glowing skin', description: '95% water and packed with electrolytes. Grown using sustainable irrigation to maintain crisp texture and cooling properties.', popularity: 85, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80' },
    ]
  },
  {
    slug: 'sokha-leafy',
    name: 'Sokha Leafy Greens',
    owner: 'Sokha Pov',
    location: 'Kampong Cham',
    description: 'Premium leafy greens grown with love in Kampong Cham, picked daily for maximum freshness. Specializing in water vegetables and rare local greens.',
    tags: ['Leafy Greens', 'Morning Glory', 'Spinach'],
    rating: 4.5,
    sales: 1100,
    customers: 290,
    isVerified: true,
    coverImg: 'https://www.worldbank.org/content/dam/Worldbank/Highlights%20&%20Features/EAP/cambodia/cambodia-agr.jpg',
    avatarImg: 'https://i.pravatar.cc/100?img=32',
    products: [
      { id: 201, name: 'Morning Glory', category: 'Leafy Greens', price: 2000, unit: '1 kg', benefit: 'Iron-rich for daily energy boost', description: 'Freshly picked water spinach from Kampong Cham. A Cambodian staple vegetable, best stir-fried with garlic and oyster sauce.', popularity: 95, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80' },
      { id: 202, name: 'Chinese Kale', category: 'Leafy Greens', price: 3000, unit: '500 g', benefit: 'Calcium & Vitamin K for strong bones', description: 'Crisp Chinese broccoli with tender stems and slightly bitter, earthy leaves. Excellent blanched or in stir-fries.', popularity: 88, rating: 4.6, isAvailable: true, img: 'https://media.istockphoto.com/id/1358217289/photo/chinese-kale-vegetable-on-white-background.jpg?s=612x612&w=0&k=20&c=tcoaKxfOx2w0Q7QhXLWmO59wy4yPyVSAB2IwxEPjP_k=' },
      { id: 204, name: 'Fresh Spinach', category: 'Leafy Greens', price: 3500, unit: '500 g', benefit: 'Iron & folate for healthy blood', description: 'Tender baby spinach harvested at dawn for peak freshness. Great raw in salads or lightly wilted.', popularity: 80, rating: 4.5, isAvailable: false, img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80' },
    ]
  },
  {
    slug: 'dara-greens',
    name: "Dara's Green Garden",
    owner: 'Dara Chan',
    location: 'Siem Reap',
    description: 'Specialising in tropical fruit vegetables and fresh herbs grown in the rich soil of Siem Reap. Our produce is famous for its bold flavour.',
    tags: ['Mixed', 'Fruit Veg', 'Herbs'],
    rating: 4.7,
    sales: 980,
    customers: 210,
    isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=21',
    products: [
      { id: 301, name: 'Red Tomatoes', category: 'Fruit Vegetables', price: 4500, unit: '500 g', benefit: 'Lycopene-rich for heart health', description: 'Bold, sun-ripened Siem Reap tomatoes with intense flavour. Perfect for salads, sauces, and fresh eating.', popularity: 90, rating: 4.7, isAvailable: true, img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80' },
      { id: 302, name: 'Fresh Cucumber', category: 'Fruit Vegetables', price: 2800, unit: '1 kg', benefit: 'Hydrating & refreshing for hot days', description: 'Cool, crisp cucumbers from our well-irrigated garden plots. A refreshing snack or salad addition.', popularity: 85, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80' },
      { id: 303, name: 'Long Beans', category: 'Fruit Vegetables', price: 3200, unit: '500 g', benefit: 'High protein & fiber for digestion', description: 'Yard-long beans that are a staple of Khmer cooking. Best in stir-fries with pork, shrimp, or tofu.', popularity: 78, rating: 4.5, isAvailable: true, img: 'https://images.unsplash.com/photo-1587411768638-ec71f8e33b78?auto=format&fit=crop&w=500&q=80' },
    ]
  },
  {
    slug: 'vanna-harvest',
    name: "Vanna's Fresh Harvest",
    owner: 'Vanna Keo',
    location: 'Battambang',
    description: 'From the rice bowl of Cambodia — Battambang — bringing you a wide variety of seasonal vegetables. Known for the best tomatoes and pumpkins in the region.',
    tags: ['Mixed', 'Tomatoes', 'Cucumbers'],
    rating: 4.6,
    sales: 860,
    customers: 195,
    isVerified: false,
    coverImg: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=54',
    products: [
      { id: 401, name: 'Pumpkin', category: 'Fruit Vegetables', price: 5000, unit: '1 kg', benefit: 'Beta-carotene & Vitamin A for immunity', description: 'Dense, sweet Battambang pumpkins famous across Cambodia. Ideal for the classic Khmer pumpkin custard (sankya lapov).', popularity: 92, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=500&q=80' },
      { id: 402, name: 'Cherry Tomatoes', category: 'Fruit Vegetables', price: 6000, unit: '500 g', benefit: 'High Vitamin C & antioxidants', description: 'Tiny, sweet bursts of flavour. Sun-grown in open fields and harvested to order for maximum freshness.', popularity: 85, rating: 4.6, isAvailable: true, img: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=500&q=80' },
      { id: 403, name: 'Eggplant', category: 'Fruit Vegetables', price: 3500, unit: '500 g', benefit: 'Nasunin antioxidant for brain health', description: 'Tender purple eggplants with a mild, creamy flesh when cooked. A classic ingredient in Cambodian fish amok curry.', popularity: 72, rating: 4.3, isAvailable: false, img: 'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg' },
    ]
  },
  {
    slug: 'bopha-roots',
    name: 'Bopha Root Veggies',
    owner: 'Bopha Ros',
    location: 'Phnom Penh',
    description: 'The best root vegetables in Phnom Penh, harvested fresh every morning from our urban farm.',
    tags: ['Root Veg', 'Carrots', 'Potatoes'],
    rating: 4.5,
    sales: 750,
    customers: 180,
    isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=16',
    products: [
      { id: 501, name: 'Organic Carrots', category: 'Root Vegetables', price: 6500, unit: '1 kg', benefit: 'Beta-carotene for sharp eyesight', description: 'Crunchy urban-grown carrots with vibrant colour and sweetness. Pulled fresh each morning from our Phnom Penh plot.', popularity: 93, rating: 4.9, isAvailable: true, img: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80' },
      { id: 502, name: 'White Radish', category: 'Root Vegetables', price: 3000, unit: '1 kg', benefit: 'Digestive enzymes & Vitamin C', description: 'Crisp daikon-style radish great for pickling, soups, or fresh salads. Mild and clean flavoured.', popularity: 75, rating: 4.4, isAvailable: true, img: 'https://growhoss.com/cdn/shop/products/white-icicle-radish.jpg?v=1691781923' },
      { id: 503, name: 'Sweet Potatoes', category: 'Root Vegetables', price: 5500, unit: '1 kg', benefit: 'Rich in Vitamin A & slow-release energy', description: 'Creamy orange flesh with natural sweetness. Best roasted, mashed, or turned into Cambodian sweet potato dessert.', popularity: 80, rating: 4.6, isAvailable: true, img: 'https://images.ctfassets.net/0dkgxhks0leg/RKiZ605RAV8kjDQnxFCWP/b03b8729817c90b29b88d536bfd37ac5/9-Unusual-Uses-For-Potatoes.jpg' },
    ]
  },
  {
    slug: 'rith-urban',
    name: 'Rith Urban Farm',
    owner: 'Rith Nak',
    location: 'Phnom Penh',
    description: 'A modern hydroponic urban farm in the heart of Phnom Penh, growing pesticide-free vegetables year-round using cutting-edge controlled-environment agriculture.',
    tags: ['Organic', 'Urban', 'Hydroponic'],
    rating: 4.3,
    sales: 520,
    customers: 130,
    isVerified: true,
    coverImg: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
    avatarImg: 'https://i.pravatar.cc/100?img=8',
    products: [
      { id: 601, name: 'Hydroponic Lettuce', category: 'Leafy Greens', price: 8000, unit: '300 g', benefit: 'Zero pesticides, maximum nutrition', description: 'Grown in our controlled indoor hydroponic system with LED lighting and pH-balanced nutrient water. Crisp, clean, and ready to eat.', popularity: 88, rating: 4.8, isAvailable: true, img: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=500&q=80' },
      { id: 603, name: 'Baby Bok Choy', category: 'Leafy Greens', price: 6500, unit: '400 g', benefit: 'Calcium & Vitamin C for bone health', description: 'Miniature bok choy with tender stalks and mild, sweet leaves. A perfect premium ingredient for stir-fries and ramen.', popularity: 76, rating: 4.5, isAvailable: false, img: 'https://images.squarespace-cdn.com/content/v1/5d96d524052c897425394aaf/1736951245568-2RF8M9E0PYIJQBT3IQQX/bok-choy-vs-baby-bok-choy.jpeg?format=1500w' },
    ]
  }
];

const brandGreen = '#0DB30D';
const deepGreen = '#0A490A';
const surfaceWhite = '#ffffff';

export default function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const shop = allShops.find(s => s.slug === id) || allShops[0];

  const categories = useMemo(() => {
    const cats = [...new Set(shop.products.map(p => p.category))];
    return ['All', ...cats];
  }, [shop]);

  const [sortBy, setSortBy] = useState('Most Popular');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavOpen, setIsFavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const addToCart = (product: Product) => setCartItems(prev => [...prev, product]);
  const removeFromCart = (index: number) => setCartItems(prev => prev.filter((_, i) => i !== index));

  const processedProducts = useMemo(() => {
    let list = [...shop.products];
    if (selectedCategory !== 'All') list = list.filter(p => p.category === selectedCategory);
    if (showOnlyAvailable) list = list.filter(p => p.isAvailable);
    switch (sortBy) {
      case 'Price: Low to High': return list.sort((a, b) => a.price - b.price);
      case 'Price: High to Low': return list.sort((a, b) => b.price - a.price);
      case 'Top Rated': return list.sort((a, b) => b.rating - a.rating);
      default: return list.sort((a, b) => b.popularity - a.popularity);
    }
  }, [sortBy, selectedCategory, showOnlyAvailable, shop]);

  const favProducts = shop.products.filter(p => favorites.includes(p.id));

  // Sidebar
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
            ) : items.map((item: any, idx: number) => (
              <div key={`${item.id}-${idx}`} style={{ display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                <img src={item.img} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: '0 0 5px 0', fontSize: '15px' }}>{item.name}</h5>
                  <p style={{ margin: 0, color: brandGreen, fontWeight: '700', fontSize: '14px' }}>{item.price.toLocaleString()} KHR</p>
                </div>
                {type === 'cart'
                  ? <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => removeFromCart(idx)} />
                  : <HeartOff size={18} color="#ef4444" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => toggleFavorite(item.id)} />
                }
              </div>
            ))}
          </div>
          {type === 'cart' && items.length > 0 && (
            <div style={{ paddingTop: '20px', paddingBottom: '10px' }}>
              <button style={{ width: '100%', padding: '16px', backgroundColor: brandGreen, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>
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

      {/* Info Modal */}
      {selectedProduct && (
        <div className="info-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="info-modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '25px', right: '25px', border: 'none', background: '#f5f5f5', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}>
              <X size={20} color="#333" />
            </button>
            <img src={selectedProduct.img} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '20px', marginBottom: '24px' }} alt="" />
            <span style={{ color: brandGreen, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>{selectedProduct.category}</span>
            <h3 style={{ fontSize: '28px', fontWeight: '800', color: deepGreen, margin: '8px 0' }}>{selectedProduct.name}</h3>
            <p style={{ color: '#666', lineHeight: '1.6', fontSize: '15px', marginBottom: '24px' }}>{selectedProduct.description}</p>
            <div style={{ backgroundColor: '#eff6ef', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Leaf color={brandGreen} size={24} />
              <div>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: deepGreen }}>Health Highlights</span>
                <span style={{ fontSize: '14px', color: '#444' }}>{selectedProduct.benefit}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Your Basket" items={cartItems} type="cart" />
      <Sidebar isOpen={isFavOpen} onClose={() => setIsFavOpen(false)} title="Your Favorites" items={favProducts} type="favorites" />

      {/* Nav */}
      <nav style={{ padding: '20px 8%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: surfaceWhite, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ color: deepGreen, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', margin: 0 }}>LOCAL VEGETABLE</h1>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '25px' }}>
            {['Home', 'About Us', 'Shop'].map(item => (
              <a key={item} href={`/${item === 'Home' ? '' : item.toLowerCase().replace(' ', '-')}`} style={{ textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px' }}>{item}</a>
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

        {/* Back */}
        <a href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#666', fontWeight: '600', fontSize: '14px', marginBottom: '30px' }}>
          <ChevronLeft size={16} /> Back to Shops
        </a>

        {/* Shop Header */}
        <div style={{ borderRadius: '32px', backgroundColor: surfaceWhite, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '50px', overflow: 'hidden' }}>
          {/* Cover image with avatar pinned inside at bottom-left */}
          <div style={{ position: 'relative', height: '280px' }}>
            <img src={shop.coverImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6))' }} />
            {/* Avatar fully inside cover, no clipping */}
            <img
              src={shop.avatarImg}
              style={{ position: 'absolute', bottom: '20px', left: '40px', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover', backgroundColor: '#e5e7eb' }}
              alt={shop.owner}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.owner)}&background=0DB30D&color=fff&size=80`;
              }}
            />
            {/* Stats pinned inside cover at bottom-right */}
            <div style={{ position: 'absolute', bottom: '20px', right: '40px', display: 'flex', gap: '30px' }}>
              {[
                { label: 'Sales', value: shop.sales.toLocaleString() },
                { label: 'Customers', value: shop.customers.toLocaleString() },
                { label: 'Rating', value: `⭐ ${shop.rating}` },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '600' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info below cover — no avatar overlap, no clipping issues */}
          <div style={{ padding: '24px 40px 36px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: deepGreen }}>{shop.name}</h2>
              {shop.isVerified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#eff6ef', color: brandGreen, fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '100px' }}>
                  <ShieldCheck size={13} /> Verified
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '14px', marginBottom: '16px' }}>
              <MapPin size={14} />
              <span>{shop.location}</span>
              <span style={{ marginLeft: '8px', color: '#ccc' }}>·</span>
              <span style={{ marginLeft: '8px' }}>by {shop.owner}</span>
            </div>
            <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.7', maxWidth: '700px', margin: '0 0 20px 0' }}>{shop.description}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {shop.tags.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
            </div>
          </div>
        </div>

        {/* Product Controls */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color={brandGreen} />
                Products
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#999', marginLeft: '4px' }}>({shop.products.length} items)</span>
              </h3>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Fresh from {shop.location}, harvested with care.</p>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div onClick={() => setShowOnlyAvailable(!showOnlyAvailable)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <div className="custom-checkbox" style={{ backgroundColor: showOnlyAvailable ? brandGreen : 'transparent' }}>
                  {showOnlyAvailable && <Plus size={14} color="white" style={{ transform: 'rotate(45deg)' }} />}
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#444' }}>Available Only</span>
              </div>
              <div style={{ padding: '10px 20px', border: '1px solid #eee', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={16} color="#999" />
                <select style={{ border: 'none', fontWeight: '700', outline: 'none', fontSize: '13px', cursor: 'pointer' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option>Most Popular</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Top Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', backgroundColor: selectedCategory === cat ? brandGreen : '#fff', color: selectedCategory === cat ? '#fff' : '#666', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {processedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <p style={{ fontSize: '18px', fontWeight: '600' }}>No products match your filters.</p>
          </div>
        ) : (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px', marginBottom: '80px' }}>
            {processedProducts.map(veg => (
              <div key={veg.id} className="product-card" style={{ borderRadius: '24px', backgroundColor: surfaceWhite, position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <button onClick={() => toggleFavorite(veg.id)} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, backgroundColor: surfaceWhite, border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Heart size={20} fill={favorites.includes(veg.id) ? "#ef4444" : "none"} color={favorites.includes(veg.id) ? "#ef4444" : "#333"} />
                </button>
                <img src={veg.img} style={{ width: '100%', height: '240px', objectFit: 'cover' }} alt={veg.name} />
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: brandGreen }}>{veg.category}</span>
                      <h4 style={{ margin: '4px 0', fontSize: '20px', fontWeight: '700' }}>{veg.name}</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbeb', padding: '4px 8px', borderRadius: '8px' }}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>{veg.rating}</span>
                      </div>
                      <button onClick={() => setSelectedProduct(veg)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '8px', padding: '6px', cursor: 'pointer' }} title="View Information">
                        <Info size={18} color="#666" />
                      </button>
                    </div>
                  </div>
                  <div style={{ color: deepGreen, fontWeight: '800', fontSize: '20px', marginTop: '15px' }}>
                    {veg.price.toLocaleString()} KHR <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: '400' }}>/ {veg.unit}</span>
                  </div>
                  <div style={{ marginTop: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Leaf size={14} color={brandGreen} />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: deepGreen }}>{veg.benefit}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.5' }}>{veg.description}</p>
                  </div>
                  <button disabled={!veg.isAvailable} onClick={() => addToCart(veg)} style={{ width: '100%', backgroundColor: veg.isAvailable ? brandGreen : '#f3f4f6', color: veg.isAvailable ? '#fff' : '#9ca3af', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '700', cursor: veg.isAvailable ? 'pointer' : 'not-allowed', fontSize: '15px' }}>
                    {veg.isAvailable ? 'Add to Basket' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
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
