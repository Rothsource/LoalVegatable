"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Building,
  Crosshair,
} from "lucide-react";

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface DistributorLocationPickerProps {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  onChange: (location: LocationData) => void;
  disabled?: boolean;
}

const DEFAULT_PHNOM_PENH_LAT = 11.5564;
const DEFAULT_PHNOM_PENH_LNG = 104.9282;
const DEFAULT_ZOOM = 13;

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city_district?: string;
    district?: string;
    city?: string;
    state?: string;
  };
};

export default function DistributorLocationPicker({
  initialAddress = "",
  initialLat,
  initialLng,
  onChange,
  disabled = false,
}: DistributorLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng)
      ? { lat: initialLat, lng: initialLng }
      : null
  );

  const [locatingUser, setLocatingUser] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Keep a stable ref to callback to prevent stale closures
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Format Nominatim address object
  const formatAddress = (data: any, fallbackLat: number, fallbackLng: number) => {
    if (!data) return `${fallbackLat.toFixed(5)}, ${fallbackLng.toFixed(5)}`;
    const addr = data.address || {};
    const parts = [
      addr.house_number,
      addr.road || addr.pedestrian || addr.footway || addr.street,
      addr.village || addr.suburb || addr.neighbourhood || addr.quarter,
      addr.city_district || addr.district || addr.county,
      addr.city || addr.state || "Phnom Penh",
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(", ");
    }
    return data.display_name?.split(",").slice(0, 4).join(",").trim() || `${fallbackLat.toFixed(5)}, ${fallbackLng.toFixed(5)}`;
  };

  // Reverse geocode coordinates to street address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en,km" } }
      );
      if (!res.ok) throw new Error("Geocoding service unavailable");
      const data = await res.json();
      const resolved = formatAddress(data, lat, lng);
      setAddress(resolved);
      onChangeRef.current({ address: resolved, latitude: lat, longitude: lng });
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress((prev) => prev || fallback);
      onChangeRef.current({ address: address || fallback, latitude: lat, longitude: lng });
    } finally {
      if (isMountedRef.current) setGeocoding(false);
    }
  }, [address]);

  // Update marker position on map
  const setMapMarker = useCallback((lat: number, lng: number, zoomLevel = 15, fly = true) => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (fly) {
      map.flyTo([lat, lng], zoomLevel, { duration: 1 });
    } else {
      map.setView([lat, lng], zoomLevel);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    setCoords({ lat, lng });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    isMountedRef.current = true;
    if (!mapRef.current) return;
    if ((mapRef.current as any)._leaflet_id) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      if ((mapRef.current as any)._leaflet_id) return;

      // Fix icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startLat = initialLat && !isNaN(initialLat) ? initialLat : DEFAULT_PHNOM_PENH_LAT;
      const startLng = initialLng && !isNaN(initialLng) ? initialLng : DEFAULT_PHNOM_PENH_LNG;
      const startZoom = initialLat && initialLng ? 15 : DEFAULT_ZOOM;

      const map = L.map(mapRef.current!, {
        center: [startLat, startLng],
        zoom: startZoom,
        zoomControl: true,
      });

      // Standard OSM layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom distribution depot pin icon
      const depotIcon = L.divIcon({
        html: `
          <div style="
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid #ffffff;
            box-shadow: 0 6px 14px rgba(27,67,50,0.45);
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="
              width: 14px; height: 14px;
              background: #52b788;
              border-radius: 50%;
              transform: rotate(45deg);
              box-shadow: 0 0 6px rgba(255,255,255,0.8);
            "></div>
          </div>
        `,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      // Add draggable marker
      const marker = L.marker([startLat, startLng], {
        icon: depotIcon,
        draggable: !disabled,
      }).addTo(map);

      marker.bindPopup("<b>Distribution Hub</b><br>Pickup depot for couriers.").openPopup();

      marker.on("dragend", async (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setCoords({ lat, lng });
        await reverseGeocode(lat, lng);
      });

      // Click on map to place pin
      map.on("click", async (e: any) => {
        if (disabled) return;
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        await reverseGeocode(lat, lng);
      });

      leafletMapRef.current = map;
      markerRef.current = marker;

      // If initial coordinates were provided, reverse geocode if address is empty
      if (initialLat && initialLng && !initialAddress) {
        reverseGeocode(initialLat, initialLng);
      }
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [disabled, initialAddress, initialLat, initialLng, reverseGeocode]);

  // Option 1: "Use My Current Location" (GPS)
  const handleUseCurrentLocation = () => {
    if (disabled) return;
    setStatusNotice(null);

    if (!navigator.geolocation) {
      setStatusNotice({
        type: "error",
        text: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocatingUser(false);
        setMapMarker(latitude, longitude, 16, true);
        setStatusNotice({
          type: "success",
          text: "Located your current position accurately via GPS!",
        });
        await reverseGeocode(latitude, longitude);
      },
      (err) => {
        setLocatingUser(false);
        let msg = "Could not retrieve your location.";
        if (err.code === 1) msg = "Location permission denied. Please allow location access in your browser or search manually.";
        if (err.code === 2) msg = "Location position unavailable. Please search for your address.";
        if (err.code === 3) msg = "Location request timed out. Please try again or search manually.";
        setStatusNotice({ type: "error", text: msg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Option 2: Search for somewhere
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    setStatusNotice(null);
    setShowDropdown(true);

    try {
      // Prioritize Cambodia / Phnom Penh
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&countrycodes=kh&format=json&addressdetails=1&limit=6`,
        { headers: { "Accept-Language": "en,km" } }
      );
      const data: SearchResult[] = await res.json();
      setSearchResults(data);

      if (data.length === 0) {
        setStatusNotice({
          type: "info",
          text: `No exact matches for "${query}". Try searching with a Khan or Sangkat name (e.g. "Toul Kork", "Chamkarmon").`,
        });
      }
    } catch {
      setStatusNotice({
        type: "error",
        text: "Search service is temporarily unavailable. Please click directly on the map to pin your location.",
      });
    } finally {
      setSearching(false);
    }
  };

  // Select place from search dropdown
  const handleSelectPlace = (place: SearchResult) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    const formatted = formatAddress(place, lat, lng);
    setAddress(formatted);
    setSearchQuery(formatted);
    setShowDropdown(false);
    setSearchResults([]);

    setMapMarker(lat, lng, 16, true);
    setStatusNotice({
      type: "success",
      text: `Selected: ${formatted}`,
    });

    onChangeRef.current({ address: formatted, latitude: lat, longitude: lng });
  };

  // Manual address text edit
  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);
    if (coords) {
      onChangeRef.current({
        address: val,
        latitude: coords.lat,
        longitude: coords.lng,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Leaflet CSS */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* ── Top Controls: "Use My Location" + "Search for somewhere" ── */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Button: Use My Current Location */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={disabled || locatingUser}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[#1b4332] border border-[#a5d6a7] text-xs font-black transition-all shadow-sm active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            {locatingUser ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#1b4332]" />
                <span>Locating with GPS…</span>
              </>
            ) : (
              <>
                <Crosshair size={16} className="text-[#2e7d32]" />
                <span>Use My Current Location</span>
              </>
            )}
          </button>

          {/* Search Input: Search for somewhere */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Search place, Street, Sangkat, Khan in Phnom Penh…"
                disabled={disabled}
                className="w-full pl-9 pr-20 py-2.5 text-xs font-semibold text-[#182216] bg-white border border-[#cedbd0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:border-transparent placeholder:text-gray-400 shadow-sm"
              />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowDropdown(false);
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="submit"
                disabled={disabled || searching || !searchQuery.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40"
              >
                {searching ? <Loader2 size={12} className="animate-spin" /> : "Search"}
              </button>
            </div>

            {/* Search Results Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-[1000] left-0 right-0 mt-1 bg-white border border-[#c8d6c9] rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={res.place_id}
                    type="button"
                    onClick={() => handleSelectPlace(res)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#f1f8f3] border-b border-gray-100 flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin size={14} className="text-[#2e7d32] flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#182216] truncate">{res.display_name.split(",")[0]}</p>
                      <p className="text-[11px] text-gray-500 truncate">{res.display_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Status Notice */}
        {statusNotice && (
          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${
              statusNotice.type === "success"
                ? "bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]"
                : statusNotice.type === "error"
                ? "bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]"
                : "bg-[#f0f9ff] border border-[#bae6fd] text-[#0369a1]"
            }`}
          >
            {statusNotice.type === "success" ? (
              <CheckCircle2 size={14} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={14} className="flex-shrink-0" />
            )}
            <span className="flex-1">{statusNotice.text}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* ── Interactive Map Box ── */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-[#d5e2d6] shadow-sm">
        <div ref={mapRef} className="w-full h-64 sm:h-72 z-0" />

        {/* Loading Overlay */}
        {(geocoding || locatingUser) && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center gap-2 z-[500] text-xs font-black text-[#1b4332]">
            <Loader2 size={18} className="animate-spin text-[#1b4332]" />
            <span>{locatingUser ? "Accessing GPS location…" : "Fetching street address…"}</span>
          </div>
        )}

        {/* Map Helper Pill */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#c8d6c9] text-[10px] font-bold text-[#1b4332] shadow-sm flex items-center gap-1.5 pointer-events-none">
          <Navigation size={11} className="text-[#2e7d32]" />
          <span>Click anywhere or drag marker to set exact depot pin</span>
        </div>
      </div>

      {/* ── Address & Coordinates Details ── */}
      <div className="rounded-xl bg-[#f8faf8] border border-[#dbe6dc] p-3.5 space-y-2.5">
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#435449] mb-1">
            Confirmed Hub Pickup Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={handleManualAddressChange}
              placeholder="e.g. St 271, Sangkat Phsar Doeum Thkov, Khan Chamkarmon, Phnom Penh"
              disabled={disabled}
              className="w-full pl-8 pr-3 py-2 text-xs font-bold text-[#182216] bg-white border border-[#cedbd0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332]"
            />
            <Building size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2e7d32]" />
          </div>
          <p className="mt-1 text-[10px] text-gray-500">
            Couriers in Phnom Penh will be navigated to this address to collect orders for delivery.
          </p>
        </div>

        {coords && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#e8eee8] text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
              <MapPin size={12} className="text-[#2e7d32]" />
              <span>GPS Coordinates:</span>
            </div>
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#d5e2d6] text-[#1b4332] font-bold">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
