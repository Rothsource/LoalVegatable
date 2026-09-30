'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Loader2, ExternalLink, Pencil, LogOut } from 'lucide-react';
import { PageSkeleton, CircularLoader } from '@/components/CustomerSkeleton';
import { supabase } from '@/lib/supabase';

// ── Same design tokens as the rest of the app ──
const leaf = '#2E6F40';
const sprout = '#6FAE5C';
const carrot = '#E08D3C';
const paper = '#FBF8F2';
const soil = '#3B2B20';

type Alert = { type: 'success' | 'error' | 'warning'; message: string } | null;

interface KhmerAddress {
  phum: string;
  khum: string;
  srok: string;
  khett: string;
  lat: number | null;
  lng: number | null;
}

export default function ProfilePage() {
  // ── Loaded account state ──
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentLocation, setCurrentLocation] = useState(''); // saved, joined string
  const [alert, setAlert] = useState<Alert>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ── Location editor — only shown/active if the user chooses to change it ──
  const [editingLocation, setEditingLocation] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [khmerAddr, setKhmerAddr] = useState<KhmerAddress>({
    phum: '', khum: '', srok: '', khett: '', lat: null, lng: null,
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pickedLabel, setPickedLabel] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
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

  // ── Load current account + profile on mount ──
  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) {
          setLoading(false);
          window.location.href = '/auth/login?redirectTo=/auth/profile';
        }
        return;
      }
      if (!active) return;

      setUserId(user.id);
      setEmail(user.email ?? '');

      const { data: profile } = await supabase
        .from('profile_users')
        .select('first_name, last_name, location')
        .eq('id', user.id)
        .maybeSingle();

      if (!active) return;

      setFirstName(profile?.first_name ?? '');
      setLastName(profile?.last_name ?? '');
      setCurrentLocation(profile?.location ?? '');
      setLoading(false);
    }

    loadAccount();
    return () => { active = false; };
  }, []);

  // ── Load Leaflet only once the location editor is opened ──
  useEffect(() => {
    if (!editingLocation) return;
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
  }, [editingLocation]);

  // ── Init map once loaded + editor open ──
  useEffect(() => {
    if (!editingLocation || !mapLoaded || !mapRef.current || mapInstanceRef.current) return;
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
    setTimeout(() => map.invalidateSize(), 100);
    const resizeHandler = () => map.invalidateSize();
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [editingLocation, mapLoaded]);

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
      html: `<div style="width:32px;height:32px;background:${leaf};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(46,111,64,0.45);display:flex;align-items:center;justify-content:center;"><div style="width:10px;height:10px;background:${sprout};border-radius:50%;transform:rotate(45deg);"></div></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  };

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
    const raw = coordsInput.trim();
    if (!raw) return;

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

  // ── Save everything ──
  async function handleSave() {
    setSaving(true);
    setAlert(null);

    try {
      if (password && password.length < 8) {
        setAlert({ type: 'error', message: 'New password must be at least 8 characters.' });
        setSaving(false);
        return;
      }

      // Only rebuild the location string if the user actually edited it and picked a spot
      let nextLocation = currentLocation;
      if (editingLocation && (khmerAddr.phum || khmerAddr.khum || khmerAddr.srok || khmerAddr.khett)) {
        nextLocation = [
          houseNumber, streetNumber,
          khmerAddr.phum, khmerAddr.khum, khmerAddr.srok, khmerAddr.khett,
        ].filter(Boolean).join(', ');
      }

      const { error: profileError } = await supabase
        .from('profile_users')
        .upsert({ id: userId, first_name: firstName, last_name: lastName, location: nextLocation });

      if (profileError) throw profileError;

      // Also save as the customer's default address, so checkout can find it
      // (customer/app/cart/page.tsx reads addresses where is_default = true).
      // No unique constraint on user_id, so check-then-write instead of upsert.
      if (editingLocation && khmerAddr.lat != null && khmerAddr.lng != null) {
        const streetCombined = [houseNumber, streetNumber, khmerAddr.phum, khmerAddr.khum, khmerAddr.srok]
          .filter(Boolean)
          .join(', ');

        const { data: existingAddr } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', userId)
          .eq('is_default', true)
          .maybeSingle();

        if (existingAddr) {
          await supabase
            .from('addresses')
            .update({
              street: streetCombined,
              province: khmerAddr.khett,
              lat: khmerAddr.lat,
              lng: khmerAddr.lng,
            })
            .eq('id', existingAddr.id);
        } else {
          await supabase
            .from('addresses')
            .insert({
              user_id: userId,
              street: streetCombined,
              province: khmerAddr.khett,
              lat: khmerAddr.lat,
              lng: khmerAddr.lng,
              is_default: true,
            });
        }
      }

      // Auth fields — only send what actually changed
      const authUpdate: { email?: string; password?: string } = {};
      const { data: { user } } = await supabase.auth.getUser();
      if (email && email !== user?.email) authUpdate.email = email;
      if (password) authUpdate.password = password;

      let emailChangePending = false;
      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdate);
        if (authError) throw authError;
        if (authUpdate.email) emailChangePending = true;
      }

      setCurrentLocation(nextLocation);
      setEditingLocation(false);
      setPassword('');

      setAlert({
        type: emailChangePending ? 'warning' : 'success',
        message: emailChangePending
          ? 'Profile updated. Check your new email inbox to confirm the change.'
          : 'Profile updated successfully.',
      });
    } catch (err) {
      setAlert({ type: 'error', message: err instanceof Error ? err.message : 'Could not update profile.' });
    } finally {
      setSaving(false);
    }
  }

  // ── Logout ──
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setAlert(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/auth/login';
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not log out. Please try again.',
      });
      setLoggingOut(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid #e4dccb', outline: 'none', fontSize: '14px',
    fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '8px', color: soil,
    fontWeight: '600', fontSize: '13px',
  };
  const khmerInputStyle: React.CSSProperties = {
    ...inputStyle, fontSize: '13px',
    border: `1px solid ${sprout}55`, padding: '10px 12px',
  };
  const khmerLabelStyle: React.CSSProperties = {
    ...labelStyle, fontSize: '12px', color: leaf,
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: paper, padding: '40px 0' }}>
        <div className="flex justify-center pb-4">
          <CircularLoader size={42} />
        </div>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="enter-up" style={{ minHeight: '100vh', backgroundColor: paper, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .profile-veg-heading { font-family: 'Fraunces', serif; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-container { font-family: Inter, sans-serif !important; }
        .suggestion-item:hover { background: #eef3ea !important; }
        .profile-card { background: #fff; border-radius: 20px; border: 1px solid #ece5d8; padding: 32px; }
        .profile-map-box { height: 220px; }
        .khmer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .profile-save-btn { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .profile-save-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(59,43,32,0.2); }
        .profile-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 12px;
          background: #ffffff;
          border: 1.5px solid #ecd8d5;
          color: #b33a2e;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .profile-logout-btn:hover:not(:disabled) {
          background: #fdf2f0;
          border-color: #e5b8b2;
          color: #96281e;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(179,58,46,0.12);
        }
        .profile-bottom-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          background: #fdf5f4;
          border: 1px solid #f5cfc9;
          color: #b33a2e;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .profile-bottom-logout-btn:hover:not(:disabled) {
          background: #fce8e6;
          border-color: #e8aba2;
          color: #8f2319;
        }
        .profile-logout-btn:disabled, .profile-bottom-logout-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 640px) {
          .khmer-grid { grid-template-columns: 1fr; }
          .profile-card { padding: 22px; }
          .profile-logout-btn { width: 100%; justify-content: center; margin-top: 4px; }
        }
      `}</style>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '56px 5% 80px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="profile-veg-heading" style={{ fontSize: '30px', fontWeight: '700', color: soil, margin: '0 0 6px' }}>
              Your profile
            </h1>
            <p style={{ color: '#6b6155', margin: 0, fontSize: '14.5px' }}>
              Update your name, delivery location, and account details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="profile-logout-btn"
            title="Log out of your account"
          >
            {loggingOut ? <Loader2 size={15} className="spin-icon" /> : <LogOut size={15} />}
            <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
          </button>
        </div>

        {alert && (
          <div style={{
            marginBottom: '20px', padding: '14px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
            backgroundColor: alert.type === 'success' ? '#eef3ea' : alert.type === 'warning' ? '#fdf3e3' : '#fdeceb',
            color: alert.type === 'success' ? leaf : alert.type === 'warning' ? '#92600e' : '#b33a2e',
            border: `1px solid ${alert.type === 'success' ? '#d9e8d2' : alert.type === 'warning' ? '#f5dfb8' : '#f3cdc7'}`,
          }}>
            {alert.message}
          </div>
        )}

        <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>First name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} placeholder="Pothy" />
            </div>
            <div>
              <label style={labelStyle}>Last name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} placeholder="Sea" />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} color={leaf} /> Delivery location
            </label>

            {!editingLocation ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '12px 14px', border: '1px solid #e4dccb', borderRadius: '10px', background: '#fdfbf7' }}>
                <span style={{ fontSize: '13.5px', color: soil, fontWeight: '600' }}>
                  {currentLocation || 'No location saved yet'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingLocation(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, background: '#fff', border: `1.5px solid ${leaf}`, color: leaf, fontWeight: '700', fontSize: '12.5px', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Pencil size={12} /> Change
                </button>
              </div>
            ) : (
              <div style={{ border: `1.5px solid ${sprout}`, borderRadius: '14px', padding: '16px', background: '#f7faf5' }}>

                {/* Search row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <div ref={suggestionsRef} style={{ flex: '1 1 200px', position: 'relative', minWidth: 0 }}>
                    <Search size={15} color="#9a8e7f" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    {searchingAuto && (
                      <Loader2 size={14} color={leaf} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />
                    )}
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Type a place, building, street…"
                      style={{ ...inputStyle, paddingLeft: '36px', paddingRight: '32px' }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #e4dccb', borderRadius: '12px', boxShadow: '0 8px 24px rgba(59,43,32,0.12)', zIndex: 999, overflow: 'hidden', maxHeight: '200px', overflowY: 'auto' }}>
                        {suggestions.map((s, i) => {
                          const parts = s.display_name.split(',');
                          return (
                            <div key={i} className="suggestion-item" onClick={() => handleSuggestionPick(s)}
                              style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid #f0ede4' : 'none', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <MapPin size={13} color={leaf} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '12.5px', fontWeight: '700', color: soil }}>{parts[0]}</div>
                                <div style={{ fontSize: '11px', color: '#9a8e7f', marginTop: '2px' }}>{parts.slice(1, 3).join(',').trim()}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={handleOpenGoogleMaps}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '11px 14px', borderRadius: '10px', background: soil, color: '#fff', border: 'none', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <ExternalLink size={13} /> Google Maps
                  </button>
                </div>

                {showCoordsBox && (
                  <div style={{ marginBottom: '12px', background: '#fdf3e3', border: '1.5px solid #f5dfb8', borderRadius: '10px', padding: '12px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '11.5px', color: '#92600e', fontWeight: '700' }}>
                      Paste coordinates or a Google Maps link
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <input type="text" placeholder="e.g. 11.123456, 104.567890" value={coordsInput}
                        onChange={e => { setCoordsInput(e.target.value); setCoordsError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleCoordsSubmit()}
                        style={{ ...inputStyle, fontSize: '12px', flex: '1 1 160px', minWidth: 0 }} />
                      <button type="button" onClick={handleCoordsSubmit}
                        style={{ padding: '9px 14px', borderRadius: '8px', background: carrot, color: '#fff', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                        Go
                      </button>
                    </div>
                    {coordsError && <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#b33a2e', fontWeight: '600' }}>{coordsError}</p>}
                  </div>
                )}

                {/* Map */}
                <div style={{ border: '1px solid #e4dccb', borderRadius: '12px', overflow: 'hidden', position: 'relative', marginBottom: '10px' }}>
                  <div ref={mapRef} className="profile-map-box" style={{ width: '100%', background: '#eef1ee' }}>
                    {!mapLoaded && (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CircularLoader size={34} />
                      </div>
                    )}
                  </div>
                  {isGeocoding && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={16} color={leaf} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: leaf }}>Getting address…</span>
                    </div>
                  )}
                  <button type="button" onClick={handleMyLocation}
                    style={{ position: 'absolute', bottom: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%', background: '#fff', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Navigation size={14} color={leaf} fill={isLocating ? leaf : 'none'} />
                  </button>
                </div>

                <p style={{ fontSize: '11.5px', color: '#8a7d6f', fontWeight: '600', margin: '0 0 12px' }}>
                  {pickedLabel ? pickedLabel : 'Type to search, or click on the map to drop a pin'}
                </p>

                <div className="khmer-grid">
                  <div>
                    <label style={khmerLabelStyle}>House No.</label>
                    <input type="text" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} style={khmerInputStyle} placeholder="e.g. #123" />
                  </div>
                  <div>
                    <label style={khmerLabelStyle}>Street No.</label>
                    <input type="text" value={streetNumber} onChange={e => setStreetNumber(e.target.value)} style={khmerInputStyle} placeholder="e.g. St 271" />
                  </div>
                  <div>
                    <label style={khmerLabelStyle}>Village</label>
                    <input type="text" value={khmerAddr.phum} onChange={e => setKhmerAddr(p => ({ ...p, phum: e.target.value }))} style={khmerInputStyle} />
                  </div>
                  <div>
                    <label style={khmerLabelStyle}>Sangkat / Commune</label>
                    <input type="text" value={khmerAddr.khum} onChange={e => setKhmerAddr(p => ({ ...p, khum: e.target.value }))} style={khmerInputStyle} />
                  </div>
                  <div>
                    <label style={khmerLabelStyle}>District</label>
                    <input type="text" value={khmerAddr.srok} onChange={e => setKhmerAddr(p => ({ ...p, srok: e.target.value }))} style={khmerInputStyle} />
                  </div>
                  <div>
                    <label style={khmerLabelStyle}>Province / City</label>
                    <input type="text" value={khmerAddr.khett} onChange={e => setKhmerAddr(p => ({ ...p, khett: e.target.value }))} style={khmerInputStyle} />
                  </div>
                </div>

                <button type="button" onClick={() => setEditingLocation(false)}
                  style={{ marginTop: '12px', background: 'none', border: 'none', color: '#8a7d6f', fontWeight: '600', fontSize: '12.5px', cursor: 'pointer', padding: 0 }}>
                  Cancel location change
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>New password</label>
            <input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Leave blank to keep current password" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="profile-save-btn"
            style={{ width: '100%', padding: '15px', borderRadius: '12px', backgroundColor: soil, color: '#fff', border: 'none', fontWeight: '700', fontSize: '15px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>

          {/* Account session & sign out */}
          <div style={{
            marginTop: '8px',
            paddingTop: '20px',
            borderTop: '1px solid #f0ede4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: soil }}>
                Signed in
              </div>
              <div style={{ fontSize: '12.5px', color: '#7a6f62', marginTop: '2px', wordBreak: 'break-all' }}>
                {email || 'Customer account'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="profile-bottom-logout-btn"
            >
              {loggingOut ? <Loader2 size={14} className="spin-icon" /> : <LogOut size={14} />}
              <span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}