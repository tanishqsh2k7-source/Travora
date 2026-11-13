import React, { useState } from "react";
import type { FinalPlanResponse } from "@travora/contracts";
import {
  ClockIcon,
  SunIcon,
  CloudRainIcon,
  ArrowRightIcon,
  SparklesIcon,
  PlaneIcon,
  HotelIcon,
} from "./Icons";

interface ItineraryViewProps {
  plan: FinalPlanResponse;
  onOpenReplanModal: () => void;
}

export function ItineraryView({ plan, onOpenReplanModal }: ItineraryViewProps) {
  const days = plan.itinerary ?? [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const currentDay = days[selectedDayIdx];
  const weather = plan.weatherForecast;
  const currentDayWeather = weather?.daily?.find((d) => d.date === currentDay?.date);

  const flight = plan.flightOptions?.[0];
  const hotel = plan.hotelOptions?.[0];

  return (
    <div className="itinerary-view">
      {/* Top Summary Banner: Flight & Hotel Badges */}
      <div className="trip-overview-cards">
        {flight && (
          <div className="overview-card">
            <div className="card-icon flight-icon">
              <PlaneIcon className="w-5 h-5" />
            </div>
            <div className="card-details">
              <span className="card-label">Recommended Flight</span>
              <strong className="card-title">
                {flight.carrierName} ({flight.carrier})
              </strong>
              <span className="card-sub">
                {flight.origin} → {flight.destination} •{" "}
                {flight.totalDurationMinutes
                  ? `${Math.round(flight.totalDurationMinutes / 60)}h ${flight.totalDurationMinutes % 60}m`
                  : "Direct"}{" "}
                ({flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`})
              </span>
            </div>
            <div className="card-price">
              {(flight.price.amount / 100).toLocaleString(undefined, {
                style: "currency",
                currency: flight.price.currency,
              })}
            </div>
          </div>
        )}

        {hotel && (
          <div className="overview-card">
            <div className="card-icon hotel-icon">
              <HotelIcon className="w-5 h-5" />
            </div>
            <div className="card-details">
              <span className="card-label">Recommended Stay</span>
              <strong className="card-title">{hotel.name}</strong>
              <span className="card-sub">
                ⭐ {hotel.rating ?? 4.5} • {hotel.address}
              </span>
            </div>
            <div className="card-price">
              {(hotel.pricePerNight.amount / 100).toLocaleString(undefined, {
                style: "currency",
                currency: hotel.pricePerNight.currency,
              })}
              <span className="per-night">/night</span>
            </div>
          </div>
        )}
      </div>

      {/* Plan Summary / Disruption Notes */}
      {plan.summary && (
        <div className="replan-banner">
          <SparklesIcon className="w-5 h-5 text-amber" />
          <div className="replan-info">
            <strong>Plan Overview:</strong> {plan.summary}
          </div>
        </div>
      )}

      {/* Day Selector Tabs */}
      <div className="day-tabs-container">
        <div className="day-tabs">
          {days.map((d, idx) => (
            <button
              key={d.dayNumber}
              className={`day-tab ${selectedDayIdx === idx ? "active" : ""}`}
              onClick={() => setSelectedDayIdx(idx)}
            >
              <span className="tab-day-num">Day {d.dayNumber}</span>
              <span className="tab-day-date">{d.date}</span>
            </button>
          ))}
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onOpenReplanModal}>
          <SparklesIcon className="w-4 h-4" /> Refine / Replan
        </button>
      </div>

      {currentDay ? (
        <div className="day-content">
          {/* Day Weather Banner */}
          <div className="day-weather-bar">
            <div className="weather-forecast">
              {currentDayWeather?.isRainy ? (
                <CloudRainIcon className="w-5 h-5 text-blue" />
              ) : (
                <SunIcon className="w-5 h-5 text-amber" />
              )}
              <span className="weather-text">
                <strong>{currentDayWeather?.condition ?? "Pleasant weather"}</strong> •{" "}
                {currentDayWeather ? `${currentDayWeather.tempMinC}°C - ${currentDayWeather.tempMaxC}°C` : "18°C - 24°C"}
                {currentDayWeather?.isRainy && " (Rain advisory active)"}
              </span>
            </div>
            <div className="day-stats">
              <span>{currentDay.stops.length} Stops</span> •{" "}
              <span>~{currentDay.totalTravelTimeMin} mins transit</span>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="timeline-container">
            {currentDay.stops.map((stop, idx) => {
              return (
                <React.Fragment key={stop.id || idx}>
                  {/* Transfer connector before this stop (if any) */}
                  {stop.transferFromPrevMin > 0 && (
                    <div className="transfer-connector">
                      <div className="connector-line"></div>
                      <div className="transfer-pill">
                        <ArrowRightIcon className="w-3 h-3" />
                        <span>
                          Transfer • {stop.transferFromPrevMin} mins ({((stop.distanceFromPrevMeters || 1000) / 1000).toFixed(1)} km)
                        </span>
                      </div>
                      <div className="connector-line"></div>
                    </div>
                  )}

                  <div className="activity-card">
                    <div className="activity-time-col">
                      <span className="activity-time">{stop.startLocal}</span>
                      <span className="activity-duration">
                        <ClockIcon className="w-3 h-3" /> {stop.durationMin}m
                      </span>
                    </div>

                    <div className="activity-body">
                      <div className="activity-top-row">
                        <h4 className="activity-title">{stop.name}</h4>
                        <span className="activity-badge">
                          {stop.type ? stop.type.toUpperCase() : "ACTIVITY"}
                        </span>
                      </div>

                      {stop.notes && <p className="activity-desc">{stop.notes}</p>}

                      <div className="activity-footer">
                        <span className="activity-cost">
                          {stop.type === "meal"
                            ? "Estimated dining budget included"
                            : "Scheduled visit & admission"}
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-day">No activities planned for this day.</div>
      )}
    </div>
  );
}
