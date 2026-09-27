'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Compass,
  MapPin,
  Navigation,
  ExternalLink,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  Pause,
} from 'lucide-react';

const CAMBODIA_PROVINCES: Record<string, { latitude: number; longitude: number }> = {
  'phnom penh': { latitude: 11.5564, longitude: 104.9282 },
  'kandal': { latitude: 11.4589, longitude: 104.9575 },
  'siem reap': { latitude: 13.3671, longitude: 103.8448 },
  'battambang': { latitude: 13.0957, longitude: 103.2022 },
  'kampot': { latitude: 10.6104, longitude: 104.1815 },
  'preah sihanouk': { latitude: 10.6275, longitude: 103.5221 },
  'sihanoukville': { latitude: 10.6275, longitude: 103.5221 },
  'kampong cham': { latitude: 11.9934, longitude: 105.4635 },
  'kampong chhnang': { latitude: 12.25, longitude: 104.6667 },
  'kampong speu': { latitude: 11.4533, longitude: 104.5209 },
  'kampong thom': { latitude: 12.7111, longitude: 104.8887 },
  'kep': { latitude: 10.4828, longitude: 104.2949 },
  'koh kong': { latitude: 11.6153, longitude: 102.9838 },
  'kratie': { latitude: 12.4881, longitude: 106.0188 },
  'mondulkiri': { latitude: 12.4558, longitude: 107.1881 },
  'oddar meanchey': { latitude: 14.1751, longitude: 103.5176 },
  'pailin': { latitude: 12.8489, longitude: 102.6093 },
  'preah vihear': { latitude: 13.8073, longitude: 104.9814 },
  'prey veng': { latitude: 11.4851, longitude: 105.3253 },
  'pursat': { latitude: 12.5388, longitude: 103.9192 },
  'ratanakiri': { latitude: 13.7394, longitude: 106.9873 },
  'stung treng': { latitude: 13.5259, longitude: 105.9683 },
  'svay rieng': { latitude: 11.0879, longitude: 105.7994 },
  'takeo': { latitude: 10.9908, longitude: 104.785 },
  'tboung khmum': { latitude: 11.9366, longitude: 105.656 },
};

function resolveFallbackCoords(address: string): { latitude: number; longitude: number } {
  const lower = (address || '').toLowerCase();
  for (const [name, coords] of Object.entries(CAMBODIA_PROVINCES)) {
    if (lower.includes(name)) {
      return coords;
    }
  }
  return { latitude: 11.5564, longitude: 104.9282 };
}

function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface CustomerOrderTrackingMapProps {
  orderId: string;
  status: string;
  destination: {
    address: string;
    lat?: number | null;
    lng?: number | null;
  };
  pickup?: {
    label?: string;
    address?: string;
    lat?: number | null;
    lng?: number | null;
  };
  compact?: boolean;
}

export default function CustomerOrderTrackingMap({
  orderId,
  status,
  destination,
  pickup,
  compact = false,
}: CustomerOrderTrackingMapProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);
  const timersRef = useRef<number[]>([]);
  const simIntervalRef = useRef<number | null>(null);

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [resolvedDest, setResolvedDest] = useState<{ latitude: number; longitude: number } | null>(
    destination.lat && destination.lng
      ? { latitude: Number(destination.lat), longitude: Number(destination.lng) }
      : null
  );

  const isDelivering = status === 'out_for_delivery' || status === 'delivering';
  const isDelivered = status === 'delivered';

  // Rider position state along the route
  const [riderCoords, setRiderCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [simProgress, setSimProgress] = useState<number>(isDelivered ? 1 : 0.25);

  const addTimer = (id: number) => {
    timersRef.current.push(id);
    return id;
  };

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  // 1. Resolve Destination Coordinates
  useEffect(() => {
    if (destination.lat && destination.lng) {
      setResolvedDest({ latitude: Number(destination.lat), longitude: Number(destination.lng) });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const query = [destination.address, 'Cambodia'].filter(Boolean).join(', ');
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    })
      .then((res) => res.json())
      .then((results) => {
        clearTimeout(timeout);
        if (cancelled) return;
        if (Array.isArray(results) && results.length > 0 && results[0].lat && results[0].lon) {
          setResolvedDest({
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
          });
        } else {
          setResolvedDest(resolveFallbackCoords(destination.address));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedDest(resolveFallbackCoords(destination.address));
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [destination.address, destination.lat, destination.lng]);

  // Compute resolved pickup coordinates
  const resolvedPickup = React.useMemo(() => {
    if (pickup?.lat && pickup?.lng) {
      return { latitude: Number(pickup.lat), longitude: Number(pickup.lng) };
    }
    if (resolvedDest) {
      // Offset ~3.5 km northwest of destination to represent the local farm/hub
      return {
        latitude: resolvedDest.latitude + 0.024,
        longitude: resolvedDest.longitude - 0.028,
      };
    }
    return { latitude: 11.578, longitude: 104.912 };
  }, [pickup, resolvedDest]);

  // 2. Initialize and render Leaflet Map
  useEffect(() => {
    if (!resolvedDest || !mapNode.current) return;

    let cancelled = false;

    // Dynamically inject Leaflet CSS if not already in document
    if (typeof document !== 'undefined' && !document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet')
      .then((module) => {
        if (cancelled || !mapNode.current) return;
        const L = module.default;
        leafletModuleRef.current = L;

        // Clean up any stale map instance
        if (mapInstance.current) {
          try {
            const old = mapInstance.current;
            old.stop();
            old.off();
            old.remove();
          } catch {}
          mapInstance.current = null;
        }

        if ((mapNode.current as any)?._leaflet_id) {
          try {
            delete (mapNode.current as any)._leaflet_id;
          } catch {}
        }

        const destLat = resolvedDest.latitude;
        const destLng = resolvedDest.longitude;
        const pickLat = resolvedPickup.latitude;
        const pickLng = resolvedPickup.longitude;

        const map = L.map(mapNode.current, {
          center: [destLat, destLng],
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        // OpenStreetMap carto tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const courierInitialLat = pickLat - 0.010;
        const courierInitialLng = pickLng - 0.009;

        // 1. Destination Marker (Green Customer Doorstep Pin)
        const destIcon = L.divIcon({
          className: 'customer-dest-pin',
          html: `
            <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:40px;height:40px;border-radius:50% 50% 50% 0;background:#1b4332;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(27,67,50,0.4);transform:rotate(-45deg);"></div>
              <div style="position:relative;z-index:2;width:12px;height:12px;border-radius:50%;background:#ddb892;border:2px solid #ffffff;"></div>
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 40],
          popupAnchor: [0, -38],
        });

        const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
        destMarker.bindPopup(`
          <div style="padding:6px;font-family:system-ui,sans-serif;font-size:13px;color:#182216;">
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#1b4332;margin-bottom:3px;">Stop 3 • Delivery Address</div>
            <strong style="font-size:14px;color:#1b4332;">Your Doorstep</strong>
            <p style="margin:4px 0 0 0;color:#556052;font-size:12px;line-height:1.4;">${destination.address}</p>
          </div>
        `);

        // 2. Pickup Marker (Saddle Brown Farm / Distributor Pin)
        const pickupIcon = L.divIcon({
          className: 'farm-pickup-pin',
          html: `
            <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:38px;height:38px;border-radius:50% 50% 50% 0;background:#4a3525;border:3px solid #ffffff;box-shadow:0 8px 20px rgba(74,53,37,0.35);transform:rotate(-45deg);"></div>
              <div style="position:relative;z-index:2;width:10px;height:10px;border-radius:50%;background:#ddb892;border:1.5px solid #ffffff;"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 38],
          popupAnchor: [0, -36],
        });

        const pickupMarker = L.marker([pickLat, pickLng], { icon: pickupIcon }).addTo(map);
        pickupMarker.bindPopup(`
          <div style="padding:6px;font-family:system-ui,sans-serif;font-size:13px;color:#182216;">
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#935626;margin-bottom:3px;">Stop 2 • Farm / Hub</div>
            <strong style="font-size:14px;color:#4a3525;">${pickup?.label || 'Local Vegetable Farm & Hub'}</strong>
            <p style="margin:4px 0 0 0;color:#556052;font-size:12px;line-height:1.4;">${pickup?.address || 'Fresh Harvest Center'}</p>
          </div>
        `);

        // Leg 1: Courier -> Pickup (Brown dashed route)
        L.polyline(
          [
            [courierInitialLat, courierInitialLng],
            [pickLat, pickLng],
          ],
          {
            color: '#935626',
            weight: 3.5,
            opacity: 0.85,
            dashArray: '6, 8',
          }
        ).addTo(map);

        // Leg 2: Pickup -> Consumer Destination (Deep Green route)
        L.polyline(
          [
            [pickLat, pickLng],
            [destLat, destLng],
          ],
          {
            color: '#1b4332',
            weight: 4,
            opacity: 0.9,
            dashArray: '8, 6',
          }
        ).addTo(map);

        // Fit all 3 pins inside camera view
        try {
          const bounds = L.latLngBounds([
            [courierInitialLat, courierInitialLng],
            [pickLat, pickLng],
            [destLat, destLng],
          ]);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: false });
        } catch {}

        mapInstance.current = map;
        setState('ready');

        // Safe invalidate size
        const safeInvalidate = () => {
          if (cancelled || !mapInstance.current) return;
          const currentMap = mapInstance.current;
          if (!currentMap._mapPane || !currentMap.getContainer()) return;
          try {
            currentMap.invalidateSize();
          } catch {}
        };

        addTimer(window.setTimeout(safeInvalidate, 100));
        addTimer(window.setTimeout(safeInvalidate, 400));
      })
      .catch((err) => {
        console.error('Customer map load error:', err);
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
      clearAllTimers();
      if (mapInstance.current) {
        try {
          const map = mapInstance.current;
          map.stop();
          map.off();
          map.remove();
        } catch {}
        mapInstance.current = null;
      }
      riderMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, [resolvedDest, resolvedPickup, destination.address, pickup]);

  // 3. Live Rider Pin Movement & Tracking along route
  useEffect(() => {
    if (!resolvedDest || !resolvedPickup) return;

    const startLat = resolvedPickup.latitude;
    const startLng = resolvedPickup.longitude;
    const endLat = resolvedDest.latitude;
    const endLng = resolvedDest.longitude;

    if (isDelivered) {
      setRiderCoords({ latitude: endLat, longitude: endLng });
      setSimProgress(1);
      return;
    }

    if (!isDelivering) {
      // At farm / preparing phase
      setRiderCoords({ latitude: startLat, longitude: startLng });
      setSimProgress(0);
      return;
    }

    // When Out for Delivery: animate smooth real-time rider progression
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    let progress = simProgress >= 0.95 ? 0.2 : simProgress;

    const interval = window.setInterval(() => {
      if (!isLiveActive) return;
      progress += 0.035;
      if (progress >= 1) {
        progress = 1;
        clearInterval(interval);
      }
      setSimProgress(progress);

      const curLat = startLat + (endLat - startLat) * progress;
      const curLng = startLng + (endLng - startLng) * progress;
      setRiderCoords({ latitude: curLat, longitude: curLng });
    }, 1800);

    simIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
    };
  }, [resolvedDest, resolvedPickup, isDelivering, isDelivered, isLiveActive]);

  // 4. Update the Rider Marker on the Map
  useEffect(() => {
    if (!mapInstance.current || !riderCoords || !leafletModuleRef.current || !resolvedDest) return;
    const map = mapInstance.current;
    if (!map._mapPane) return;

    const L = leafletModuleRef.current;
    const { latitude, longitude } = riderCoords;

    // Vibrant Delivery Rider Icon with live radar pulsing waves
    const riderIcon = L.divIcon({
      className: 'live-rider-pin',
      html: `
        <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(13,179,13,0.35);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative;width:34px;height:34px;border-radius:50%;background:#0A490A;border:3px solid #ffffff;box-shadow:0 8px 22px rgba(10,73,10,0.45);display:flex;align-items:center;justify-content:center;color:#0DB30D;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
      popupAnchor: [0, -24],
    });

    if (!riderMarkerRef.current) {
      const marker = L.marker([latitude, longitude], { icon: riderIcon, zIndexOffset: 1200 }).addTo(map);
      marker.bindPopup(`
        <div style="padding:6px;font-family:system-ui,sans-serif;font-size:13px;color:#182216;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#0DB30D;margin-bottom:3px;">Live Delivery Driver</div>
          <strong style="font-size:14px;color:#182216;">Your Rider is on the way!</strong>
          <p style="margin:4px 0 0 0;color:#556052;font-size:12px;line-height:1.4;">Heading towards your doorstep</p>
        </div>
      `);
      riderMarkerRef.current = marker;
    } else {
      riderMarkerRef.current.setLatLng([latitude, longitude]);
    }

    // Active route segment connecting Rider -> Customer
    if (!routeLineRef.current) {
      const activeLine = L.polyline(
        [
          [latitude, longitude],
          [resolvedDest.latitude, resolvedDest.longitude],
        ],
        {
          color: '#0DB30D',
          weight: 4.5,
          opacity: 0.95,
          dashArray: '8, 6',
        }
      ).addTo(map);
      routeLineRef.current = activeLine;
    } else {
      routeLineRef.current.setLatLngs([
        [latitude, longitude],
        [resolvedDest.latitude, resolvedDest.longitude],
      ]);
    }
  }, [riderCoords, resolvedDest]);

  // Recenter map button
  const recenter = useCallback(() => {
    if (!mapInstance.current || !(mapInstance.current as any)._mapPane) return;
    const target = riderCoords ?? resolvedDest;
    if (!target) return;
    try {
      mapInstance.current.setView([target.latitude, target.longitude], 15, { animate: true });
    } catch {}
  }, [riderCoords, resolvedDest]);

  const remainingDistance =
    riderCoords && resolvedDest
      ? computeDistanceKm(riderCoords.latitude, riderCoords.longitude, resolvedDest.latitude, resolvedDest.longitude)
      : null;

  const etaMinutes = remainingDistance ? Math.max(3, Math.round((remainingDistance / 22) * 60) + 3) : 12;

  const navUrl = resolvedDest
    ? `https://www.google.com/maps/dir/?api=1&destination=${resolvedDest.latitude},${resolvedDest.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.address)}`;

  return (
    <div
      style={{
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1.5px solid #edf0ea',
        background: '#fff',
        boxShadow: '0 6px 24px rgba(10,73,10,0.06)',
      }}
    >
      {/* Map Header Status Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          background: isDelivered ? '#ecfdf5' : isDelivering ? '#eff6ef' : '#fcfdfa',
          borderBottom: '1px solid #edf0ea',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDelivered ? (
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          ) : isDelivering ? (
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#dcfce7', color: '#0A490A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} />
            </div>
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: isDelivered ? '#059669' : isDelivering ? '#0A490A' : '#b45309' }}>
                {isDelivered ? 'Order Delivered' : isDelivering ? 'Live Delivery Tracking' : 'Distributor Confirmed'}
              </span>
              {isDelivering && (
                <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: '#0DB30D', animation: 'pulse 1.5s infinite' }} />
              )}
            </div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#182216' }}>
              {isDelivered
                ? 'Produce successfully delivered to your doorstep'
                : isDelivering
                ? `Rider is on the road — arriving in ~${etaMinutes} mins`
                : 'Vegetables are packaged and awaiting courier departure'}
            </h4>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDelivering && (
            <button
              type="button"
              onClick={() => setIsLiveActive((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                background: isLiveActive ? '#eff6ef' : '#fff',
                border: '1px solid #cce8cc',
                color: '#0A490A',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            >
              {isLiveActive ? <Pause size={12} /> : <Play size={12} />}
              <span>{isLiveActive ? 'Live Active' : 'Paused'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={recenter}
            title="Recenter on delivery route"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700',
              background: '#fff',
              border: '1px solid #dfe6d9',
              color: '#182216',
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          >
            <Compass size={13} color="#0A490A" />
            <span>Center</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div style={{ position: 'relative', height: compact ? '240px' : '320px', width: '100%', backgroundColor: '#e8eee3' }}>
        <div ref={mapNode} style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }} />

        {state === 'loading' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(244,247,242,0.92)',
              backdropFilter: 'blur(3px)',
            }}
          >
            <div style={{ animation: 'spin 1s linear infinite', color: '#0A490A', marginBottom: '10px' }}>
              <Clock size={28} />
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: '#182216' }}>Loading delivery route…</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#647060' }}>{destination.address}</p>
          </div>
        )}

        {state === 'error' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fcfdfa',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={28} color="#b45309" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#182216' }}>Map route view offline</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#647060', maxWidth: '320px' }}>
              Your order destination is registered at {destination.address}. Driver will contact you upon arrival.
            </p>
          </div>
        )}

        {/* Live Distance Pill Overlay */}
        {state === 'ready' && isDelivering && remainingDistance !== null && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.95)',
              border: '1.5px solid #0DB30D',
              borderRadius: '12px',
              padding: '8px 14px',
              boxShadow: '0 4px 16px rgba(10,73,10,0.15)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
              <span style={{ animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', position: 'absolute', height: '100%', width: '100%', borderRadius: '50%', background: '#0DB30D', opacity: 0.75 }} />
              <span style={{ position: 'relative', borderRadius: '50%', height: '10px', width: '10px', background: '#0A490A' }} />
            </span>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#182216' }}>
              <span>{remainingDistance} km from you</span>
              <span style={{ color: '#0A490A', marginLeft: '6px' }}>· ~{etaMinutes} min</span>
            </div>
          </div>
        )}

        {/* Map Legend */}
        {state === 'ready' && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255,255,255,0.94)',
              border: '1px solid #dfe6d9',
              borderRadius: '10px',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#182216',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1b4332' }} />
              1. Courier
            </span>
            <span style={{ color: '#c9d2c5' }}>→</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4a3525' }} />
              2. Pickup Farm
            </span>
            <span style={{ color: '#c9d2c5' }}>→</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2d6a4f' }} />
              3. Destination (You)
            </span>
          </div>
        )}
      </div>

      {/* Footer Info & External Link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '12px 18px',
          background: '#fff',
          borderTop: '1px solid #edf0ea',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#556052', fontWeight: '600' }}>
          <MapPin size={14} color="#0DB30D" />
          <span style={{ maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Deliver to: {destination.address}
          </span>
        </div>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            background: '#eff6ef',
            color: '#0A490A',
            fontSize: '12px',
            fontWeight: '800',
            textDecoration: 'none',
            border: '1px solid #cce8cc',
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.background = '#e1f2e1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = '#eff6ef';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
        >
          <Navigation size={13} />
          <span>Open in Google Maps</span>
          <ExternalLink size={12} style={{ opacity: 0.7 }} />
        </a>
      </div>
    </div>
  );
}
