"use client";

import type { GroundCard } from "@cric-atlas/domain";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const SOMERSET_CENTER: L.LatLngTuple = [40.55, -74.6];
const baseStyle: L.CircleMarkerOptions = { radius: 9, color: "#fff", weight: 2, fillColor: "#16803c", fillOpacity: 0.95 };
const activeStyle: L.CircleMarkerOptions = { radius: 13, color: "#071a2f", weight: 3, fillColor: "#0b4fd0", fillOpacity: 1 };

// Built with DOM nodes so database text is never interpreted as HTML.
function popupContent(ground: GroundCard) {
  const root = document.createElement("div");
  const link = document.createElement("a");
  link.href = `/grounds/${encodeURIComponent(ground.slug)}`;
  link.textContent = ground.name;
  link.style.fontWeight = "700";
  const place = document.createElement("div");
  place.textContent = ground.locationIsApproximate ? `${ground.municipality} (approximate pin)` : ground.municipality;
  root.append(link, place);
  return root;
}

type Props = { grounds: GroundCard[]; activeId: string | null; onSelect: (id: string) => void };

export function GroundMap({ grounds, activeId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, L.CircleMarker>());
  const activeRef = useRef(activeId);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
    activeRef.current = activeId;
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(SOMERSET_CENTER, 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      // Stop running animations so they cannot fire on a removed map.
      map.stop();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    const points: L.LatLngTuple[] = [];
    for (const ground of grounds) {
      if (ground.latitude === null || ground.longitude === null) continue;
      const point: L.LatLngTuple = [ground.latitude, ground.longitude];
      points.push(point);
      const marker = L.circleMarker(point, ground.id === activeRef.current ? activeStyle : baseStyle)
        .bindTooltip(ground.name)
        .bindPopup(() => popupContent(ground))
        .on("click", () => onSelectRef.current(ground.id))
        .addTo(layer);
      markersRef.current.set(ground.id, marker);
    }
    if (points.length > 0) map.fitBounds(points, { padding: [32, 32], maxZoom: 13, animate: false });
  }, [grounds]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setStyle(id === activeId ? activeStyle : baseStyle);
      if (id === activeId) marker.bringToFront();
    }
  }, [activeId, grounds]);

  return <div ref={containerRef} role="region" aria-label="Map of cricket grounds. The ground cards below list the same results." className="size-full" />;
}
