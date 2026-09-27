'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface DeliveryMapProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const DEFAULT_LAT = 11.5564; // Phnom Penh center
const DEFAULT_LNG = 104.9282;
const DEFAULT_ZOOM = 13;

export default function DeliveryMap({ onAddressSelect, initialLat, initialLng }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pickedAddress, setPickedAddress] = useState('');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    // Guard: container already has a Leaflet map attached (Strict Mode re-run)
    if ((mapRef.current as any)._leaflet_id) return;

    let cancelled = false;

    // Dynamically import Leaflet (avoids SSR issues in Next.js)
    import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;
      // Re-check after the async import resolves — the DOM node may have
      // already been claimed by a map created in an earlier effect run.
      if ((mapRef.current as any)._leaflet_id) return;

      // Fix default icon URLs broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const startLat = initialLat ?? DEFAULT_LAT;
      const startLng = initialLng ?? DEFAULT_LNG;

      // Create map
      const map = L.map(mapRef.current!, {
        center: [startLat, startLng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      // OpenStreetMap tiles — completely free
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom green pin icon matching your brand
      const greenIcon = L.divIcon({
        html: `
          <div style="
            width: 32px; height: 32px;
            background: #0A490A;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid #fff;
            box-shadow: 0 4px 12px rgba(10,73,10,0.4);
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="
              width: 10px; height: 10px;
              background: #0DB30D;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -36],
      });

      // If initial position provided, add a marker
      if (initialLat && initialLng) {
        markerRef.current = L.marker([initialLat, initialLng], { icon: greenIcon }).addTo(map);
      }

      // Click handler — drop pin and reverse geocode
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;

        // Remove old marker
        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Add new marker
        markerRef.current = L.marker([lat, lng], { icon: greenIcon })
          .addTo(map)
          .bindPopup('Fetching address...')
          .openPopup();

        setIsLoading(true);

        try {
          // Nominatim reverse geocoding — free, no API key needed
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();

          // Build a clean address string from the response
          const addr = data.address ?? {};
          const parts = [
            addr.house_number,
            addr.road || addr.pedestrian || addr.footway,
            addr.village || addr.suburb || addr.neighbourhood || addr.quarter,
            addr.city_district || addr.district,
          ].filter(Boolean);

          const formatted = parts.length > 0
            ? parts.join(', ')
            : data.display_name?.split(',').slice(0, 3).join(',').trim() ?? '';

          setPickedAddress(formatted);
          markerRef.current?.setPopupContent(formatted || 'Location selected');

          // Pass address + coords up to parent
          onAddressSelect(formatted, lat, lng);
        } catch {
          const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setPickedAddress(fallback);
          markerRef.current?.setPopupContent('Location selected');
          onAddressSelect(fallback, lat, lng);
        } finally {
          setIsLoading(false);
        }
      });

      leafletMapRef.current = map;
      setMapReady(true);
    });

    // Cleanup on unmount
    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      {/* Hint text */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '12px', color: '#6b7280', fontWeight: '600',
        marginBottom: '8px',
      }}>
        <MapPin size={13} color="#0DB30D" />
        Click anywhere on the map to set your delivery location
      </div>

      {/* Map container */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
        <div
          ref={mapRef}
          style={{ height: '260px', width: '100%' }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, gap: '8px',
            fontSize: '13px', fontWeight: '700', color: '#0A490A',
          }}>
            <Loader2 size={18} color="#0DB30D" style={{ animation: 'spin 1s linear infinite' }} />
            Getting address…
          </div>
        )}
      </div>

      {/* Picked address preview */}
      {pickedAddress && (
        <div style={{
          marginTop: '8px',
          display: 'flex', alignItems: 'flex-start', gap: '8px',
          backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0',
          borderRadius: '10px', padding: '10px 14px',
        }}>
          <MapPin size={14} color="#0DB30D" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534', lineHeight: '1.5' }}>
            {pickedAddress}
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-container { font-family: 'Plus Jakarta Sans', sans-serif !important; }
        .leaflet-popup-content-wrapper { border-radius: 12px !important; font-weight: 600; font-size: 13px; }
      `}</style>
    </div>
  );
}