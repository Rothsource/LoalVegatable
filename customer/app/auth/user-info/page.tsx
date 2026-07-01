'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Search, Loader2, ExternalLink, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Cambodian address state ───────────────────────────────────────────────────
interface KhmerAddress {
  phum: string;
  khum: string;
  srok: string;
  khett: string;
  lat: number | null;
  lng: number | null;
}

export default function UserInfoPage() {
  const router = useRouter();

  // ── ALL ORIGINAL STATE — UNCHANGED ───────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [favVeg, setFavVeg] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Map + Cambodian address state ─────────────────────────────────────────
  const [khmerAddr, setKhmerAddr] = useState<KhmerAddress>({
    phum: '', khum: '', srok: '', khett: '', lat: null, lng: null,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pickedLabel, setPickedLabel] = useState('');

  // ── Autocomplete suggestions ──────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAuto, setSearchingAuto] = useState(false);
  const searchDebounceRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ── Paste coords (from Google Maps) ──────────────────────────────────────
  const [showCoordsBox, setShowCoordsBox] = useState(false);
  const [coordsInput, setCoordsInput] = useState('');
  const [coordsError, setCoordsError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // ── Load Leaflet ──────────────────────────────────────────────────────────
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

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = (window as any).L;

    const map = L.map(mapRef.current, {
      center: [11.5564, 104.9282],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: any) => { placePin(e.latlng.lat, e.latlng.lng); });

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [mapLoaded]);

  // ── Close suggestions when clicking outside ───────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Green teardrop pin ────────────────────────────────────────────────────
  const getGreenIcon = () => {
    const L = (window as any).L;
    return L.divIcon({
      html: `<div style="width:32px;height:32px;background:#2e7d32;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(46,125,50,0.45);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:#66bb6a;border-radius:50%;transform:rotate(45deg);"></div></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

  // ── Place pin + reverse geocode ───────────────────────────────────────────
  const placePin = async (lat: number, lng: number) => {
    const L = (window as any).L;
    if (!mapInstanceRef.current) return;

    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng], { icon: getGreenIcon(), draggable: true })
      .addTo(mapInstanceRef.current);

    markerRef.current.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      placePin(pos.lat, pos.lng);
    });

    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      parseAndFill(data, lat, lng);
    } catch {
      setPickedLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // ── Parse Nominatim → Cambodian fields ───────────────────────────────────
  const parseAndFill = (data: any, lat: number, lng: number) => {
    const a = data.address ?? {};
    const phum  = a.village || a.hamlet || a.neighbourhood || a.quarter || '';
    const khum  = a.suburb  || a.city_district || a.municipality || a.town || '';
    const srok  = a.district || a.county || '';
    const khett = a.state   || a.province || a.city || '';

    if (a.house_number) setHouseNumber(a.house_number);
    if (a.road || a.pedestrian) setStreetNumber(a.road || a.pedestrian || '');

    setKhmerAddr({ phum, khum, srok, khett, lat, lng });
    const label = [phum, khum, srok, khett].filter(Boolean).join(', ');
    setPickedLabel(label || data.display_name?.split(',').slice(0, 3).join(',') || '');
  };

  // ── Autocomplete: fetch suggestions as user types ─────────────────────────
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

  // ── Pick a suggestion → move map + fill fields ────────────────────────────
  const handleSuggestionPick = (s: any) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchQuery(s.display_name.split(',').slice(0, 2).join(','));
    setShowSuggestions(false);
    setSuggestions([]);
    mapInstanceRef.current?.setView([lat, lng], 16);
    placePin(lat, lng);
  };

  // ── Open Google Maps for reference ───────────────────────────────────────
  const handleOpenGoogleMaps = () => {
    const query = searchQuery.trim()
      ? encodeURIComponent(searchQuery + ' Cambodia')
      : '11.5564,104.9282';
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
    // Show the coords paste box after opening Google Maps
    setShowCoordsBox(true);
  };

  // ── Parse pasted coords from Google Maps ─────────────────────────────────
  // Google Maps share link format: maps.google.com/...@11.1234,104.5678,...
  // Or user copies coords like "11.123456, 104.567890"
  const handleCoordsSubmit = () => {
    setCoordsError('');
    const raw = coordsInput.trim();
    if (!raw) return;

    // Try "lat, lng" format (plain numbers)
    const plain = raw.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    if (plain) {
      const lat = parseFloat(plain[1]);
      const lng = parseFloat(plain[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        mapInstanceRef.current?.setView([lat, lng], 17);
        placePin(lat, lng);
        setCoordsInput('');
        setShowCoordsBox(false);
        return;
      }
    }

    // Try Google Maps URL format: @11.1234,104.5678
    const urlMatch = raw.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (urlMatch) {
      const lat = parseFloat(urlMatch[1]);
      const lng = parseFloat(urlMatch[2]);
      mapInstanceRef.current?.setView([lat, lng], 17);
      placePin(lat, lng);
      setCoordsInput('');
      setShowCoordsBox(false);
      return;
    }

    setCoordsError('Could not read coordinates. Try: 11.123456, 104.567890');
  };

  // ── GPS location ──────────────────────────────────────────────────────────
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

  // ── ORIGINAL handleSubmit — BACKEND UNCHANGED ────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const locationParts = [
      houseNumber, streetNumber,
      khmerAddr.phum, khmerAddr.khum, khmerAddr.srok, khmerAddr.khett,
    ].filter(Boolean);
    const location = locationParts.join(', ');

    const { error } = await supabase
      .from('profile_users')
      .upsert({ id: user.id, first_name: firstName, last_name: lastName, location });

    if (favVeg) {
      const vegNames = favVeg.split(',').map(v => v.trim()).filter(Boolean);
      const products = await supabase.from('products').select('id, name').in('name', vegNames);
      if (products.data && products.data.length > 0) {
        await supabase.from('favourite_vegetables').insert(
          products.data.map(p => ({ user_id: user.id, product_id: p.id }))
        );
      }
    }

    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/');
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid #e0e0e0', outline: 'none', fontSize: '14px',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '8px', color: '#444',
    fontWeight: '600', fontSize: '14px',
  };
  const khmerInputStyle: React.CSSProperties = {
    ...inputStyle, fontSize: '13px',
    border: '1px solid #bbf7d0', background: '#fff', padding: '10px 12px',
  };
  const khmerLabelStyle: React.CSSProperties = {
    ...labelStyle, fontSize: '12px', color: '#166534',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Inter, sans-serif', backgroundColor: '#fdfdfb' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-container { font-family: Inter, sans-serif !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; font-size: 13px; font-weight: 600; }
        .suggestion-item:hover { background: #f0fdf4 !important; }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{ width: '50%', padding: '40px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>

          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a', letterSpacing: '-1px' }}>Complete your profile</h1>
          <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>Help us get your fresh vegetables delivered to the right place.</p>

          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Name fields — UNCHANGED */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input type="text" placeholder="Sea" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>First Name</label>
                <input type="text" placeholder="Pothy" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Favourite vegetable — UNCHANGED */}
            <div>
              <label style={labelStyle}>Favorite Vegetable</label>
              <input type="text" placeholder="e.g. Bok Choy, Morning Glory" value={favVeg} onChange={e => setFavVeg(e.target.value)} style={inputStyle} />
            </div>

            {/* ── SEARCH with autocomplete dropdown ── */}
            <div>
              <label style={labelStyle}>Search Landmark</label>

              {/* Search input + buttons row */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div ref={suggestionsRef} style={{ flex: 1, position: 'relative' }}>
                  <Search size={16} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  {searchingAuto && (
                    <Loader2 size={15} color="#2e7d32" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />
                  )}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Type a place, building, street…"
                    style={{ ...inputStyle, paddingLeft: '38px', paddingRight: '36px' }}
                  />

                  {/* Dropdown suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: '12px',
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
                            <MapPin size={14} color="#2e7d32" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{title}</div>
                              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{subtitle}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Open Google Maps button */}
                <button
                  onClick={handleOpenGoogleMaps}
                  title="Open in Google Maps"
                  style={{
                    padding: '12px 14px', borderRadius: '10px',
                    backgroundColor: '#2e7d32', color: '#fff',
                    border: 'none', fontWeight: '600', cursor: 'pointer',
                    fontSize: '13px', display: 'flex', alignItems: 'center',
                    gap: '5px', whiteSpace: 'nowrap',
                  }}
                >
                  <ExternalLink size={14} /> Google Maps
                </button>
              </div>

              {/* ── Paste coords box — appears after Google Maps is opened ── */}
              {showCoordsBox && (
                <div style={{
                  marginTop: '10px', background: '#fffbeb',
                  border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px',
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: '800', color: '#92400e' }}>
                    📋 Paste your location from Google Maps
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#a16207', lineHeight: '1.5' }}>
                    In Google Maps: long-press your location → copy the coordinates shown → paste below
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. 11.123456, 104.567890  or paste Google Maps link"
                      value={coordsInput}
                      onChange={e => { setCoordsInput(e.target.value); setCoordsError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleCoordsSubmit()}
                      style={{ ...inputStyle, fontSize: '12px', border: '1px solid #fde68a', background: '#fff', flex: 1 }}
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
                      ✓ Go
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
            </div>

            {/* ── MAP ── */}
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} color="#2e7d32" /> Delivery Location
              </label>

              <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                <div ref={mapRef} style={{ height: '200px', width: '100%', background: '#eef1ee' }}>
                  {!mapLoaded && (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf0' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px' }}>🗺️</div>
                        <p style={{ fontSize: '13px', color: '#2e7d32', fontWeight: '600', margin: '6px 0 0' }}>Loading map…</p>
                      </div>
                    </div>
                  )}
                </div>

                {isGeocoding && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 1000 }}>
                    <Loader2 size={18} color="#2e7d32" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2e7d32' }}>Getting address…</span>
                  </div>
                )}

                <button
                  onClick={handleMyLocation}
                  title="Use my current location"
                  style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 900, width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                >
                  <Navigation size={16} color="#2e7d32" fill={isLocating ? '#2e7d32' : 'none'} />
                </button>
              </div>

              <p style={{ fontSize: '12px', color: '#888', fontWeight: '600', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} color="#2e7d32" />
                {pickedLabel
                  ? `📍 ${pickedLabel.length > 55 ? pickedLabel.slice(0, 55) + '…' : pickedLabel}`
                  : 'Type to search, or click directly on the map'}
              </p>
            </div>

            {/* ── Cambodian address fields ── */}
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📍 {khmerAddr.phum || khmerAddr.khum ? 'Cambodian Address (auto-filled)' : 'Cambodian Address — click map to auto-fill'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={khmerLabelStyle}>លេខផ្ទះ (House No.) Optional</label>
                  <input type="text" placeholder="e.g. #123" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} style={khmerInputStyle} />
                </div>
                <div>
                  <label style={khmerLabelStyle}>លេខផ្លូវ (Street No.) Optional</label>
                  <input type="text" placeholder="e.g. St 271" value={streetNumber} onChange={e => setStreetNumber(e.target.value)} style={khmerInputStyle} />
                </div>
                <div>
                  <label style={khmerLabelStyle}>ភូមិ (Village)</label>
                  <input type="text" value={khmerAddr.phum} onChange={e => setKhmerAddr(p => ({ ...p, phum: e.target.value }))} placeholder="ភូមិ" style={khmerInputStyle} />
                </div>
                <div>
                  <label style={khmerLabelStyle}>ឃុំ/សង្កាត់ (Sangkat)</label>
                  <input type="text" value={khmerAddr.khum} onChange={e => setKhmerAddr(p => ({ ...p, khum: e.target.value }))} placeholder="ឃុំ/សង្កាត់" style={khmerInputStyle} />
                </div>
                <div>
                  <label style={khmerLabelStyle}>ស្រុក/ខណ្ឌ (District)</label>
                  <input type="text" value={khmerAddr.srok} onChange={e => setKhmerAddr(p => ({ ...p, srok: e.target.value }))} placeholder="ស្រុក/ខណ្ឌ" style={khmerInputStyle} />
                </div>
                <div>
                  <label style={khmerLabelStyle}>ខេត្ត/រាជធានី (Province)</label>
                  <input type="text" value={khmerAddr.khett} onChange={e => setKhmerAddr(p => ({ ...p, khett: e.target.value }))} placeholder="ខេត្ត/រាជធានី" style={khmerInputStyle} />
                </div>
              </div>
            </div>

            {/* Note for rider — UNCHANGED */}
            <div>
              <label style={labelStyle}>Note for Rider (Optional)</label>
              <textarea placeholder="e.g. Gate is green, call when you arrive" value={note} onChange={e => setNote(e.target.value)} style={{ ...inputStyle, height: '60px', resize: 'none' }} />
            </div>

            {/* Submit — UNCHANGED */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Saving...' : 'Confirm & Start Shopping'}
            </button>

          </div>
        </div>
      </div>

      {/* RIGHT PANEL — UNCHANGED */}
      <div style={{ width: '50%', backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
    </div>
  );
}
