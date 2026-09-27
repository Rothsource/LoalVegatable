"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AlertTriangle,
  Compass,
  Crosshair,
  ExternalLink,
  LoaderCircle,
  Locate,
  MapPin,
  Navigation,
  Play,
  Square,
  Store,
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

function resolveFallbackCoords(address: string): { latitude: number; longitude: number } {
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
  const riderLineRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);
  const timersRef = useRef<number[]>([]);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [resolvedDestCoords, setResolvedDestCoords] = useState<{ latitude: number; longitude: number } | null>(
    destination.coordinates ?? null
  );

  // Live rider GPS tracking state
  const [riderCoords, setRiderCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"searching" | "active" | "denied" | "simulating">("searching");
  const [autoFollow, setAutoFollow] = useState(true);
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

  // 1. Resolve destination coordinates if missing
  useEffect(() => {
    if (destination.coordinates && destination.coordinates.latitude && destination.coordinates.longitude) {
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

  // 2. Real-time Delivery Rider Geolocation Watcher
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

  // 3. Initialize and render Leaflet map
  useEffect(() => {
    if (!resolvedDestCoords || !mapNode.current) return;

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

        // Clean up previous map safely without triggering _leaflet_pos error
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

        const map = L.map(mapNode.current, {
          center: [destLat, destLng],
          zoom: 15,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: false,
        });

        // OpenStreetMap carto tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Destination Marker (Vibrant Emerald Pin)
        const destIcon = L.divIcon({
          className: "custom-dest-pin",
          html: `
            <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:38px;height:38px;border-radius:50% 50% 50% 0;background:#2e6f40;border:3px solid #ffffff;box-shadow:0 8px 24px rgba(46,111,64,0.38);transform:rotate(-45deg);"></div>
              <div style="position:relative;z-index:2;width:10px;height:10px;border-radius:50%;background:#dff0a9;border:1.5px solid #ffffff;"></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 38],
          popupAnchor: [0, -36],
        });

        const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
        destMarker.bindPopup(`
          <div style="padding:4px;font-family:system-ui,sans-serif;font-size:13px;color:#182216;">
            <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#2e6f40;margin-bottom:2px;">Deliver to</div>
            <strong style="font-size:14px;color:#182216;">${destination.label || "Customer Destination"}</strong>
            <p style="margin:4px 0 0 0;color:#647060;font-size:12px;line-height:1.4;">${destination.address}</p>
          </div>
        `);

        // Pickup Marker (Amber Store Pin)
        const pickupCoords = pickup?.coordinates;
        if (pickupCoords && pickupCoords.latitude && pickupCoords.longitude) {
          const pickLat = pickupCoords.latitude;
          const pickLng = pickupCoords.longitude;

          const pickupIcon = L.divIcon({
            className: "custom-pickup-pin",
            html: `
              <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                <div style="position:absolute;width:34px;height:34px;border-radius:50% 50% 50% 0;background:#b96a1d;border:3px solid #ffffff;box-shadow:0 8px 20px rgba(185,106,29,0.32);transform:rotate(-45deg);"></div>
                <div style="position:relative;z-index:2;width:9px;height:9px;border-radius:50%;background:#ffe4af;border:1.5px solid #ffffff;"></div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 34],
            popupAnchor: [0, -32],
          });

          const pickupMarker = L.marker([pickLat, pickLng], { icon: pickupIcon }).addTo(map);
          pickupMarker.bindPopup(`
            <div style="padding:4px;font-family:system-ui,sans-serif;font-size:13px;color:#182216;">
              <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#b96a1d;margin-bottom:2px;">Pick up</div>
              <strong style="font-size:14px;color:#182216;">${pickup.label || "Pickup Farm/Store"}</strong>
              <p style="margin:4px 0 0 0;color:#647060;font-size:12px;line-height:1.4;">${pickup.address}</p>
            </div>
          `);

          L.polyline([[pickLat, pickLng], [destLat, destLng]], {
            color: "#2e6f40",
            weight: 3.5,
            opacity: 0.85,
            dashArray: "6, 9",
          }).addTo(map);

          try {
            const bounds = L.latLngBounds([[pickLat, pickLng], [destLat, destLng]]);
            map.fitBounds(bounds, { padding: [55, 55], maxZoom: 16, animate: false });
          } catch {}
        }

        mapInstance.current = map;
        setState("ready");

        // Safe size invalidation guarded against unmounted map pane
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
      riderLineRef.current = null;
    };
  }, [resolvedDestCoords, destination, pickup]);

  // 4. Update or create the Delivery Rider Pin whenever riderCoords moves
  useEffect(() => {
    if (!mapInstance.current || !riderCoords || !leafletModuleRef.current || !resolvedDestCoords) return;
    const map = mapInstance.current;
    if (!map._mapPane) return;

    const L = leafletModuleRef.current;
    const { latitude, longitude } = riderCoords;

    // Delivery Rider Icon (Pulsing Live Radar Pin)
    const riderIcon = L.divIcon({
      className: "custom-rider-pin",
      html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(30,120,60,0.32);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative;width:32px;height:32px;border-radius:50%;background:#1b4d29;border:3px solid #ffffff;box-shadow:0 6px 18px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#dff0a9;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });

    if (!riderMarkerRef.current) {
      const marker = L.marker([latitude, longitude], { icon: riderIcon, zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(`
        <div style="padding:4px;font-family:system-ui,sans-serif;font-size:13px;color:#182216;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#2e6f40;margin-bottom:2px;">Live Delivery Pin</div>
          <strong style="font-size:14px;color:#182216;">Delivery Rider (You)</strong>
          <p style="margin:4px 0 0 0;color:#647060;font-size:12px;line-height:1.4;">Tracking live position on route</p>
        </div>
      `);
      riderMarkerRef.current = marker;
    } else {
      riderMarkerRef.current.setLatLng([latitude, longitude]);
    }

    // Connect Rider to Customer Destination with active green route line
    if (!riderLineRef.current) {
      const line = L.polyline(
        [
          [latitude, longitude],
          [resolvedDestCoords.latitude, resolvedDestCoords.longitude],
        ],
        {
          color: "#16a34a",
          weight: 4,
          opacity: 0.9,
          dashArray: "8, 6",
        }
      ).addTo(map);
      riderLineRef.current = line;
    } else {
      riderLineRef.current.setLatLngs([
        [latitude, longitude],
        [resolvedDestCoords.latitude, resolvedDestCoords.longitude],
      ]);
    }

    // Auto-follow rider camera
    if (autoFollow) {
      try {
        map.panTo([latitude, longitude], { animate: true, duration: 0.6 });
      } catch {}
    }
  }, [riderCoords, resolvedDestCoords, autoFollow]);

  // Recenter on destination or rider
  const recenterMap = useCallback(() => {
    if (!mapInstance.current || !(mapInstance.current as any)._mapPane) return;
    const target = riderCoords ?? resolvedDestCoords;
    if (!target) return;
    try {
      mapInstance.current.setView([target.latitude, target.longitude], 15, { animate: true });
    } catch {}
  }, [riderCoords, resolvedDestCoords]);

  // Simulation mode: moves the rider pin smoothly towards the customer destination for testing
  const toggleSimulation = () => {
    if (isSimulating) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
      setIsSimulating(false);
      setGpsStatus("searching");
      return;
    }

    if (!resolvedDestCoords) return;

    setIsSimulating(true);
    setGpsStatus("simulating");

    // Starting position: slightly offset from destination (or pickup)
    const startLat = pickup?.coordinates?.latitude ?? resolvedDestCoords.latitude - 0.012;
    const startLng = pickup?.coordinates?.longitude ?? resolvedDestCoords.longitude - 0.015;

    let step = 0;
    const totalSteps = 24;

    setRiderCoords({ latitude: startLat, longitude: startLng });

    simIntervalRef.current = window.setInterval(() => {
      step++;
      const progress = Math.min(1, step / totalSteps);
      const curLat = startLat + (resolvedDestCoords.latitude - startLat) * progress;
      const curLng = startLng + (resolvedDestCoords.longitude - startLng) * progress;

      setRiderCoords({ latitude: curLat, longitude: curLng });

      if (progress >= 1) {
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }, 1200);
  };

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const distanceToDest =
    riderCoords && resolvedDestCoords
      ? computeDistanceKm(
          riderCoords.latitude,
          riderCoords.longitude,
          resolvedDestCoords.latitude,
          resolvedDestCoords.longitude
        )
      : null;

  const navUrl = resolvedDestCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${resolvedDestCoords.latitude},${resolvedDestCoords.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.address)}`;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[#fbfdf9] px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                gpsStatus === "active" || gpsStatus === "simulating"
                  ? "bg-emerald-500 animate-pulse"
                  : gpsStatus === "denied"
                  ? "bg-amber-500"
                  : "bg-blue-500 animate-pulse"
              }`}
            />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--leaf)]">
              Live Delivery GPS Map
            </p>
          </div>
          <h2 className="mt-0.5 truncate text-base font-extrabold text-[var(--ink)]">
            {destination.address}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Follow Rider Toggle */}
          <button
            type="button"
            onClick={() => setAutoFollow((prev) => !prev)}
            title={autoFollow ? "Locking camera to rider" : "Click to auto-follow rider"}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition active:scale-95 ${
              autoFollow
                ? "border-[var(--leaf)] bg-[#edf6e9] text-[var(--leaf-dark)]"
                : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Crosshair size={13} className={autoFollow ? "text-[var(--leaf)]" : ""} />
            <span>{autoFollow ? "Following" : "Free View"}</span>
          </button>

          {/* Recenter */}
          <button
            type="button"
            onClick={recenterMap}
            title="Recenter view"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--muted)] shadow-xs hover:border-[var(--leaf)] hover:text-[var(--leaf)] transition active:scale-95"
          >
            <Compass size={14} className="text-[var(--leaf)]" />
            <span>Center</span>
          </button>
        </div>
      </div>

      {/* Map viewport */}
      <div className="relative h-[320px] w-full bg-[#e8eee3] sm:h-[400px]">
        <div
          ref={mapNode}
          className="absolute inset-0 z-0 h-full w-full"
          aria-label={`Interactive map showing delivery to ${destination.address}`}
        />

        {state === "loading" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#f4f7f2]/90 backdrop-blur-xs text-center">
            <div>
              <LoaderCircle className="mx-auto animate-spin text-[var(--leaf)]" size={30} />
              <p className="mt-3 text-sm font-extrabold text-[var(--ink)]">Loading delivery map…</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{destination.address}</p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#f7f8f4] px-6 text-center">
            <div className="max-w-xs">
              <AlertTriangle className="mx-auto text-[var(--amber)]" size={28} />
              <p className="mt-3 font-extrabold text-[var(--ink)]">Unable to load map</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                The map could not connect, but your destination address is still available below.
              </p>
            </div>
          </div>
        )}

        {/* Live Rider Banner & Distance Status Pill */}
        {state === "ready" && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-md border border-[var(--line)] backdrop-blur-xs text-xs font-bold text-[var(--ink)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <span>
                {riderCoords
                  ? distanceToDest !== null
                    ? `Delivery pin live • ${distanceToDest} km to customer`
                    : "Delivery pin live"
                  : gpsStatus === "denied"
                  ? "Enable GPS for live delivery tracking"
                  : "Connecting to rider GPS…"}
              </span>
            </div>

            {/* Test Simulation Button */}
            <button
              type="button"
              onClick={toggleSimulation}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold shadow-md border transition active:scale-95 ${
                isSimulating
                  ? "bg-amber-600 border-amber-700 text-white"
                  : "bg-white/95 border-[var(--line)] text-[var(--ink)] hover:border-emerald-500"
              }`}
            >
              {isSimulating ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isSimulating ? "Stop Test" : "Test Movement"}</span>
            </button>
          </div>
        )}

        {/* Legend overlay */}
        {state === "ready" && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2.5 rounded-xl bg-white/95 px-3 py-1.5 shadow-md border border-[var(--line)] backdrop-blur-xs text-[11px] font-bold text-[var(--ink)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1b4d29]" />
              Rider (You)
            </span>
            {pickup?.coordinates && (
              <>
                <span className="text-[#a0aca0]">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#b96a1d]" />
                  Pickup
                </span>
              </>
            )}
            <span className="text-[#a0aca0]">•</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--leaf)]" />
              Customer
            </span>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 bg-white border-t border-[var(--line)]">
        <div className="min-w-0 text-xs text-[var(--muted)]">
          {resolvedDestCoords ? (
            <p className="font-semibold truncate">
              Destination:{" "}
              <span className="font-mono text-[var(--ink)]">
                {resolvedDestCoords.latitude.toFixed(5)}, {resolvedDestCoords.longitude.toFixed(5)}
              </span>
            </p>
          ) : (
            <p className="font-semibold text-amber-700">Using address for navigation</p>
          )}
        </div>

        <a
          href={navUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-[var(--leaf)] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[var(--leaf-dark)] active:scale-[0.98]"
        >
          <Navigation size={16} aria-hidden="true" />
          <span>Open Google Navigation</span>
          <ExternalLink size={14} className="opacity-80" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
