"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AlertTriangle,
  Compass,
  Crosshair,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Navigation,
  Play,
  Square,
  Store,
  Bike,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Clock,
} from "lucide-react";
import type { DeliveryLocation } from "@/lib/types";

// Known Cambodian province centers for graceful location fallback
const CAMBODIA_PROVINCES: Record<string, { latitude: number; longitude: number }> = {
  "phnom penh": { latitude: 11.5564, longitude: 104.9282 },
  "kandal": { latitude: 11.4589, longitude: 104.9575 },
  "siem reap": { latitude: 13.3671, longitude: 103.8448 },
  "battambang": { latitude: 13.0957, longitude: 103.2022 },
  "kampot": { latitude: 10.6104, longitude: 104.1815 },
  "preah sihanouk": { latitude: 10.6275, longitude: 103.5221 },
  "sihanoukville": { latitude: 10.6275, longitude: 103.5221 },
  "kampong cham": { latitude: 11.9934, longitude: 105.4635 },
  "kampong chhnang": { latitude: 12.25, longitude: 104.6667 },
  "kampong speu": { latitude: 11.4533, longitude: 104.5209 },
  "kampong thom": { latitude: 12.7111, longitude: 104.8887 },
  "kep": { latitude: 10.4828, longitude: 104.2949 },
  "koh kong": { latitude: 11.6153, longitude: 102.9838 },
  "kratie": { latitude: 12.4881, longitude: 106.0188 },
  "mondulkiri": { latitude: 12.4558, longitude: 107.1881 },
  "oddar meanchey": { latitude: 14.1751, longitude: 103.5176 },
  "pailin": { latitude: 12.8489, longitude: 102.6093 },
  "preah vihear": { latitude: 13.8073, longitude: 104.9814 },
  "prey veng": { latitude: 11.4851, longitude: 105.3253 },
  "pursat": { latitude: 12.5388, longitude: 103.9192 },
  "ratanakiri": { latitude: 13.7394, longitude: 106.9873 },
  "stung treng": { latitude: 13.5259, longitude: 105.9683 },
  "svay rieng": { latitude: 11.0879, longitude: 105.7994 },
  "takeo": { latitude: 10.9908, longitude: 104.785 },
  "tboung khmum": { latitude: 11.9366, longitude: 105.656 },
};

function resolveFallbackCoords(address?: string): { latitude: number; longitude: number } {
  if (!address) return { latitude: 11.5564, longitude: 104.9282 };
  const lower = address.toLowerCase();
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

// Real road route fetcher via OSRM (driving profile, street geometry)
async function fetchRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<{ coordinates: [number, number][]; distanceKm: number; durationMin: number } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] // convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      );
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMin = Math.max(1, Math.round(route.duration / 60));
      return { coordinates: coords, distanceKm, durationMin };
    }
  } catch (err) {
    console.warn("OSRM road route fetch fallback:", err);
  }
  return null;
}

export interface DeliveryMapProps {
  destination: DeliveryLocation;
  pickup?: DeliveryLocation;
  stage?: "to_pickup" | "to_consumer";
  onStageChange?: (stage: "to_pickup" | "to_consumer") => void;
  onArrivedAtPickup?: () => void;
}

export function DeliveryMap({
  destination,
  pickup,
  stage: controlledStage,
  onStageChange,
  onArrivedAtPickup,
}: DeliveryMapProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const activeRouteLineRef = useRef<any>(null);
  const activeRouteCasingRef = useRef<any>(null);
  const previewRouteLineRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);
  const timersRef = useRef<number[]>([]);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  // 1. Resolved Coordinates for all 3 key points
  const [resolvedDestCoords, setResolvedDestCoords] = useState<{ latitude: number; longitude: number } | null>(
    destination.coordinates ?? null
  );
  const [resolvedPickupCoords, setResolvedPickupCoords] = useState<{ latitude: number; longitude: number } | null>(
    pickup?.coordinates ?? null
  );
  const [riderCoords, setRiderCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Stage state: "to_pickup" (Leg 1) vs "to_consumer" (Leg 2)
  const [internalStage, setInternalStage] = useState<"to_pickup" | "to_consumer">("to_pickup");
  const currentStage = controlledStage ?? internalStage;

  // Directions state
  const [isRouting, setIsRouting] = useState(false);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [roadDurationMin, setRoadDurationMin] = useState<number | null>(null);
  const [roadCoordinates, setRoadCoordinates] = useState<[number, number][]>([]);

  // Live GPS & Simulation
  const [gpsStatus, setGpsStatus] = useState<"searching" | "active" | "denied" | "simulating">("searching");
  const [autoFollow, setAutoFollow] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const simIntervalRef = useRef<number | null>(null);

  const addTimer = (id: number) => {
    timersRef.current.push(id);
    return id;
  };

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const setStage = useCallback(
    (nextStage: "to_pickup" | "to_consumer") => {
      setInternalStage(nextStage);
      onStageChange?.(nextStage);
    },
    [onStageChange]
  );

  // 1. Geocode Destination Coordinates if missing
  useEffect(() => {
    if (destination.coordinates?.latitude && destination.coordinates?.longitude) {
      setResolvedDestCoords(destination.coordinates);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const query = [destination.address, "Cambodia"].filter(Boolean).join(", ");
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: { "Accept-Language": "en" },
    })
      .then((res) => res.json())
      .then((results) => {
        clearTimeout(timeout);
        if (isCancelled) return;
        if (Array.isArray(results) && results.length > 0 && results[0].lat && results[0].lon) {
          setResolvedDestCoords({
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
          });
        } else {
          setResolvedDestCoords(resolveFallbackCoords(destination.address));
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setResolvedDestCoords(resolveFallbackCoords(destination.address));
        }
      });

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [destination.address, destination.coordinates]);

  // 2. Geocode Pickup Coordinates if missing
  useEffect(() => {
    if (pickup?.coordinates?.latitude && pickup?.coordinates?.longitude) {
      setResolvedPickupCoords(pickup.coordinates);
      return;
    }

    if (!pickup?.address) {
      const fallbackBase = resolvedDestCoords || { latitude: 11.5564, longitude: 104.9282 };
      setResolvedPickupCoords({
        latitude: fallbackBase.latitude - 0.015,
        longitude: fallbackBase.longitude - 0.018,
      });
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const query = [pickup.address, "Cambodia"].filter(Boolean).join(", ");
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: { "Accept-Language": "en" },
    })
      .then((res) => res.json())
      .then((results) => {
        clearTimeout(timeout);
        if (isCancelled) return;
        if (Array.isArray(results) && results.length > 0 && results[0].lat && results[0].lon) {
          setResolvedPickupCoords({
            latitude: parseFloat(results[0].lat),
            longitude: parseFloat(results[0].lon),
          });
        } else {
          const fallback = resolveFallbackCoords(pickup.address);
          setResolvedPickupCoords({
            latitude: fallback.latitude - 0.008,
            longitude: fallback.longitude - 0.012,
          });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          const fallback = resolveFallbackCoords(pickup.address);
          setResolvedPickupCoords({
            latitude: fallback.latitude - 0.008,
            longitude: fallback.longitude - 0.012,
          });
        }
      });

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [pickup?.address, pickup?.coordinates, resolvedDestCoords]);

  // 3. Initialize Realistic Initial Courier Location
  useEffect(() => {
    if (resolvedPickupCoords && !riderCoords && !isSimulating) {
      setRiderCoords({
        latitude: resolvedPickupCoords.latitude - 0.010,
        longitude: resolvedPickupCoords.longitude - 0.009,
      });
    }
  }, [resolvedPickupCoords, riderCoords, isSimulating]);

  // 4. Real-time Delivery Rider Geolocation Watcher
  useEffect(() => {
    if (isSimulating) return;

    if (!("geolocation" in navigator)) {
      setGpsStatus("denied");
      return;
    }

    setGpsStatus("searching");

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setRiderCoords({ latitude, longitude });
        setGpsStatus("active");
      },
      (err) => {
        console.warn("GPS tracking status:", err.message);
        setGpsStatus((curr) => (curr === "active" ? curr : "denied"));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSimulating]);

  // 5. Calculate and Render Directions (Google Maps-Style Road Route)
  const calculateAndDrawRoute = useCallback(
    async (targetStage = currentStage) => {
      if (!resolvedDestCoords || !resolvedPickupCoords) return;

      const effectiveCourier = riderCoords || {
        latitude: resolvedPickupCoords.latitude - 0.010,
        longitude: resolvedPickupCoords.longitude - 0.009,
      };

      setIsRouting(true);

      let originLat: number;
      let originLng: number;
      let destLat: number;
      let destLng: number;

      if (targetStage === "to_pickup") {
        // Leg 1: Delivery Rider -> Pickup Farm
        originLat = effectiveCourier.latitude;
        originLng = effectiveCourier.longitude;
        destLat = resolvedPickupCoords.latitude;
        destLng = resolvedPickupCoords.longitude;
      } else {
        // Leg 2: Pickup / Courier -> Consumer Destination
        originLat = riderCoords ? riderCoords.latitude : resolvedPickupCoords.latitude;
        originLng = riderCoords ? riderCoords.longitude : resolvedPickupCoords.longitude;
        destLat = resolvedDestCoords.latitude;
        destLng = resolvedDestCoords.longitude;
      }

      const roadRoute = await fetchRoadRoute(originLat, originLng, destLat, destLng);

      const coords: [number, number][] =
        roadRoute?.coordinates && roadRoute.coordinates.length > 1
          ? roadRoute.coordinates
          : [
              [originLat, originLng],
              [destLat, destLng],
            ];

      const dist = roadRoute ? roadRoute.distanceKm : computeDistanceKm(originLat, originLng, destLat, destLng);
      const dur = roadRoute ? roadRoute.durationMin : Math.max(1, Math.round((dist / 30) * 60));

      setRoadCoordinates(coords);
      setRoadDistanceKm(dist);
      setRoadDurationMin(dur);
      setIsRouting(false);

      // Update Map Lines
      if (activeRouteCasingRef.current && activeRouteLineRef.current && mapInstance.current) {
        activeRouteCasingRef.current.setLatLngs(coords);
        activeRouteLineRef.current.setLatLngs(coords);

        // Highlight line color based on stage
        const routeColor = targetStage === "to_pickup" ? "#2563eb" : "#10b981"; // Vibrant Google Blue or Emerald
        activeRouteLineRef.current.setStyle({ color: routeColor });

        // Update preview line for the other leg
        if (previewRouteLineRef.current) {
          if (targetStage === "to_pickup") {
            // Preview Leg 2 (Pickup -> Consumer)
            previewRouteLineRef.current.setLatLngs([
              [resolvedPickupCoords.latitude, resolvedPickupCoords.longitude],
              [resolvedDestCoords.latitude, resolvedDestCoords.longitude],
            ]);
            previewRouteLineRef.current.setStyle({ opacity: 0.45, color: "#64748b" });
          } else {
            // Leg 1 is completed
            previewRouteLineRef.current.setLatLngs([]);
          }
        }

        try {
          const L = leafletModuleRef.current;
          if (L) {
            const bounds = L.latLngBounds(coords);
            mapInstance.current.fitBounds(bounds, { padding: [55, 55], maxZoom: 16, animate: true });
          }
        } catch {}
      }
    },
    [currentStage, resolvedDestCoords, resolvedPickupCoords, riderCoords]
  );

  // 6. Initialize Leaflet Map
  useEffect(() => {
    if (!resolvedDestCoords || !resolvedPickupCoords || !mapNode.current) return;

    let cancelled = false;

    if (typeof document !== "undefined" && !document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet")
      .then((module) => {
        if (cancelled || !mapNode.current) return;
        const L = module.default;
        leafletModuleRef.current = L;

        if (mapInstance.current) {
          try {
            const oldMap = mapInstance.current;
            oldMap.stop();
            oldMap.off();
            oldMap.remove();
          } catch {}
          mapInstance.current = null;
        }

        if ((mapNode.current as any)?._leaflet_id) {
          try {
            delete (mapNode.current as any)._leaflet_id;
          } catch {}
        }

        const destLat = resolvedDestCoords.latitude;
        const destLng = resolvedDestCoords.longitude;
        const pickLat = resolvedPickupCoords.latitude;
        const pickLng = resolvedPickupCoords.longitude;

        const effectiveCourier = riderCoords || {
          latitude: pickLat - 0.010,
          longitude: pickLng - 0.009,
        };

        const map = L.map(mapNode.current, {
          center: [pickLat, pickLng],
          zoom: 14,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: false,
        });

        // OpenStreetMap Crisp Tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // ==========================================
        // PIN 1: Courier / Delivery Location
        // ==========================================
        const courierIcon = L.divIcon({
          className: "custom-courier-pin",
          html: `
            <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.25);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:relative;width:34px;height:34px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 6px 20px rgba(37,99,235,0.45);display:flex;align-items:center;justify-content:center;color:#ffffff;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });

        const courierMarker = L.marker([effectiveCourier.latitude, effectiveCourier.longitude], {
          icon: courierIcon,
          zIndexOffset: 1200,
        }).addTo(map);

        courierMarker.bindPopup(`
          <div style="padding:6px;font-family:system-ui,sans-serif;font-size:13px;color:#231b14;min-width:180px;">
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#2563eb;margin-bottom:3px;">
              📍 Live Courier (You)
            </div>
            <strong style="font-size:14px;color:#1e3a8a;display:block;">Delivery Rider Pin</strong>
            <p style="margin:4px 0 0 0;color:#64748b;font-size:11px;line-height:1.4;">
              ${currentStage === "to_pickup" ? "En route to collect fresh produce." : "En route to customer drop-off."}
            </p>
          </div>
        `);
        riderMarkerRef.current = courierMarker;

        // ==========================================
        // PIN 2: Pickup Location (Farm / Community)
        // ==========================================
        const pickupIcon = L.divIcon({
          className: "custom-pickup-pin",
          html: `
            <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:38px;height:38px;border-radius:50% 50% 50% 0;background:#935626;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(147,86,38,0.4);transform:rotate(-45deg);"></div>
              <div style="position:relative;z-index:2;display:flex;align-items:center;justify-content:center;color:#ffffff;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
              </div>
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 40],
          popupAnchor: [0, -38],
        });

        const pickupMarker = L.marker([pickLat, pickLng], {
          icon: pickupIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        pickupMarker.bindPopup(`
          <div style="padding:6px;font-family:system-ui,sans-serif;font-size:13px;color:#231b14;min-width:180px;">
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#935626;margin-bottom:3px;">
              📦 Stop 1 • Pickup Hub
            </div>
            <strong style="font-size:14px;color:#4a3525;display:block;">${pickup?.label || "Farm & Harvest Hub"}</strong>
            <p style="margin:4px 0 0 0;color:#64748b;font-size:11px;line-height:1.4;">
              ${pickup?.address || "Producer harvest location"}
            </p>
          </div>
        `);

        // ==========================================
        // PIN 3: Consumer Destination
        // ==========================================
        const destIcon = L.divIcon({
          className: "custom-dest-pin",
          html: `
            <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:38px;height:38px;border-radius:50% 50% 50% 0;background:#059669;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(5,150,105,0.4);transform:rotate(-45deg);"></div>
              <div style="position:relative;z-index:2;display:flex;align-items:center;justify-content:center;color:#ffffff;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 40],
          popupAnchor: [0, -38],
        });

        const destMarker = L.marker([destLat, destLng], {
          icon: destIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        destMarker.bindPopup(`
          <div style="padding:6px;font-family:system-ui,sans-serif;font-size:13px;color:#231b14;min-width:180px;">
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#059669;margin-bottom:3px;">
              🏠 Stop 2 • Consumer Destination
            </div>
            <strong style="font-size:14px;color:#065f46;display:block;">${destination.label || "Customer Home"}</strong>
            <p style="margin:4px 0 0 0;color:#64748b;font-size:11px;line-height:1.4;">${destination.address}</p>
          </div>
        `);

        // ==========================================
        // Google Maps-Style Driving Polyline (Casing + Core)
        // ==========================================
        const initialCoords: [number, number][] = [
          [effectiveCourier.latitude, effectiveCourier.longitude],
          [pickLat, pickLng],
        ];

        // Outer glow/casing line (dark blue border)
        const activeRouteCasing = L.polyline(initialCoords, {
          color: "#1e3a8a",
          weight: 8,
          opacity: 0.6,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        activeRouteCasingRef.current = activeRouteCasing;

        // Inner core road line (Google Blue)
        const activeRouteLine = L.polyline(initialCoords, {
          color: "#2563eb",
          weight: 5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
        activeRouteLineRef.current = activeRouteLine;

        // Secondary Leg Preview (dashed line)
        const previewRouteLine = L.polyline(
          [
            [pickLat, pickLng],
            [destLat, destLng],
          ],
          {
            color: "#64748b",
            weight: 3.5,
            opacity: 0.45,
            dashArray: "6, 8",
          }
        ).addTo(map);
        previewRouteLineRef.current = previewRouteLine;

        mapInstance.current = map;
        setState("ready");

        const safeInvalidate = () => {
          if (cancelled || !mapInstance.current) return;
          const currentMap = mapInstance.current;
          if (!currentMap._mapPane || !currentMap.getContainer()) return;
          try {
            currentMap.invalidateSize();
          } catch {}
        };

        addTimer(window.setTimeout(safeInvalidate, 80));
        addTimer(window.setTimeout(safeInvalidate, 350));

        // Draw initial real road directions
        void calculateAndDrawRoute(currentStage);
      })
      .catch((err) => {
        console.error("Leaflet load error:", err);
        if (!cancelled) setState("error");
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
      activeRouteLineRef.current = null;
      activeRouteCasingRef.current = null;
      previewRouteLineRef.current = null;
    };
  }, [resolvedDestCoords, resolvedPickupCoords, destination, pickup]);

  // Recalculate road route whenever stage changes
  useEffect(() => {
    if (state === "ready") {
      void calculateAndDrawRoute(currentStage);
    }
  }, [currentStage, calculateAndDrawRoute, state]);

  // Update Rider Marker when GPS updates
  useEffect(() => {
    if (!mapInstance.current || !riderCoords) return;

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderCoords.latitude, riderCoords.longitude]);
    }

    if (autoFollow && mapInstance.current) {
      try {
        mapInstance.current.panTo([riderCoords.latitude, riderCoords.longitude], {
          animate: true,
          duration: 0.6,
        });
      } catch {}
    }
  }, [riderCoords, autoFollow]);

  // Recenter complete view
  const recenterAllPins = useCallback(() => {
    if (!mapInstance.current || !resolvedDestCoords || !resolvedPickupCoords) return;
    try {
      const courier = riderCoords || resolvedPickupCoords;
      const bounds = leafletModuleRef.current.latLngBounds([
        [courier.latitude, courier.longitude],
        [resolvedPickupCoords.latitude, resolvedPickupCoords.longitude],
        [resolvedDestCoords.latitude, resolvedDestCoords.longitude],
      ]);
      mapInstance.current.fitBounds(bounds, { padding: [55, 55], maxZoom: 15, animate: true });
    } catch {}
  }, [riderCoords, resolvedPickupCoords, resolvedDestCoords]);

  // Handle "Arrive at Pickup" transition to Step 2
  const handleArriveAtPickupInternal = () => {
    setStage("to_consumer");
    onArrivedAtPickup?.();
  };

  // Simulation: Move Courier along the actual OSRM road coordinates
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
      setIsSimulating(false);
      setGpsStatus("searching");
      return;
    }

    if (!roadCoordinates || roadCoordinates.length < 2) return;

    setIsSimulating(true);
    setGpsStatus("simulating");

    let idx = 0;
    const totalPoints = roadCoordinates.length;
    // Step forward every 400ms along the real road polyline
    const stepSize = Math.max(1, Math.floor(totalPoints / 25));

    setRiderCoords({ latitude: roadCoordinates[0][0], longitude: roadCoordinates[0][1] });

    simIntervalRef.current = window.setInterval(() => {
      idx += stepSize;
      if (idx < totalPoints) {
        const point = roadCoordinates[idx];
        setRiderCoords({ latitude: point[0], longitude: point[1] });
      } else {
        const lastPoint = roadCoordinates[totalPoints - 1];
        setRiderCoords({ latitude: lastPoint[0], longitude: lastPoint[1] });
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
        setIsSimulating(false);
        setGpsStatus("searching");

        if (currentStage === "to_pickup") {
          // Reached pickup during demo
          handleArriveAtPickupInternal();
        }
      }
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // External Navigation App link (Google Maps)
  const targetCoords = currentStage === "to_pickup" ? resolvedPickupCoords : resolvedDestCoords;
  const navUrl = targetCoords
    ? riderCoords
      ? `https://www.google.com/maps/dir/?api=1&origin=${riderCoords.latitude},${riderCoords.longitude}&destination=${targetCoords.latitude},${targetCoords.longitude}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${targetCoords.latitude},${targetCoords.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        currentStage === "to_pickup" ? pickup?.address || "Pickup" : destination.address
      )}`;

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-sm">
      {/* Top Map Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[#fbf9f4] px-4 py-3 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                currentStage === "to_pickup"
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
              }`}
            >
              {currentStage === "to_pickup" ? "Step 1: To Pickup" : "Step 2: To Consumer"}
            </span>
            <span className="text-xs font-bold text-[var(--muted)]">
              {currentStage === "to_pickup" ? "Collect fresh harvest" : "Deliver to customer"}
            </span>
          </div>
          <h4 className="mt-1 text-sm font-black text-[var(--ink)] flex items-center gap-1.5">
            {currentStage === "to_pickup" ? (
              <>
                <Store size={15} className="text-[#935626]" />
                <span>Pickup: {pickup?.label || pickup?.address || "Farm / Hub"}</span>
              </>
            ) : (
              <>
                <MapPin size={15} className="text-[#059669]" />
                <span>Destination: {destination.label || destination.address || "Customer Home"}</span>
              </>
            )}
          </h4>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* DIRECTION BUTTON (Recalculate route like Google Maps) */}
          <button
            type="button"
            onClick={() => void calculateAndDrawRoute(currentStage)}
            disabled={isRouting}
            title="Recalculate driving directions from current location"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition active:scale-95 disabled:opacity-60"
          >
            <Navigation size={14} className={isRouting ? "animate-spin" : ""} />
            <span>{isRouting ? "Routing…" : "Direction"}</span>
          </button>

          {/* Follow Me Toggle */}
          <button
            type="button"
            onClick={() => setAutoFollow((prev) => !prev)}
            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
              autoFollow
                ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Crosshair size={13} className={autoFollow ? "text-[#2563eb]" : ""} />
            <span>{autoFollow ? "Following" : "Auto-Follow"}</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={recenterAllPins}
            title="Fit all stops in view"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)] transition active:scale-95"
          >
            <Compass size={14} />
            <span className="hidden sm:inline">Fit View</span>
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative h-[340px] w-full bg-[#f4efe8] sm:h-[430px]">
        <div
          ref={mapNode}
          className="absolute inset-0 z-0 h-full w-full"
          aria-label="Interactive road navigation map"
        />

        {state === "loading" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#f8f5ee]/90 backdrop-blur-xs text-center">
            <div>
              <LoaderCircle className="mx-auto animate-spin text-[#2563eb]" size={32} />
              <p className="mt-3 text-sm font-extrabold text-[var(--ink)]">Loading road map…</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Connecting to OpenStreetMap &amp; directions</p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#f8f5ee] px-6 text-center">
            <div className="max-w-xs">
              <AlertTriangle className="mx-auto text-[#935626]" size={28} />
              <p className="mt-3 font-extrabold text-[var(--ink)]">Unable to load map tiles</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                The tile server was unreachable, but your GPS location and destination are intact.
              </p>
            </div>
          </div>
        )}

        {/* Live Road Route ETA Card (Overlay) */}
        {state === "ready" && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-col gap-2 max-w-sm">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg border border-[var(--line)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2563eb]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[var(--ink)]">
                      {roadDistanceKm !== null ? `${roadDistanceKm} km` : "Calculating…"}
                    </span>
                    <span className="text-xs font-bold text-[#64748b] flex items-center gap-1">
                      <Clock size={12} />
                      {roadDurationMin !== null ? `~${roadDurationMin} mins` : ""}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[var(--muted)] line-clamp-1">
                    {currentStage === "to_pickup"
                      ? "Following streets to Farm / Hub pickup"
                      : "Following streets to Customer destination"}
                  </p>
                </div>
              </div>

              {/* Step Transition Trigger right on map */}
              {currentStage === "to_pickup" ? (
                <button
                  type="button"
                  onClick={handleArriveAtPickupInternal}
                  className="cursor-pointer shrink-0 rounded-xl bg-[#935626] hover:bg-[#78461e] px-3 py-1.5 text-xs font-black text-white shadow-xs transition active:scale-95"
                >
                  Arrived at Pickup
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStage("to_pickup")}
                  className="cursor-pointer shrink-0 rounded-xl border border-[var(--line)] bg-white hover:bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-[var(--muted)]"
                  title="Switch back to pickup directions"
                >
                  ← Leg 1
                </button>
              )}
            </div>
          </div>
        )}

        {/* Map Interactive Legend & Simulation controls */}
        {state === "ready" && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-1.5 shadow-md border border-[var(--line)] backdrop-blur-xs text-[11px] font-bold text-[var(--ink)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb] border border-white shadow-xs" />
                You
              </span>
              <span className="text-[#cbd5e1]">→</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#935626] border border-white shadow-xs" />
                Pickup
              </span>
              <span className="text-[#cbd5e1]">→</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#059669] border border-white shadow-xs" />
                Consumer
              </span>
            </div>

            {/* Test Simulation along road */}
            <button
              type="button"
              onClick={toggleSimulation}
              className={`cursor-pointer inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold shadow-md border transition active:scale-95 ${
                isSimulating
                  ? "bg-[#2563eb] border-[#1d4ed8] text-white"
                  : "bg-white/95 border-[var(--line)] text-[var(--ink)] hover:border-[#2563eb]"
              }`}
            >
              {isSimulating ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              <span>{isSimulating ? "Stop Demo" : "Simulate Road Drive"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Road Navigation Footer with Turn-by-Turn Option */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-white border-t border-[var(--line)]">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)] block">
            {currentStage === "to_pickup" ? "Active Leg: Courier → Farm Pickup" : "Active Leg: Courier → Customer Drop-off"}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-black text-[var(--ink)]">
              {roadDistanceKm !== null ? `${roadDistanceKm} km` : "Estimating"}
            </span>
            <span className="text-xs text-[var(--muted)]">
              {roadDurationMin !== null ? `(~${roadDurationMin} mins driving)` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick toggle between legs */}
          <button
            type="button"
            onClick={() => setStage(currentStage === "to_pickup" ? "to_consumer" : "to_pickup")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[#f8fafc] px-3.5 text-xs font-bold text-[var(--ink)] hover:bg-[#f1f5f9] transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>{currentStage === "to_pickup" ? "Switch to Leg 2 (Customer)" : "Switch to Leg 1 (Pickup)"}</span>
          </button>

          {/* Turn-by-Turn GPS Navigation App (Google Maps) */}
          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1b4332] hover:bg-[#123327] px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-[0.98]"
          >
            <Navigation size={15} aria-hidden="true" />
            <span>Open in Google Maps</span>
            <ExternalLink size={13} className="opacity-80" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
