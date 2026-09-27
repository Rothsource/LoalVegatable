'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Trash2, ChevronRight, ShoppingBag, ArrowLeft, Plus, Minus, X, Star, Leaf, Box, Calendar, MapPin, Phone, CreditCard, CheckCircle2, ChevronLeft, Navigation, Search, Loader2, ExternalLink, Truck, Bell, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import CustomerOrderTrackingMap from '@/components/CustomerOrderTrackingMap';
import { CircularLoader, CartSkeleton } from '@/components/CustomerSkeleton';
import { supabase } from '@/lib/supabase';
import { isProductExpired } from '@/lib/expiry';


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
const DEFAULT_VEG_IMG = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop';

function normalizeCartProduct(p: any): CartProduct {
  return {
    ...p,
    qty: p.qty ?? 1,
    img: p.img || DEFAULT_VEG_IMG,
    shopAvatar: p.shopAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.shopName || 'Shop')}&background=0DB30D&color=fff&size=50`,
  };
}

function readCart(): CartProduct[] {
  try {
    const raw = localStorage.getItem('cart-products');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    let items: CartProduct[] = [];
    if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
      items = Object.values(parsed as Record<string, CartProduct>)
        .filter((p): p is CartProduct => p !== null && typeof p === 'object' && 'price' in p)
        .map(normalizeCartProduct);
    } else if (Array.isArray(parsed)) {
      items = parsed
        .filter((p): p is CartProduct => p !== null && typeof p === 'object' && 'price' in p)
        .map(normalizeCartProduct);
    }
    const unexpired = items.filter(p => !isProductExpired(p.sellByDate));
    if (unexpired.length !== items.length) {
      writeCart(unexpired);
    }
    return unexpired;
  } catch { return []; }
}

function writeCart(items: CartProduct[]) {
  const obj: Record<number, CartProduct> = {};
  items.forEach(p => { obj[p.id] = p; });
  localStorage.setItem('cart-products', JSON.stringify(obj));
}

// ── Parse lat/lng out of a pasted Google Maps link or raw "lat, lng" ────────
function parseMapsCoords(raw: string): { lat: number; lng: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const plain = trimmed.match(/(-?\d+\.\d+)\s*[,\s]\s*(-?\d+\.\d+)/);
  if (plain) {
    const lat = parseFloat(plain[1]);
    const lng = parseFloat(plain[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }

  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const qMatch = trimmed.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  return null;
}

function matchProvince(addr: any): string | null {
  const candidates = [addr.state, addr.city, addr.county, addr.region].filter(Boolean).map((s: string) => s.toLowerCase());
  for (const p of CAMBODIA_PROVINCES) {
    if (candidates.some(c => c.includes(p.toLowerCase()) || p.toLowerCase().includes(c))) return p;
  }
  return null;
}

function ABAQRCode({ amount }: { amount: number }) {
  const abaKHR = Math.round(amount);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        background: 'linear-gradient(135deg, #004b87 0%, #0066b2 100%)',
        borderRadius: '16px 16px 0 0',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        boxShadow: '0 4px 14px rgba(0,102,178,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#fff', borderRadius: '6px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ color: '#0066b2', fontWeight: '900', fontSize: '13px', letterSpacing: '-0.3px' }}>ABA</span>
          </div>
          <span style={{ color: '#e0f2fe', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>PAYWAY KHQR</span>
        </div>
        <div style={{ fontSize: '11px', background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: '100px', fontWeight: '700' }}>
          Scan & Pay
        </div>
      </div>

      <div style={{
        background: '#fff',
        border: '2px solid #e0f0fe',
        borderTop: 'none',
        borderRadius: '0 0 16px 16px',
        padding: '24px 20px 20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: '190px', height: '190px', margin: '0 auto 18px',
          border: '3px solid #0066b2', borderRadius: '18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#f8fbff', position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,102,178,0.12)',
        }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,14px)', gap: '4px', opacity: 0.65 }}>
            {Array.from({ length: 49 }).map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '2px', background: [0, 1, 2, 6, 7, 13, 14, 42, 43, 44, 45, 46, 48].includes(i) ? '#0066b2' : Math.random() > 0.5 ? '#0066b2' : 'transparent' }} />
            ))}
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#0066b2', fontWeight: '800', letterSpacing: '0.5px' }}>KHQR OFFICIAL</div>
        </div>

        <div style={{ background: '#f0f7ff', borderRadius: '14px', padding: '14px 24px', display: 'inline-block', marginBottom: '8px', border: '1.5px solid #cce0f5' }}>
          <div style={{ fontSize: '11px', color: '#0066b2', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total Amount Due</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0066b2', marginTop: '2px', letterSpacing: '-0.5px' }}>{abaKHR.toLocaleString()} KHR</div>
        </div>

        <p style={{ fontSize: '12px', color: '#64748b', margin: '10px 0 0', lineHeight: '1.5', fontWeight: '600' }}>
          Open ABA Mobile on phone → Tap <strong>"Scan QR"</strong> → Confirm payment in KHR
        </p>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  const steps = [
    { n: 1, label: 'Delivery Details', subtitle: 'Where to deliver' },
    { n: 2, label: 'Distributor Match', subtitle: 'Nearby driver' },
    { n: 3, label: 'Payment', subtitle: 'ABA PayWay' },
    { n: 4, label: 'Live Delivery', subtitle: 'Driver arrival' },
  ];
  return (
    <div style={{
      maxWidth: '740px',
      margin: '0 auto 36px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1.5px solid #edf2ee',
      borderRadius: '24px',
      padding: '16px 24px',
      boxShadow: '0 4px 18px rgba(10, 73, 10, 0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {steps.map((s, i) => {
          const isDone = step > s.n;
          const isCurrent = step === s.n;
          return (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2 }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '800', fontSize: '14px',
                  background: isDone ? '#2d6a4f' : isCurrent ? '#1b4332' : '#f1f5f9',
                  color: isDone || isCurrent ? '#fff' : '#64748b',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(45, 106, 79, 0.15)' : 'none',
                  transition: 'all 0.3s ease',
                  flexShrink: 0,
                }}>
                  {isDone ? <CheckCircle2 size={18} color="#fff" /> : s.n}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: isCurrent ? '#1b4332' : isDone ? '#2d6a4f' : '#64748b', lineHeight: 1.2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                    {s.subtitle}
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: '2px',
                  background: step > s.n ? '#2d6a4f' : '#e2e8f0',
                  margin: '0 10px',
                  transition: 'background 0.3s ease',
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function CartPage() {
  const [cartProducts, setCartProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [flow, setFlow] = useState<'cart' | 'waiting-accept' | 'checkout-delivery' | 'checkout-payment' | 'waiting-delivery' | 'success'>('cart');
  const [activeOrderStatus, setActiveOrderStatus] = useState<'accepted' | 'out_for_delivery' | 'delivered'>('accepted');
  const [arrivedAtTime, setArrivedAtTime] = useState<string | null>(null);
  const [waitingOrderIds, setWaitingOrderIds] = useState<string[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(null);
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  const [savedAddress, setSavedAddress] = useState<{
    id: number; street: string | null; province: string | null;
    phone: string | null; lat: number | null; lng: number | null;
  } | null>(null);
  const [useSaved, setUseSaved] = useState(true);
  const [pickedLat, setPickedLat] = useState<number | null>(null);
  const [pickedLng, setPickedLng] = useState<number | null>(null);

  // NEW — lets the customer choose whether a freshly-entered address becomes
  // their new default for next time. Defaults to checked (most people want
  // their address remembered).
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pickedLabel, setPickedLabel] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAuto, setSearchingAuto] = useState(false);
  const searchDebounceRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [showCoordsBox, setShowCoordsBox] = useState(false);
  const [coordsInput, setCoordsInput] = useState('');
  const [coordsError, setCoordsError] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const items = readCart();
      if (items.length === 0) {
        setCartProducts([]);
        setLoading(false);
        return;
      }
      try {
        const productIds = items.map(p => p.id);
        const { data: dbProducts } = await supabase
          .from('products')
          .select('id, is_active, expire_date')
          .in('id', productIds);

        if (dbProducts) {
          const invalidSet = new Set(
            dbProducts
              .filter(dp => !dp.is_active || isProductExpired(dp.expire_date))
              .map(dp => String(dp.id))
          );
          const validItems = items.filter(i => !invalidSet.has(String(i.id)) && !isProductExpired(i.sellByDate));
          if (validItems.length !== items.length) {
            writeCart(validItems);
          }
          setCartProducts(validItems);
        } else {
          setCartProducts(items);
        }
      } catch {
        setCartProducts(items);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? (await supabase.auth.getUser()).data?.user;
      if (!user) return;
      let { data } = await supabase
        .from('addresses')
        .select('id, street, province, phone, lat, lng')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (!data) {
        const { data: anyAddr } = await supabase
          .from('addresses')
          .select('id, street, province, phone, lat, lng')
          .eq('user_id', user.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();
        data = anyAddr;
      }

      if (data) {
        setSavedAddress(data);
        setProvince(data.province || '');
        setAddress(data.street || '');
        if (data.phone) setPhone(data.phone);
        if (data.lat != null) setPickedLat(data.lat);
        if (data.lng != null) setPickedLng(data.lng);
        setUseSaved(true);
      } else {
        const { data: profile } = await supabase
          .from('profile_users')
          .select('location')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.location) {
          setAddress(profile.location);
        }
        setUseSaved(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (flow !== 'waiting-accept' || waitingOrderIds.length === 0) return;

    let cancelled = false;

    const checkStatuses = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status')
        .in('id', waitingOrderIds);

      if (cancelled) return;

      if (error) {
        console.error('waiting-accept: could not read order status', error);
        setCheckoutError(`Could not check order status: ${error.message}`);
        return;
      }
      if (!data || data.length === 0) {
        console.warn('waiting-accept: no rows returned for', waitingOrderIds, '— check the SELECT RLS policy on orders');
        return;
      }

      const anyCancelled = data.some(o => o.status === 'cancelled');
      if (anyCancelled) { setCheckoutError('A distributor declined your order. Please try again.'); setFlow('cart'); return; }

      const allAccepted = waitingOrderIds.every(
        id => data.find(o => o.id === id)?.status === 'accepted'
      );
      if (allAccepted) setFlow('checkout-payment');
    };

    checkStatuses();

    const channel = supabase
      .channel(`waiting-accept-${waitingOrderIds.join('-')}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (waitingOrderIds.includes((payload.new as any).id)) checkStatuses();
        }
      )
      .subscribe();

    const pollId = setInterval(checkStatuses, 4000);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [flow, waitingOrderIds]);

  // Listen for real-time delivery rider progression and arrival confirmation
  useEffect(() => {
    if (flow !== 'waiting-delivery' || waitingOrderIds.length === 0) return;

    let cancelled = false;

    const checkDeliveryStatus = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, arrived_at, completed_at')
        .in('id', waitingOrderIds);

      if (cancelled || error || !data || data.length === 0) return;

      const latest = data[0];
      if (latest.status === 'delivered' || latest.arrived_at) {
        setActiveOrderStatus('delivered');
        setArrivedAtTime(latest.arrived_at || latest.completed_at || new Date().toISOString());
      } else if (latest.status === 'out_for_delivery' || latest.status === 'delivering') {
        setActiveOrderStatus('out_for_delivery');
      } else if (latest.status === 'accepted') {
        setActiveOrderStatus('accepted');
      }
    };

    checkDeliveryStatus();

    const channel = supabase
      .channel(`waiting-delivery-${waitingOrderIds.join('-')}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          if (waitingOrderIds.includes((payload.new as any).id)) {
            checkDeliveryStatus();
          }
        }
      )
      .subscribe();

    const pollId = setInterval(checkDeliveryStatus, 3500);

    return () => {
      cancelled = true;
      clearInterval(pollId);
      supabase.removeChannel(channel);
    };
  }, [flow, waitingOrderIds]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedProduct(null); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if ((window as any).L) { setMapLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (useSaved || !mapLoaded || !mapRef.current || flow !== 'checkout-delivery') return;
    const L = (window as any).L;
    if (!L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = pickedLat ?? 11.5564;
    const initialLng = pickedLng ?? 104.9282;

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: any) => { placePin(e.latlng.lat, e.latlng.lng); });

    mapInstanceRef.current = map;

    if (pickedLat != null && pickedLng != null) {
      map.setView([pickedLat, pickedLng], 16);
      placePin(pickedLat, pickedLng, true);
    }

    setTimeout(() => map.invalidateSize(), 150);
    const resizeHandler = () => map.invalidateSize();
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSaved, mapLoaded, flow]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getGreenIcon = () => {
    const L = (window as any).L;
    return L.divIcon({
      html: `<div style="width:32px;height:32px;background:#0A490A;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(10,73,10,0.45);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:#0DB30D;border-radius:50%;transform:rotate(45deg);"></div></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  const placePin = async (lat: number, lng: number, silent = false) => {
    const L = (window as any).L;
    if (!mapInstanceRef.current) return;

    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng], { icon: getGreenIcon(), draggable: true })
      .addTo(mapInstanceRef.current);

    markerRef.current.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      placePin(pos.lat, pos.lng);
    });

    setPickedLat(lat);
    setPickedLng(lng);
    setFormErrors(prev => ({ ...prev, address: '' }));

    if (!silent) setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const a = data.address ?? {};
      const parts = [a.house_number, a.road || a.pedestrian, a.village || a.hamlet || a.neighbourhood || a.quarter, a.suburb || a.city_district].filter(Boolean);
      const label = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '';
      setAddress(label);
      setPickedLabel(label);
      const matched = matchProvince(a);
      if (matched) setProvince(matched);
    } catch {
      setPickedLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setShowSuggestions(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!val.trim() || val.length < 3) { setSuggestions([]); return; }

    searchDebounceRef.current = setTimeout(async () => {
      setSearchingAuto(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ' Cambodia')}&format=json&limit=5&accept-language=en`
        );
        const results = await res.json();
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchingAuto(false);
      }
    }, 400);
  };

  const handleSuggestionPick = (s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchQuery(s.display_name.split(',').slice(0, 2).join(','));
    setShowSuggestions(false);
    setSuggestions([]);
    mapInstanceRef.current?.setView([lat, lng], 16);
    placePin(lat, lng);
  };

  const handleOpenGoogleMaps = () => {
    const query = searchQuery.trim()
      ? encodeURIComponent(searchQuery + ' Cambodia')
      : '11.5564,104.9282';
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
    setShowCoordsBox(true);
  };

  const handleCoordsSubmit = () => {
    setCoordsError('');
    const coords = parseMapsCoords(coordsInput);
    if (coords) {
      mapInstanceRef.current?.setView([coords.lat, coords.lng], 17);
      placePin(coords.lat, coords.lng);
      setCoordsInput('');
      setShowCoordsBox(false);
      return;
    }
    setCoordsError('Could not read coordinates. Try: 11.123456, 104.567890');
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 17);
        placePin(latitude, longitude);
        setIsLocating(false);
      },
      () => { setIsLocating(false); }
    );
  };

  const updateQty = (productId: string | number, newQty: number) => {
    if (newQty <= 0) { removeProduct(productId); return; }
    const updated = cartProducts.map(p => {
      if (String(p.id) === String(productId)) {
        const clamped = Math.max(1, Math.min(newQty, p.quantity));
        return { ...p, qty: clamped };
      }
      return p;
    });
    setCartProducts(updated);
    writeCart(updated);
  };

  const removeProduct = (productId: string | number) => {
    const updated = cartProducts.filter(p => String(p.id) !== String(productId));
    setCartProducts(updated);
    writeCart(updated);
    if (selectedProduct && String(selectedProduct.id) === String(productId)) setSelectedProduct(null);
  };

  const clearCart = () => {
    setCartProducts([]);
    localStorage.setItem('cart-products', JSON.stringify({}));
  };

  const validateDelivery = () => {
    const errors: Record<string, string> = {};

    if (useSaved && savedAddress) {
      if (!savedAddress.street || !savedAddress.province) {
        errors.address = 'Saved address is missing details. Please deliver somewhere else.';
      }
      if (!phone.trim() || !/^[0-9+\s\-]{8,15}$/.test(phone.trim())) {
        errors.phone = 'Please enter a valid phone number';
      }
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }

    if (!province) errors.province = 'Please select your province';
    if (!address.trim() || address.trim().length < 3) errors.address = 'Please enter a full delivery address';
    if (!phone.trim() || !/^[0-9+\s\-]{8,15}$/.test(phone.trim())) errors.phone = 'Please enter a valid phone number';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToCheckout = async () => {
    setCheckingOut(true);
    setCheckoutError('');

    const currentItems = readCart();
    if (currentItems.length === 0) {
      setCheckoutError('Your cart is empty or contained expired products.');
      setCheckingOut(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCheckoutError('Please log in before proceeding to checkout.');
      setCheckingOut(false);
      return;
    }

    setCheckingOut(false);
    setFlow('checkout-delivery');
  };

  const handleRequestDistributor = async () => {
    if (!validateDelivery()) return;

    setCheckingOut(true);
    setCheckoutError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCheckoutError('Not logged in. Please sign in to continue.');
      setCheckingOut(false);
      return;
    }

    let addressId: number;

    if (useSaved && savedAddress) {
      addressId = savedAddress.id;
      if (phone.trim() && phone.trim() !== savedAddress.phone) {
        await supabase.from('addresses').update({ phone: phone.trim() }).eq('id', savedAddress.id);
      }
    } else {
      if (saveAsDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }

      const { data: addr, error: addrError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          street: address.trim(),
          province,
          phone: phone.trim(),
          lat: pickedLat,
          lng: pickedLng,
          is_default: saveAsDefault,
        })
        .select('id')
        .single();

      if (addrError || !addr) {
        setCheckoutError(addrError?.message || 'Address save failed. Please check your delivery details.');
        setCheckingOut(false);
        return;
      }
      addressId = addr.id;

      if (saveAsDefault) {
        setSavedAddress({
          id: addr.id,
          street: address.trim(),
          province,
          phone: phone.trim(),
          lat: pickedLat,
          lng: pickedLng,
        });
      }
    }

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          addressId,
          items: cartProducts.map(p => ({
            id: String(p.id),
            name: p.name,
            qty: Math.max(1, p.qty ?? 1),
            price: p.price,
            unit: p.unit,
            shopSlug: p.shopSlug,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setCheckoutError(data.error || 'Failed to place order.');
        setCheckingOut(false);
        return;
      }

      setCheckingOut(false);
      setWaitingOrderIds(data.createdOrderIds);
      setFlow('waiting-accept');
    } catch (err: any) {
      setCheckoutError(err.message || 'Network error placing order.');
      setCheckingOut(false);
    }
  };

  const handleConfirmPayment = async () => {
    setPlacing(true);
    setPlaceError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPlaceError('Not logged in.'); setPlacing(false); return; }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ payment_status: 'paid' })
      .in('id', waitingOrderIds);

    if (updateError) {
      setPlaceError(updateError.message);
      setPlacing(false);
      return;
    }

    clearCart();
    setCartProducts([]);
    setPlacing(false);
    setActiveOrderStatus('accepted');
    setFlow('waiting-delivery');
  };

  const totalQty = cartProducts.reduce((s, p) => s + (p.qty ?? 1), 0);
  const total = cartProducts.reduce((s, p) => s + p.price * (p.qty ?? 1), 0);

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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes radarRipple {
          0% { transform: scale(0.85); opacity: 0.9; }
          60% { opacity: 0.35; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes radarPing {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 1; transform: translateY(0); }
          50% { opacity: 0.85; transform: translateY(-4px); }
        }
        .radar-box {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid rgba(45, 106, 79, 0.32);
          animation: radarRipple 2.6s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
          pointer-events: none;
        }
        .radar-ring:nth-child(2) {
          animation-delay: 0.8s;
        }
        .radar-ring:nth-child(3) {
          animation-delay: 1.6s;
        }
        .radar-core {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(27, 67, 50, 0.22);
          z-index: 2;
          animation: softPulse 2s ease-in-out infinite;
        }
        .checkout-btn { width: 100%; padding: 18px; background: #0A490A; color: #fff; border: none; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
        .checkout-btn:hover { background: #0DB30D; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,179,13,0.3); }
        .checkout-btn:active { transform: scale(0.98); }
        .checkout-btn:disabled { background: #d1d5db; cursor: not-allowed; transform: none; box-shadow: none; }
        .remove-btn { background: #fff5f5; border: none; border-radius: 10px; padding: 10px; cursor: pointer; color: #ef4444; display: flex; align-items: center; justify-content: center; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); flex-shrink: 0; }
        .remove-btn:hover { background: #fee2e2; transform: translateY(-1px); }
        .remove-btn:active { transform: scale(0.94); }
        .qty-stepper { display: inline-flex; align-items: center; border: 2px solid #e5e7eb; border-radius: 10px; overflow: hidden; height: 36px; transition: border-color 0.2s; }
        .qty-btn { width: 34px; height: 36px; display: flex; align-items: center; justify-content: center; background: #f9fafb; border: none; cursor: pointer; transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
        .qty-btn:hover:not(:disabled) { background: #eff6ef; }
        .qty-btn:active:not(:disabled) { transform: scale(0.92); }
        .qty-val { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #111; border-left: 1.5px solid #e5e7eb; border-right: 1.5px solid #e5e7eb; }
        .cart-card { background: #fff; border-radius: 20px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); display: flex; gap: 16px; align-items: flex-start; cursor: pointer; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .cart-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(10,73,10,0.08); }
        .form-input:focus { border-color: #0A490A !important; background: #fff !important; }
        .province-select:focus { border-color: #0A490A !important; outline: none; }
        .pay-confirm-btn { width: 100%; padding: 18px; background: #0066b2; color: #fff; border: none; border-radius: 14px; font-size: 16px; font-weight: 800; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
        .pay-confirm-btn:hover { background: #0052a3; transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,102,178,0.35); }
        .pay-confirm-btn:active { transform: scale(0.98); }
        .leaflet-container { font-family: 'Plus Jakarta Sans', sans-serif !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; font-size: 13px; font-weight: 600; }
        .suggestion-item:hover { background: #f0fdf0 !important; }
        .cart-map-box { height: 220px; }
        .search-row { display: flex; gap: 8px; }
        @media (max-width: 520px) {
          .cart-map-box { height: 170px; }
          .search-row { flex-direction: column; }
          .search-row > button { width: 100%; justify-content: center; }
        }
      `}</style>

      {selectedProduct && (
        <div
          onClick={() => setSelectedProduct(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', maxWidth: '520px', width: '100%', borderRadius: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            <img src={selectedProduct.img || DEFAULT_VEG_IMG} alt={selectedProduct.name}
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '32px 32px 0 0' }}
              onError={e => { (e.target as HTMLImageElement).src = DEFAULT_VEG_IMG; }} />
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
                  <img src={selectedProduct.shopAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.shopName || 'Shop')}&background=0DB30D&color=fff&size=48`} alt=""
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #eff6ef' }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProduct.shopName || 'Shop')}&background=0DB30D&color=fff&size=48`; }} />
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

      <main className="enter-up" style={{ maxWidth: '960px', margin: '0 auto', padding: '50px 5%' }}>
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

        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-4">
              <CircularLoader size={38} label="Loading your basket…" />
            </div>
            <CartSkeleton />
          </div>
        ) : (
          <>
            {flow === 'waiting-accept' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '28px', padding: '40px 32px', boxShadow: '0 16px 48px rgba(15, 23, 42, 0.08)', border: '1.5px solid #e2e8f0', animation: 'fadeUp 0.4s ease', textAlign: 'center' }}>
            <StepIndicator step={2} />

            {/* Refined Radar Search Beacon */}
            <div className="radar-box" style={{ margin: '10px auto 24px' }}>
              <div className="radar-ring" />
              <div className="radar-ring" />
              <div className="radar-ring" />
              <div className="radar-core">
                <Navigation size={28} color="#fff" style={{ transform: 'rotate(-45deg)' }} />
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '6px 16px', borderRadius: '100px', marginBottom: '16px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 0 3px rgba(22,163,74,0.2)' }} />
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Connecting with Nearby Distributor
              </span>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              Matching You with a Local Courier…
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: '0 auto 24px', maxWidth: '480px' }}>
              Your order has been broadcasted to certified local distributors nearby. Once claimed, the ABA PayWay QR payment will unlock automatically right here.
            </p>

            {/* 3-Step Live Dispatch Progress */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '16px 14px', marginBottom: '22px', textAlign: 'left' }}>
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Step 1</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>Order Dispatched</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Broadcast to zone</div>
              </div>
              <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>● Step 2</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>Courier Claim</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Awaiting pickup</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>○ Step 3</div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>ABA QR Unlock</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Instant payment</div>
              </div>
            </div>

            {/* Destination summary card */}
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '18px', padding: '16px 20px', marginBottom: '20px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0', color: '#1e293b' }}>
                <MapPin size={20} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Target Delivery Location
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {address ? `${address}, ${province}` : province}
                </div>
                {phone && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>Contact phone: <strong style={{ color: '#0f172a' }}>{phone}</strong></div>}
              </div>
            </div>

            {/* Live pulsating banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fffbeb', border: '1.5px solid #fef3c7', padding: '12px 18px', borderRadius: '14px', marginBottom: '24px' }}>
              <Loader2 size={16} color="#d97706" style={{ animation: 'spin 1.2s linear infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e' }}>
                Please stay on this page — usually confirmed in 1–3 minutes
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await supabase.rpc('cancel_pending_order', { p_order_id: waitingOrderIds[0] });
                } catch { }
                try {
                  await supabase.from('orders').update({ status: 'cancelled' }).in('id', waitingOrderIds);
                } catch { }
                setWaitingOrderIds([]);
                setFlow('cart');
              }}
              style={{
                padding: '11px 24px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                background: '#fff',
                color: '#64748b',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = '#ef4444';
                el.style.color = '#ef4444';
                el.style.background = '#fff5f5';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.borderColor = '#e2e8f0';
                el.style.color = '#64748b';
                el.style.background = '#fff';
              }}
            >
              Cancel delivery request
            </button>
          </div>
        )}

        {(flow === 'waiting-delivery' || flow === 'success') && (
          <div style={{ maxWidth: '820px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <StepIndicator step={4} />

            <div style={{
              backgroundColor: '#fff',
              borderRadius: '28px',
              padding: '36px 30px',
              boxShadow: '0 12px 40px rgba(10, 73, 10, 0.07)',
              border: '1.5px solid #edf2ee',
              marginBottom: '24px',
            }}>
              {/* Header Status Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1.5px solid #f3f5f0', paddingBottom: '22px', marginBottom: '22px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '5px 14px', borderRadius: '100px',
                      fontSize: '12px', fontWeight: '800',
                      background: activeOrderStatus === 'delivered' ? '#ecfdf5' : activeOrderStatus === 'out_for_delivery' ? '#eff6ef' : '#fefce8',
                      color: activeOrderStatus === 'delivered' ? '#065f46' : activeOrderStatus === 'out_for_delivery' ? deepGreen : '#854d0e',
                      border: `1px solid ${activeOrderStatus === 'delivered' ? '#a7f3d0' : activeOrderStatus === 'out_for_delivery' ? '#cce8cc' : '#fef08a'}`,
                    }}>
                      {activeOrderStatus === 'delivered' ? (
                        <>
                          <CheckCircle2 size={15} color="#059669" />
                          Delivery Arrived & Confirmed
                        </>
                      ) : activeOrderStatus === 'out_for_delivery' ? (
                        <>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0DB30D', animation: 'pulse 1.5s infinite' }} />
                          <Truck size={15} color={deepGreen} />
                          Driver On The Way
                        </>
                      ) : (
                        <>
                          <Loader2 size={15} color="#ca8a04" style={{ animation: 'spin 1.2s linear infinite' }} />
                          Farm Packaging Produce
                        </>
                      )}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#182216' }}>
                      Order #{waitingOrderIds[0]?.slice(0, 8)}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, margin: '8px 0 6px' }}>
                    {activeOrderStatus === 'delivered'
                      ? 'Your Driver Has Arrived!'
                      : activeOrderStatus === 'out_for_delivery'
                      ? 'Vegetables En Route to Your Doorstep'
                      : 'Distributor Confirmed & Packaging Order'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '14px', color: '#556052', maxWidth: '520px', lineHeight: 1.5 }}>
                    {activeOrderStatus === 'delivered'
                      ? `Delivery arrival was confirmed by courier${arrivedAtTime ? ` at ${new Date(arrivedAtTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}. Please check your doorstep or meet your rider.`
                      : activeOrderStatus === 'out_for_delivery'
                      ? 'Your courier has collected your vegetables and is driving to your address. You can trace the live moving delivery pin below in real time.'
                      : 'Payment is confirmed via ABA Bank. The distributor is packing your fresh vegetables. Once the rider departs, the live moving pin will activate below.'}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '11px', fontWeight: '800',
                    padding: '4px 12px', borderRadius: '8px',
                    background: '#eff6ef', color: deepGreen,
                    border: '1px solid #cce8cc',
                    marginBottom: '4px',
                  }}>
                    Paid in Full (ABA KHQR)
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: deepGreen }}>
                    {total.toLocaleString()} KHR
                  </div>
                </div>
              </div>

              {/* Embedded Live Tracking Map */}
              <div style={{ marginBottom: '24px' }}>
                <CustomerOrderTrackingMap
                  orderId={waitingOrderIds[0] || 'active-order'}
                  status={activeOrderStatus}
                  destination={{
                    address: [address, province].filter(Boolean).join(', ') || 'Your delivery location',
                    lat: pickedLat,
                    lng: pickedLng,
                  }}
                  pickup={{
                    label: 'Local Organic Farm Hub',
                    address: 'Cambodia Harvest Depot',
                  }}
                />
              </div>

              {/* Delivery Details Breakdown */}
              <div style={{
                background: '#f9fbf9',
                borderRadius: '18px',
                border: '1.5px solid #e3ede3',
                padding: '18px 22px',
                marginBottom: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                fontSize: '13px',
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#889584', display: 'block', marginBottom: '3px' }}>
                    Delivery Destination
                  </span>
                  <strong style={{ color: '#182216' }}>{address ? `${address}, ` : ''}{province}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#889584', display: 'block', marginBottom: '3px' }}>
                    Recipient Phone
                  </span>
                  <strong style={{ color: '#182216' }}>{phone || 'Saved customer phone'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#889584', display: 'block', marginBottom: '3px' }}>
                    Status Timeline
                  </span>
                  <strong style={{ color: activeOrderStatus === 'delivered' ? '#059669' : deepGreen }}>
                    {activeOrderStatus === 'delivered' ? 'Completed & Handed Over' : 'Waiting for Delivery Driver Arrival'}
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <Link
                  href="/notifications"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '13px 24px', borderRadius: '12px',
                    background: '#eff6ef', color: deepGreen,
                    fontWeight: '800', fontSize: '14px',
                    textDecoration: 'none', border: '1px solid #cce8cc',
                  }}
                >
                  <Bell size={16} /> Track All Orders in Notifications
                </Link>

                <Link
                  href="/shop"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '13px 26px', borderRadius: '12px',
                    background: deepGreen, color: '#fff',
                    fontWeight: '800', fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Continue Shopping <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {flow === 'cart' && cartProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f6f8f3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShoppingBag size={40} color="#889584" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: deepGreen, margin: '0 0 12px' }}>Your basket is empty</h2>
            <p style={{ color: '#888', fontSize: '15px', marginBottom: '32px' }}>Browse shops and add vegetables to get started.</p>
            <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: deepGreen, color: '#fff', padding: '16px 32px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>
              Browse Shops <ChevronRight size={18} />
            </Link>
          </div>
        )}

        {flow === 'cart' && cartProducts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '30px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Delivery Destination Card */}
              <div style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '20px 24px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1.5px solid #edf2ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: '#eff6ef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <MapPin size={22} color={deepGreen} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: brandGreen, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Delivery Destination
                      </span>
                      {useSaved && savedAddress && (
                        <span style={{ fontSize: '10px', background: '#eff6ef', color: deepGreen, padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          Saved Address
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '15px', fontWeight: '800', color: '#111',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px',
                    }}>
                      {address ? `${address}${province ? `, ${province}` : ''}` : 'No delivery location selected yet'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {phone ? `Contact: ${phone}` : 'Select your location so our rider knows where to deliver'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFlow('checkout-delivery')}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: `1.5px solid ${deepGreen}`,
                    background: '#eff6ef',
                    color: deepGreen,
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e2f0e2'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#eff6ef'; }}
                >
                  {address ? 'Change' : '+ Add Location'}
                </button>
              </div>

              {cartProducts.map(product => {
                const itemQty = product.qty ?? 1;
                return (
                  <div key={product.id} className="cart-card" onClick={() => setSelectedProduct(product)}>
                    <img src={product.img || DEFAULT_VEG_IMG} style={{ width: '90px', height: '90px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }} alt={product.name}
                      onError={e => { (e.target as HTMLImageElement).src = DEFAULT_VEG_IMG; }} />
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
                          Harvested: {product.harvestDate}
                        </span>
                        <span style={{ fontSize: '11px', backgroundColor: '#fff5f5', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                          Sell by: {product.sellByDate}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <img src={product.shopAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.shopName || 'Shop')}&background=0DB30D&color=fff&size=18`} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} alt=""
                          onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.shopName || 'Shop')}&background=0DB30D&color=fff&size=18`; }} />
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
                  <span style={{ fontWeight: '700', color: brandGreen }}>Free</span>
                </div>
                <div style={{ height: '1px', backgroundColor: '#f0f0f0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px' }}>
                  <span style={{ fontWeight: '700', color: '#111' }}>Total</span>
                  <span style={{ fontWeight: '800', color: deepGreen }}>{total.toLocaleString()} KHR</span>
                </div>
              </div>

              {/* Delivery destination preview in summary */}
              <div style={{
                backgroundColor: '#f9fdf9',
                border: '1.5px solid #dcf0dc',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <MapPin size={16} color={brandGreen} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase' }}>Deliver To</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: deepGreen, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {address ? `${address}${province ? `, ${province}` : ''}` : 'Location not selected'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFlow('checkout-delivery')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: deepGreen,
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    textDecoration: 'underline',
                    flexShrink: 0,
                  }}
                >
                  {address ? 'Edit' : 'Add'}
                </button>
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
              <button className="checkout-btn" onClick={handleProceedToCheckout} disabled={checkingOut}>
                <ShoppingBag size={18} /> {checkingOut ? 'Checking…' : 'Proceed to Checkout'}
              </button>
              {checkoutError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>{checkoutError}</p>}
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#aaa', marginTop: '14px', lineHeight: '1.5' }}>
                Supporting local Cambodian farmers
              </p>
            </div>
          </div>
        )}

        {flow === 'checkout-delivery' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '36px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <StepIndicator step={1} />

              <h2 style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, margin: '0 0 6px' }}>Delivery Details</h2>
              <p style={{ color: '#888', fontSize: '14px', margin: '0 0 28px' }}>Where should we deliver your vegetables?</p>

              {savedAddress && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: useSaved ? '12px' : 0 }}>
                    <button
                      onClick={() => setUseSaved(true)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                        border: `2px solid ${useSaved ? deepGreen : '#e5e7eb'}`,
                        background: useSaved ? '#f0fdf0' : '#fff',
                        color: useSaved ? deepGreen : '#555', fontWeight: '700', fontSize: '13px',
                      }}
                    >
                      Use my saved address
                    </button>
                    <button
                      onClick={() => setUseSaved(false)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                        border: `2px solid ${!useSaved ? deepGreen : '#e5e7eb'}`,
                        background: !useSaved ? '#f0fdf0' : '#fff',
                        color: !useSaved ? deepGreen : '#555', fontWeight: '700', fontSize: '13px',
                      }}
                    >
                      Deliver somewhere else
                    </button>
                  </div>

                  {useSaved && (
                    <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{savedAddress.province}</div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{savedAddress.street}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', marginTop: '8px', color: savedAddress.lat ? brandGreen : '#d97706' }}>
                        {savedAddress.lat ? 'Map location on file' : 'No exact map pin saved — the delivery map may not show this address precisely'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!useSaved && (
                <>
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

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                      <MapPin size={14} color={deepGreen} /> Delivery Location
                    </label>

                    <div className="search-row" style={{ marginBottom: '10px' }}>
                      <div ref={suggestionsRef} style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                        <Search size={16} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        {searchingAuto && (
                          <Loader2 size={15} color={deepGreen} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />
                        )}
                        <input
                          className="form-input"
                          type="text"
                          value={searchQuery}
                          onChange={e => handleSearchChange(e.target.value)}
                          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                          placeholder="Type a place, building, street…"
                          style={{ ...inputStyle(false), paddingLeft: '38px', paddingRight: '36px' }}
                        />

                        {showSuggestions && suggestions.length > 0 && (
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                            background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999,
                            overflow: 'hidden', maxHeight: '220px', overflowY: 'auto',
                          }}>
                            {suggestions.map((s, i) => {
                              const parts = s.display_name.split(',');
                              const title = parts[0];
                              const subtitle = parts.slice(1, 3).join(',').trim();
                              return (
                                <div
                                  key={i}
                                  className="suggestion-item"
                                  onClick={() => handleSuggestionPick(s)}
                                  style={{
                                    padding: '10px 14px', cursor: 'pointer',
                                    borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                                    background: '#fff', transition: 'background 0.15s',
                                  }}
                                >
                                  <MapPin size={14} color={deepGreen} style={{ flexShrink: 0, marginTop: '2px' }} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{title}</div>
                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{subtitle}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleOpenGoogleMaps}
                        title="Open in Google Maps"
                        style={{
                          padding: '12px 14px', borderRadius: '12px',
                          backgroundColor: deepGreen, color: '#fff',
                          border: 'none', fontWeight: '600', cursor: 'pointer',
                          fontSize: '13px', display: 'flex', alignItems: 'center',
                          gap: '5px', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        <ExternalLink size={14} /> Google Maps
                      </button>
                    </div>

                    {showCoordsBox && (
                      <div style={{
                        marginBottom: '10px', background: '#fffbeb',
                        border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px',
                      }}>
                        <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '800', color: '#92400e' }}>
                          Paste your location from Google Maps
                        </p>
                        <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#a16207', lineHeight: '1.5' }}>
                          In Google Maps: long-press your location → copy the coordinates shown → paste below
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="e.g. 11.123456, 104.567890  or paste Google Maps link"
                            value={coordsInput}
                            onChange={e => { setCoordsInput(e.target.value); setCoordsError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleCoordsSubmit()}
                            style={{ ...inputStyle(false), fontSize: '12px', border: '1px solid #fde68a', background: '#fff', flex: '1 1 180px', minWidth: 0 }}
                          />
                          <button
                            onClick={handleCoordsSubmit}
                            style={{
                              padding: '10px 16px', borderRadius: '10px',
                              background: '#d97706', color: '#fff',
                              border: 'none', fontWeight: '700', cursor: 'pointer',
                              fontSize: '13px', whiteSpace: 'nowrap',
                            }}
                          >
                            Go
                          </button>
                          <button
                            onClick={() => { setShowCoordsBox(false); setCoordsInput(''); setCoordsError(''); }}
                            style={{
                              padding: '10px 12px', borderRadius: '10px',
                              background: '#f3f4f6', color: '#666',
                              border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px',
                            }}
                          >✕</button>
                        </div>
                        {coordsError && (
                          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>{coordsError}</p>
                        )}
                      </div>
                    )}

                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                      <div ref={mapRef} className="cart-map-box" style={{ width: '100%', background: '#eef1ee' }}>
                        {!mapLoaded && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f9f4' }}>
                            <CircularLoader size={36} />
                          </div>
                        )}
                      </div>

                      {isGeocoding && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 1000 }}>
                          <Loader2 size={18} color={deepGreen} style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '13px', fontWeight: '700', color: deepGreen }}>Getting address…</span>
                        </div>
                      )}

                      <button
                        onClick={handleMyLocation}
                        title="Use my current location"
                        style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 900, width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                      >
                        <Navigation size={16} color={deepGreen} fill={isLocating ? deepGreen : 'none'} />
                      </button>
                    </div>

                    <p style={{ fontSize: '12px', color: '#888', fontWeight: '600', margin: '8px 0 0', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MapPin size={11} color={deepGreen} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        {pickedLabel
                          ? (pickedLabel.length > 55 ? pickedLabel.slice(0, 55) + '…' : pickedLabel)
                          : 'Type to search, or click directly on the map'}
                      </span>
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                      <MapPin size={14} color={deepGreen} /> Street Address
                    </label>
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
                </>
              )}

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

              {/* NEW — only relevant when entering a fresh address */}
              {!useSaved && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={e => setSaveAsDefault(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: deepGreen, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>
                    Save this as my default delivery address
                  </span>
                </label>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setFlow('cart')}
                  style={{ flex: 1, padding: '15px', border: '2px solid #e5e7eb', borderRadius: '14px', background: '#fff', fontWeight: '700', fontSize: '15px', color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="checkout-btn"
                  style={{ flex: 2 }}
                  onClick={handleRequestDistributor}
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Notifying distributors…
                    </>
                  ) : (
                    <>
                      Request Distributor <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
              {checkoutError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>{checkoutError}</p>}
            </div>

            <MiniOrderSummary cartProducts={cartProducts} total={total} />
          </div>
        )}

        {flow === 'checkout-payment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '36px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <StepIndicator step={3} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#eff6ef', border: '1.5px solid #cce8cc', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
                <CheckCircle2 size={18} color={brandGreen} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: deepGreen }}>
                  Distributor accepted your request! Complete payment to confirm order.
                </span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: '800', color: deepGreen, margin: '0 0 6px' }}>Pay with ABA Bank</h2>
              <p style={{ color: '#888', fontSize: '14px', margin: '0 0 28px' }}>Scan the QR code with your ABA Mobile app to complete payment.</p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', backgroundColor: '#f0fdf0', border: '1.5px solid #d1fae5', borderRadius: '14px', padding: '14px 18px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <MapPin size={18} color={brandGreen} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: deepGreen }}>
                      {province || 'Delivery Location'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                      {address}
                    </div>
                    {phone && (
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>
                        Contact: {phone}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFlow('checkout-delivery')}
                  style={{
                    background: '#fff', border: '1px solid #c1ecc1', borderRadius: '8px',
                    color: deepGreen, fontWeight: '700', fontSize: '12px', padding: '6px 12px',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  Change
                </button>
              </div>

              <div style={{ border: '2px solid #cce0f5', borderRadius: '20px', padding: '28px', marginBottom: '28px', backgroundColor: '#f8fbff' }}>
                <ABAQRCode amount={total} />
              </div>

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

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setFlow('checkout-delivery')}
                  style={{ flex: 1, padding: '15px', border: '2px solid #e5e7eb', borderRadius: '14px', background: '#fff', fontWeight: '700', fontSize: '15px', color: '#555', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button className="pay-confirm-btn" style={{ flex: 2 }} onClick={handleConfirmPayment} disabled={placing}>
                  <CheckCircle2 size={18} /> {placing ? 'Placing order...' : "I've Paid"}
                </button>
                {placeError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{placeError}</p>}
              </div>
            </div>

            <MiniOrderSummary cartProducts={cartProducts} total={total} />
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

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
              <img src={p.img || DEFAULT_VEG_IMG} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} alt=""
                onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'Produce')}&background=eff6ef&color=0A490A`; }} />
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
        <CheckCircle2 size={14} color={deepGreen} />
        <span style={{ fontSize: '12px', fontWeight: '700', color: deepGreen }}>Free delivery</span>
      </div>
    </div>
  );
}