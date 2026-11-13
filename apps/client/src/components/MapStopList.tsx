import React, { useState } from "react";
import type { OptimizedDaySchedule } from "@travora/contracts";
import { MapPinIcon, ClockIcon, ArrowRightIcon } from "./Icons";

interface MapStopListProps {
  days: OptimizedDaySchedule[];
}

export function MapStopList({ days }: MapStopListProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  if (!days || days.length === 0) {
    return (
      <div className="map-empty">
        <p>No route stops available for this itinerary.</p>
      </div>
    );
  }

  const currentDay = days[selectedDayIdx] || days[0];

  return (
    <div className="map-view">
      {/* Day Selector */}
      <div className="map-day-selector">
        {days.map((d, idx) => (
          <button
            key={d.dayNumber}
            className={`btn btn-sm ${selectedDayIdx === idx ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setSelectedDayIdx(idx)}
          >
            Day {d.dayNumber} ({d.stops.length} stops)
          </button>
        ))}
      </div>

      <div className="map-layout">
        {/* Stops Sequence Timeline */}
        <div className="stops-sequence">
          <div className="stops-header">
            <h4>
              Day {currentDay.dayNumber} Route Order (Nearest-Neighbor Heuristic)
            </h4>
            <span className="route-total-badge">
              Total Transit Time: {currentDay.totalTravelTimeMin} mins
            </span>
          </div>

          <div className="stops-list">
            {currentDay.stops.map((stop, idx) => {
              return (
                <div key={stop.id || idx} className="stop-item-wrapper">
                  {stop.transferFromPrevMin > 0 && (
                    <div className="stop-transfer-leg">
                      <div className="leg-dots"></div>
                      <div className="leg-info">
                        <ArrowRightIcon className="w-3 h-3 text-indigo" />
                        <span>
                          Transfer ~{stop.transferFromPrevMin} min ({((stop.distanceFromPrevMeters || 1000) / 1000).toFixed(1)} km)
                        </span>
                      </div>
                      <div className="leg-dots"></div>
                    </div>
                  )}

                  <div className="stop-card">
                    <div className="stop-marker">{idx + 1}</div>
                    <div className="stop-info">
                      <strong className="stop-name">{stop.name}</strong>
                      <div className="stop-meta">
                        <span className="stop-coord">
                          <MapPinIcon className="w-3 h-3 text-muted" />
                          {stop.coordinates
                            ? `${stop.coordinates.lat.toFixed(4)}, ${stop.coordinates.lng.toFixed(4)}`
                            : "Central Zone"}
                        </span>
                        <span className="stop-time">
                          <ClockIcon className="w-3 h-3 text-muted" />
                          {stop.startLocal} ({stop.durationMin} min duration)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Map / Coordinate Canvas */}
        <div className="map-canvas-container">
          <div className="map-placeholder-card">
            <div className="map-graphic-header">
              <MapPinIcon className="w-5 h-5 text-emerald" />
              <span>Geographic Trajectory: Day {currentDay.dayNumber}</span>
            </div>
            <div className="map-svg-frame">
              <svg viewBox="0 0 400 300" className="route-svg">
                {/* Visual grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Draw connecting route path */}
                {currentDay.stops.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeDasharray="6,4"
                    points={currentDay.stops
                      .map((_, i) => {
                        const x = 50 + (i * 300) / (currentDay.stops.length - 1 || 1);
                        const y = 80 + ((i % 2) * 120) + (i * 15);
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                )}

                {/* Draw Stop Points */}
                {currentDay.stops.map((stop, i) => {
                  const x = 50 + (i * 300) / (currentDay.stops.length - 1 || 1);
                  const y = 80 + ((i % 2) * 120) + (i * 15);

                  return (
                    <g key={i} className="map-node">
                      <circle cx={x} cy={y} r="14" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                      <text x={x} y={y + 4} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                        {i + 1}
                      </text>
                      <text x={x} y={y + 24} textAnchor="middle" fill="#94a3b8" fontSize="10">
                        {stop.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="map-footer-note">
              <span>Optimized to minimize total daily transit time and avoid backtracking.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
