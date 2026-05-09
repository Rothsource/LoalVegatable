'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UserInfoPage() {
  const router = useRouter();
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

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    const location = [houseNumber, streetNumber].filter(Boolean).join(', ');

    const { error } = await supabase
      .from('profile_users')
      .upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        location: location,
      });

    if (favVeg) {
      const vegNames = favVeg.split(',').map(v => v.trim()).filter(Boolean);
      const products = await supabase
        .from('products')
        .select('id, name')
        .in('name', vegNames);

      if (products.data && products.data.length > 0) {
        await supabase.from('favourite_vegetables').insert(
          products.data.map(p => ({ user_id: user.id, product_id: p.id }))
        );
      }
    }

    if (error) { setError(error.message); setLoading(false); return; }

    router.push('/shop');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', fontFamily: 'Inter, sans-serif', backgroundColor: '#fdfdfb' }}>
      <div style={{ width: '50%', padding: '40px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#1a1a1a', letterSpacing: '-1px' }}>Complete your profile</h1>
          <p style={{ color: '#666', marginBottom: '24px', fontSize: '15px' }}>Help us get your fresh vegetables delivered to the right place.</p>

          {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Last Name</label>
                <input type="text" placeholder="Sea" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>First Name</label>
                <input type="text" placeholder="Pothy" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Favorite Vegetable</label>
              <input type="text" placeholder="e.g. Bok Choy, Morning Glory" value={favVeg} onChange={(e) => setFavVeg(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Search Landmark</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={18} color="#999" style={{ position: 'absolute', left: '12px' }} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search building or gas station..." style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', fontSize: '14px' }} />
                </div>
                <button onClick={() => setIsLocating(true)} style={{ padding: '12px 20px', borderRadius: '10px', backgroundColor: '#f0f0f0', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Find</button>
              </div>
            </div>

            <div style={{ border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: '150px', backgroundColor: '#eee', backgroundImage: 'url("https://www.google.com/maps/vt/pb=!1m4!1m3!1i14!2i13511!3i7912!2m3!1e0!2sm!3i633190242!3m8!2sen!3skh!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e4!23i4111425")', backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'crosshair' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', color: '#2e7d32', zIndex: 2 }}>
                  <MapPin size={34} fill="#2e7d32" stroke="#fff" strokeWidth={1.5} />
                </div>
                <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                  <button onClick={() => setIsLocating(true)} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Navigation size={18} color="#2e7d32" fill={isLocating ? '#2e7d32' : 'none'} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>House Number (Optional)</label>
                <input type="text" placeholder="e.g. #123" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Street Number (Optional)</label>
                <input type="text" placeholder="e.g. St 271" value={streetNumber} onChange={(e) => setStreetNumber(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#444', fontWeight: '600', fontSize: '14px' }}>Note for Rider (Optional)</label>
              <textarea placeholder="e.g. Gate is green, call when you arrive" value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none', height: '60px', resize: 'none', fontSize: '14px' }} />
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Confirm & Start Shopping'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ width: '50%', backgroundImage: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
    </div>
  );
}