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

interface DeliveryMapProps {
  destination: DeliveryLocation;
  pickup?: DeliveryLocation;
}

export function DeliveryMap({ destination, pickup }: DeliveryMapProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const leg1LineRef = useRef<any>(null); // Courier -> Pickup
  const leg2LineRef = useRef<any>(null); // Pickup -> Consumer
  const leafletModuleRef = useRef<any>(null);
  const timersRef = useRef<number[]>([]);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  // 1. Resolved Coordinates for all 3 key stops
  const [resolvedDestCoords, setResolvedDestCoords] = useState<{ latitude: number; longitude: number } | null>(
    destination.coordinates ?? null
  );
  const [resolvedPickupCoords, setResolvedPickupCoords] = useState<{ latitude: number; longitude: number } | null>(
    pickup?.coordinates ?? null
  );
  const [riderCoords, setRiderCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Live rider GPS tracking state
  const [gpsStatus, setGpsStatus] = useState<"searching" | "active" | "denied" | "simulating">("searching");
  const [autoFollow, setAutoFollow] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStage, setCurrentStage] = useState<"to_pickup" | "at_pickup" | "to_consumer" | "arrived">("to_pickup");
  const simIntervalRef = useRef<number | null>(null);

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

  // 2. Resolve Pickup Coordinates (Guarantees Pickup Pin always renders!)
  useEffect(() => {
    if (pickup?.coordinates?.latitude && pickup?.coordinates?.longitude) {
      setResolvedPickupCoords(pickup.coordinates);
      return;
    }

    if (!pickup?.address) {
      // Offset slightly from destination if no pickup specified
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

  // 3. Initialize Realistic Initial Courier Location near Pickup
  useEffect(() => {
    if (resolvedPickupCoords && !riderCoords && !isSimulating) {
      // Place courier 1.2km away from pickup so all 3 pins appear immediately
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

  // 5. Initialize and Render Leaflet Map with all 3 Pins and 2 Consecutive Legs
  useEffect(() => {
    if (!resolvedDestCoords || !resolvedPickupCoords || !mapNode.current) return;

    let cancelled = false;

    // Inject stylesheet safely if needed
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

        // Clean up previous map safely
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

        // OpenStreetMap Tile Layer
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
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(27,67,50,0.28);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="position:relative;width:34px;height:34px;border-radius:50%;background:#1b4332;border:3px solid #ffffff;box-shadow:0 6px 20px rgba(27,67,50,0.45);display:flex;align-items:center;justify-content:center;color:#ffffff;">
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
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#1b4332;margin-bottom:3px;">
              📍 Stop 1 • Live Courier
            </div>
            <strong style="font-size:14px;color:#1b4332;display:block;">Delivery Rider (You)</strong>
            <p style="margin:4px 0 0 0;color:#68594e;font-size:11px;line-height:1.4;">
              Departing to pickup fresh vegetables at the farm.
            </p>
          </div>
        `);
        riderMarkerRef.current = courierMarker;

        // ==========================================
        // PIN 2: Pickup Location (Merchant / Hub)
        // ==========================================
        const pickupIcon = L.divIcon({
          className: "custom-pickup-pin",
          html: `
            <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:38px;height:38px;border-radius:50% 50% 50% 0;background:#4a3525;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(74,53,37,0.4);transform:rotate(-45deg);"></div>
              <div style="position:relative;z-index:2;display:flex;align-items:center;justify-content:center;color:#ddb892;">
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
              📦 Stop 2 • Produce Pickup
            </div>
            <strong style="font-size:14px;color:#4a3525;display:block;">${pickup?.label || "Farm & Harvest Hub"}</strong>
            <p style="margin:4px 0 0 0;color:#68594e;font-size:11px;line-height:1.4;">
              ${pickup?.address || "Grower dispatch location"}
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
              <div style="position:absolute;width:38px;height:38px;border-radius:50% 50% 50% 0;background:#2d6a4f;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(45,106,79,0.4);transform:rotate(-45deg);"></div>
              <div style="position:relative;z-index:2;display:flex;align-items:center;justify-content:center;color:#d8e2dc;">
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
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#2d6a4f;margin-bottom:3px;">
              🏠 Stop 3 • Consumer Drop-off
            </div>
            <strong style="font-size:14px;color:#1b4332;display:block;">${destination.label || "Customer Destination"}</strong>
            <p style="margin:4px 0 0 0;color:#68594e;font-size:11px;line-height:1.4;">${destination.address}</p>
          </div>
        `);

        // ==========================================
        // ROUTE LEG 1: Delivery Location -> Pickup
        // (Courier en route to collect produce)
        // ==========================================
        const leg1Line = L.polyline(
          [
            [effectiveCourier.latitude, effectiveCourier.longitude],
            [pickLat, pickLng],
          ],
          {
            color: "#935626", // Warm earthy brown
            weight: 4,
            opacity: 0.9,
            dashArray: "6, 8",
          }
        ).addTo(map);
        leg1LineRef.current = leg1Line;

        // ==========================================
        // ROUTE LEG 2: Pickup -> Consumer Destination
        // (From farm to customer home)
        // ==========================================
        const leg2Line = L.polyline(
          [
            [pickLat, pickLng],
            [destLat, destLng],
          ],
          {
            color: "#1b4332", // Deep forest green
            weight: 4.5,
            opacity: 0.95,
            dashArray: "8, 6",
          }
        ).addTo(map);
        leg2LineRef.current = leg2Line;

        // Automatically Fit Camera to Enclose All 3 Pins
        try {
          const bounds = L.latLngBounds([
            [effectiveCourier.latitude, effectiveCourier.longitude],
            [pickLat, pickLng],
            [destLat, destLng],
          ]);
          map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15, animate: false });
        } catch {}

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
      leg1LineRef.current = null;
      leg2LineRef.current = null;
    };
  }, [resolvedDestCoords, resolvedPickupCoords, destination, pickup]);

  // 6. Update Delivery Rider Marker & Leg 1 Polyline when GPS moves
  useEffect(() => {
    if (!mapInstance.current || !riderCoords || !resolvedPickupCoords) return;

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderCoords.latitude, riderCoords.longitude]);
    }

    // Update Leg 1 route line (Courier -> Pickup)
    if (leg1LineRef.current) {
      leg1LineRef.current.setLatLngs([
        [riderCoords.latitude, riderCoords.longitude],
        [resolvedPickupCoords.latitude, resolvedPickupCoords.longitude],
      ]);
    }

    // Optional Auto-follow
    if (autoFollow && mapInstance.current) {
      try {
        mapInstance.current.panTo([riderCoords.latitude, riderCoords.longitude], {
          animate: true,
          duration: 0.6,
        });
      } catch {}
    }
  }, [riderCoords, resolvedPickupCoords, autoFollow]);

  // Recenter on complete 3-pin bounding box
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

  // 7. Multi-stage Simulation: Courier -> Pickup, THEN Pickup -> Consumer!
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
      setIsSimulating(false);
      setGpsStatus("searching");
      setCurrentStage("to_pickup");
      return;
    }

    if (!resolvedDestCoords || !resolvedPickupCoords) return;

    setIsSimulating(true);
    setGpsStatus("simulating");

    const pickLat = resolvedPickupCoords.latitude;
    const pickLng = resolvedPickupCoords.longitude;
    const destLat = resolvedDestCoords.latitude;
    const destLng = resolvedDestCoords.longitude;

    // Courier initial point 1.2km away from pickup
    const startCourierLat = pickLat - 0.010;
    const startCourierLng = pickLng - 0.009;

    let step = 0;
    const totalStepsStage1 = 12; // Courier -> Pickup
    const pauseSteps = 4;        // Produce loading pause at pickup
    const totalStepsStage2 = 16; // Pickup -> Consumer
    const totalSteps = totalStepsStage1 + pauseSteps + totalStepsStage2;

    setRiderCoords({ latitude: startCourierLat, longitude: startCourierLng });
    setCurrentStage("to_pickup");

    simIntervalRef.current = window.setInterval(() => {
      step++;

      if (step <= totalStepsStage1) {
        // Stage 1: Moving from Courier position to Pickup
        setCurrentStage("to_pickup");
        const progress1 = step / totalStepsStage1;
        const curLat = startCourierLat + (pickLat - startCourierLat) * progress1;
        const curLng = startCourierLng + (pickLng - startCourierLng) * progress1;
        setRiderCoords({ latitude: curLat, longitude: curLng });
      } else if (step <= totalStepsStage1 + pauseSteps) {
        // Stage 2: Arrived at Pickup (Loading fresh produce)
        setCurrentStage("at_pickup");
        setRiderCoords({ latitude: pickLat, longitude: pickLng });
      } else if (step < totalSteps) {
        // Stage 3: Moving from Pickup to Consumer
        setCurrentStage("to_consumer");
        const stepInStage2 = step - (totalStepsStage1 + pauseSteps);
        const progress2 = stepInStage2 / totalStepsStage2;
        const curLat = pickLat + (destLat - pickLat) * progress2;
        const curLng = pickLng + (destLng - pickLng) * progress2;
        setRiderCoords({ latitude: curLat, longitude: curLng });
      } else {
        // Stage 4: Arrived at Consumer destination
        setCurrentStage("arrived");
        setRiderCoords({ latitude: destLat, longitude: destLng });
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }, 1100);
  };

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Distance calculations
  const distCourierToPickup =
    riderCoords && resolvedPickupCoords
      ? computeDistanceKm(
          riderCoords.latitude,
          riderCoords.longitude,
          resolvedPickupCoords.latitude,
          resolvedPickupCoords.longitude
        )
      : null;

  const distPickupToConsumer =
    resolvedPickupCoords && resolvedDestCoords
      ? computeDistanceKm(
          resolvedPickupCoords.latitude,
          resolvedPickupCoords.longitude,
          resolvedDestCoords.latitude,
          resolvedDestCoords.longitude
        )
      : null;

  const navUrl = resolvedDestCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${resolvedDestCoords.latitude},${resolvedDestCoords.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.address)}`;

  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-sm">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[#fbf9f4] px-5 py-3.5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Live Dispatch Map</span>
          <h4 className="text-sm font-black text-[var(--ink)] flex items-center gap-1.5">
            <span>3-Pin Dispatch:</span>
            <span className="text-[#935626]">Courier</span>
            <ArrowRight size={13} className="text-[var(--muted)]" />
            <span className="text-[#4a3525]">Pickup</span>
            <ArrowRight size={13} className="text-[var(--muted)]" />
            <span className="text-[#1b4332]">Consumer</span>
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {/* Follow Rider Toggle */}
          <button
            type="button"
            onClick={() => setAutoFollow((prev) => !prev)}
            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
              autoFollow
                ? "border-[#1b4332] bg-[#edf6e9] text-[#1b4332]"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Crosshair size={13} className={autoFollow ? "text-[#1b4332]" : ""} />
            <span>{autoFollow ? "Following" : "Free View"}</span>
          </button>

          {/* View All 3 Pins */}
          <button
            type="button"
            onClick={recenterAllPins}
            title="Fit all 3 pins in view"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--muted)] shadow-xs hover:border-[#1b4332] hover:text-[#1b4332] transition active:scale-95"
          >
            <Compass size={14} />
            <span>Show All 3 Pins</span>
          </button>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative h-[340px] w-full bg-[#f4efe8] sm:h-[420px]">
        <div
          ref={mapNode}
          className="absolute inset-0 z-0 h-full w-full"
          aria-label={`Interactive delivery map with Courier, Pickup, and Destination`}
        />

        {state === "loading" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#f8f5ee]/90 backdrop-blur-xs text-center">
            <div>
              <LoaderCircle className="mx-auto animate-spin text-[#1b4332]" size={32} />
              <p className="mt-3 text-sm font-extrabold text-[var(--ink)]">Loading 3-point delivery route…</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Plotting Courier → Pickup → Consumer</p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#f8f5ee] px-6 text-center">
            <div className="max-w-xs">
              <AlertTriangle className="mx-auto text-[#935626]" size={28} />
              <p className="mt-3 font-extrabold text-[var(--ink)]">Unable to load map tiles</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                The map could not connect to tile servers, but your pickup and customer addresses are intact.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Status Banner */}
        {state === "ready" && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2 shadow-md border border-[var(--line)] backdrop-blur-xs text-xs font-bold text-[var(--ink)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d6a4f] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1b4332]" />
              </span>
              <span>
                {currentStage === "to_pickup" && (
                  <span>
                    <strong className="text-[#935626]">Step 1:</strong> En route to Pickup ({distCourierToPickup ?? "1.2"} km away)
                  </span>
                )}
                {currentStage === "at_pickup" && (
                  <span className="text-[#4a3525]">
                    <strong>Step 1 Complete:</strong> At Pickup Farm • Loading produce
                  </span>
                )}
                {currentStage === "to_consumer" && (
                  <span>
                    <strong className="text-[#1b4332]">Step 2:</strong> En route to Consumer ({distPickupToConsumer ?? "3.0"} km away)
                  </span>
                )}
                {currentStage === "arrived" && (
                  <span className="text-[#1b4332]">
                    <strong>Completed:</strong> Arrived at Consumer Destination
                  </span>
                )}
              </span>
            </div>

            {/* Test Simulation Button */}
            <button
              type="button"
              onClick={toggleSimulation}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold shadow-md border transition active:scale-95 ${
                isSimulating
                  ? "bg-[#935626] border-[#78461e] text-white"
                  : "bg-white/95 border-[var(--line)] text-[var(--ink)] hover:border-[#1b4332]"
              }`}
            >
              {isSimulating ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isSimulating ? "Stop Route Demo" : "Simulate Movement"}</span>
            </button>
          </div>
        )}

        {/* 3-Pin Interactive Legend */}
        {state === "ready" && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2 shadow-md border border-[var(--line)] backdrop-blur-xs text-[11px] font-bold text-[var(--ink)]">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#1b4332] border border-white shadow-xs" />
              1. Courier
            </span>
            <span className="text-[#c8beaf]">→</span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#4a3525] border border-white shadow-xs" />
              2. Pickup Farm
            </span>
            <span className="text-[#c8beaf]">→</span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#2d6a4f] border border-white shadow-xs" />
              3. Consumer
            </span>
          </div>
        )}
      </div>

      {/* Two-Leg Distance & Navigation Summary Footer */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-white border-t border-[var(--line)]">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#935626] block">Leg 1: To Farm Pickup</span>
            <span className="font-extrabold text-[var(--ink)]">{distCourierToPickup !== null ? `${distCourierToPickup} km` : "1.2 km"}</span>
          </div>
          <div className="sm:border-l sm:border-[#ece5db] sm:pl-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#2d6a4f] block">Leg 2: To Consumer</span>
            <span className="font-extrabold text-[var(--ink)]">{distPickupToConsumer !== null ? `${distPickupToConsumer} km` : "3.0 km"}</span>
          </div>
        </div>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1b4332] px-5 py-2.5 text-xs font-black text-white shadow-xs transition hover:bg-[#0f281e] active:scale-[0.98]"
        >
          <Navigation size={15} aria-hidden="true" />
          <span>Turn-by-Turn GPS Navigation</span>
          <ExternalLink size={13} className="opacity-80" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
