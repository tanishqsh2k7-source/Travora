import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Itinerary } from "@travora/contracts";
import { MapPin, Navigation, Plane, Train, Bed } from "lucide-react";

interface RouteMapProps {
  itinerary: Itinerary;
}

export function RouteMap({ itinerary }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy prior map instance if re-rendering
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center (Tokyo or fallback)
    const initialLat = itinerary.journey[0]?.from.lat ?? 35.6762;
    const initialLng = itinerary.journey[0]?.from.lng ?? 139.6503;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 6,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    const latLngBounds = L.latLngBounds([]);

    // 1. Plot Stays and Journey Nodes
    const visitedPoints: Array<{ name: string; lat: number; lng: number; type: string; details: string }> = [];

    // Origin
    if (itinerary.journey.length > 0) {
      const origin = itinerary.journey[0].from;
      visitedPoints.push({
        name: origin.name,
        lat: origin.lat,
        lng: origin.lng,
        type: "origin",
        details: `Origin Departure • ${origin.city}`,
      });
    }

    // Stays
    itinerary.stays.forEach((stay, idx) => {
      visitedPoints.push({
        name: stay.hotel.name,
        lat: stay.hotel.lat,
        lng: stay.hotel.lng,
        type: "stay",
        details: `Stay ${idx + 1} (${stay.nights} nights) • ${stay.city}`,
      });
    });

    // Add numbered markers to the map
    visitedPoints.forEach((pt, idx) => {
      latLngBounds.extend([pt.lat, pt.lng]);

      const markerHtml = `
        <div style="
          background: ${pt.type === "origin" ? "#0284c7" : "#0d9488"};
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">
          ${idx + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <strong style="display:block; font-size: 14px; margin-bottom: 4px;">${pt.name}</strong>
          <span style="color: #64748b;">${pt.details}</span>
        </div>
      `);
    });

    // 2. Draw Polyline Legs
    itinerary.journey.forEach((leg) => {
      const fromCoord: [number, number] = [leg.from.lat, leg.from.lng];
      const toCoord: [number, number] = [leg.to.lat, leg.to.lng];
      latLngBounds.extend(fromCoord);
      latLngBounds.extend(toCoord);

      const isFlight = leg.mode === "flight";

      L.polyline([fromCoord, toCoord], {
        color: isFlight ? "#0284c7" : "#059669",
        weight: isFlight ? 3 : 4,
        dashArray: isFlight ? "6, 8" : undefined,
        opacity: 0.85,
      }).addTo(map).bindPopup(`
        <div style="font-family: inherit; font-size: 13px;">
          <strong>${leg.from.city} → ${leg.to.city}</strong><br />
          ${leg.mode.toUpperCase()} • ${Math.round(leg.durationMin / 60)}h ${leg.durationMin % 60}m
          ${leg.carrier ? `<br />Carrier: ${leg.carrier}` : ""}
        </div>
      `);
    });

    // Fit map to markers with padding
    if (latLngBounds.isValid()) {
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 13 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [itinerary]);

  return (
    <div className="route-map-wrapper">
      <div className="map-card-header">
        <div>
          <h3 className="map-card-title">Interactive Route Map</h3>
          <p className="map-card-subtitle">
            Visualised journey using OpenStreetMap tiles. Flight arcs dashed in sky blue; ground
            connections solid green.
          </p>
        </div>
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-line line-flight"></span> Flight Leg
          </span>
          <span className="legend-item">
            <span className="legend-line line-ground"></span> Ground / Rail Transit
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-stay"></span> Stay Base
          </span>
        </div>
      </div>

      {/* Leaflet Map Div */}
      <div className="leaflet-map-canvas" ref={mapContainerRef} style={{ height: "460px", width: "100%", borderRadius: "12px" }}></div>

      {/* Accessible Fallback Route Sequence */}
      <div className="accessible-route-summary">
        <h4 className="accessible-title">Route Sequence & Transit Details</h4>
        <ol className="accessible-steps-list">
          {itinerary.journey.map((leg, i) => (
            <li key={leg.id} className="accessible-step-item">
              <span className="step-idx">{i + 1}.</span>
              <strong className="step-route">
                {leg.from.city} to {leg.to.city}
              </strong>
              <span className="step-meta">
                ({leg.mode}, {Math.floor(leg.durationMin / 60)}h {leg.durationMin % 60}m)
                {leg.carrier ? ` via ${leg.carrier}` : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
