"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// The right-hand map for /search. Renders a price-pill marker per result, emits
// the viewport bounds when the user pans/zooms (parent refetches with ?bounds=),
// and flies to fit a newly-picked location. If the token is missing it renders
// nothing and the parent lays out results full-width — the map never breaks the
// page. South Florida default view spans Jupiter/Stuart down to Miami.

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const SOFLO: [[number, number], [number, number]] = [
  [-80.95, 25.6],
  [-79.85, 27.35],
];

export type MapPoint = {
  mls_id: string;
  latitude: number | null;
  longitude: number | null;
  list_price: number | null;
};

function pill(v: number | null): string {
  if (!v) return "—";
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `$${m % 1 ? m.toFixed(1) : m.toFixed(0)}M`;
  }
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

export default function SearchMap({
  points,
  fitToken,
  activeId,
  onBounds,
  onMarkerClick,
}: {
  points: MapPoint[];
  fitToken: number;
  activeId: string | null;
  onBounds: (bounds: string, userMove: boolean) => void;
  onMarkerClick: (id: string) => void;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const pendingFit = useRef(false);
  const onBoundsRef = useRef(onBounds);
  const onClickRef = useRef(onMarkerClick);
  onBoundsRef.current = onBounds;
  onClickRef.current = onMarkerClick;

  // init once
  useEffect(() => {
    if (!TOKEN || !elRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: elRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      bounds: SOFLO,
      fitBoundsOptions: { padding: 0 },
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    mapRef.current = map;

    const emit = (userMove: boolean) => {
      const b = map.getBounds();
      if (!b) return;
      onBoundsRef.current(
        [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(5)).join(","),
        userMove,
      );
    };
    map.once("idle", () => emit(false)); // establish initial viewport bounds
    map.on("moveend", (e) => emit(Boolean((e as unknown as { originalEvent?: unknown }).originalEvent)));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // request a fit whenever a new location is picked
  useEffect(() => {
    if (fitToken > 0) pendingFit.current = true;
  }, [fitToken]);

  // (re)draw markers on results change; run a pending fit once points are in
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const next = new Set(points.map((p) => p.mls_id));
    // remove stale
    for (const [id, mk] of markersRef.current) {
      if (!next.has(id)) {
        mk.remove();
        markersRef.current.delete(id);
      }
    }
    // add/update
    for (const p of points) {
      if (p.latitude == null || p.longitude == null) continue;
      let mk = markersRef.current.get(p.mls_id);
      if (!mk) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "srch-mk";
        el.textContent = pill(p.list_price);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onClickRef.current(p.mls_id);
        });
        mk = new mapboxgl.Marker({ element: el }).setLngLat([p.longitude, p.latitude]);
        mk.addTo(map);
        markersRef.current.set(p.mls_id, mk);
      } else {
        mk.setLngLat([p.longitude, p.latitude]);
      }
    }

    if (pendingFit.current && points.length) {
      const pts = points.filter((p) => p.latitude != null && p.longitude != null);
      if (pts.length === 1) {
        map.easeTo({ center: [pts[0].longitude!, pts[0].latitude!], zoom: 14, duration: 600 });
      } else if (pts.length > 1) {
        const b = new mapboxgl.LngLatBounds();
        for (const p of pts) b.extend([p.longitude!, p.latitude!]);
        map.fitBounds(b, { padding: 64, maxZoom: 15, duration: 600 });
      }
      pendingFit.current = false;
    }
  }, [points]);

  // reflect the active card on the map
  useEffect(() => {
    for (const [id, mk] of markersRef.current) {
      mk.getElement().classList.toggle("srch-mk-on", id === activeId);
    }
    if (activeId) {
      const p = points.find((x) => x.mls_id === activeId);
      const map = mapRef.current;
      if (p && map && p.latitude != null && p.longitude != null) {
        map.easeTo({ center: [p.longitude, p.latitude], duration: 400 });
      }
    }
  }, [activeId, points]);

  if (!TOKEN) return null;
  return <div ref={elRef} className="srch-map-canvas" />;
}
