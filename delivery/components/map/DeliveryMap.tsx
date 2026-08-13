"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, LoaderCircle, MapPin } from "lucide-react";
import type { DeliveryLocation } from "@/lib/types";

export function DeliveryMap({ destination }: { destination: DeliveryLocation }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import("leaflet").Map | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(
    destination.coordinates ? "loading" : "missing"
  );

  useEffect(() => {
    if (!destination.coordinates) {
      return;
    }
    let cancelled = false;

    import("leaflet")
      .then((module) => {
        if (cancelled || !mapNode.current || mapInstance.current) return;
        const L = module.default;
        const { latitude, longitude } = destination.coordinates!;
        const map = L.map(mapNode.current, {
          center: [latitude, longitude],
          zoom: 15,
          zoomControl: true,
          dragging: true,
          scrollWheelZoom: false,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        const marker = L.divIcon({
          className: "",
          html: `<div aria-hidden="true" style="width:42px;height:42px;border-radius:16px 16px 16px 4px;background:#2e6f40;border:4px solid #fff;box-shadow:0 8px 22px rgba(31,81,48,.28);transform:rotate(-45deg);display:grid;place-items:center"><span style="width:10px;height:10px;border-radius:50%;background:#dff0a9;display:block"></span></div>`,
          iconSize: [42, 42],
          iconAnchor: [19, 39],
        });
        L.marker([latitude, longitude], { icon: marker })
          .addTo(map)
          .bindPopup(`<strong>${destination.label}</strong><br/><span>${destination.address}</span>`)
          .openPopup();
        mapInstance.current = map;
        window.setTimeout(() => map.invalidateSize(), 80);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [destination]);

  const directionsUrl = destination.coordinates
    ? `https://www.openstreetmap.org/directions?to=${destination.coordinates.latitude}%2C${destination.coordinates.longitude}`
    : null;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#83907f]">Destination map</p>
          <h2 className="mt-1 truncate text-base font-extrabold">{destination.address}</h2>
        </div>
        <MapPin size={20} className="mt-1 shrink-0 text-[var(--leaf)]" aria-hidden="true" />
      </div>
      <div className="relative min-h-[280px] bg-[#e8eee3] sm:min-h-[340px]">
        <div ref={mapNode} className="absolute inset-0" aria-label={`Map showing ${destination.address}`} />
        {state === "loading" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#eef2ea] text-center">
            <div><LoaderCircle className="mx-auto animate-spin text-[var(--leaf)]" size={25} /><p className="mt-3 text-sm font-bold text-[var(--muted)]">Loading destination map…</p></div>
          </div>
        )}
        {(state === "missing" || state === "error") && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-[#f3f5f0] px-6 text-center">
            <div><AlertTriangle className="mx-auto text-[var(--amber)]" size={26} /><p className="mt-3 font-extrabold">Map unavailable</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{state === "missing" ? "No coordinates were provided. Use the written address above." : "The map couldn't load. The destination address is still available above."}</p></div>
          </div>
        )}
      </div>
      {directionsUrl && (
        <div className="p-4">
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--line)] bg-white px-5 py-3 text-sm font-extrabold text-[var(--ink)] transition hover:border-[#b8c8b0] hover:bg-[#f8fbf5] active:scale-[0.99]">
            <ExternalLink size={17} aria-hidden="true" />Open directions
          </a>
        </div>
      )}
    </section>
  );
}
