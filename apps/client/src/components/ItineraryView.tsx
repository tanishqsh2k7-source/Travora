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
  MapPinIcon,
} from "./Icons";

interface ItineraryViewProps {
  plan: FinalPlanResponse;
  onOpenReplanModal: () => void;
}

function format12h(time24?: string): string {
  if (!time24 || !time24.includes(":")) return time24 ?? "";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const padM = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${padM} ${period}`;
}

function formatDuration(min: number): string {
  if (!min || min <= 0) return "0m";
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  if (hours > 0 && remMin > 0) return `${hours}h ${remMin}m`;
  if (hours > 0) return `${hours}h`;
  return `${remMin}m`;
}

export function ItineraryView({ plan, onOpenReplanModal }: ItineraryViewProps) {
  const days = plan.itinerary ?? [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const currentDay = days[selectedDayIdx];
  const weather = plan.weatherForecast;
  const currentDayWeather = weather?.daily?.find((d) => d.date === currentDay?.date);

  const flight = plan.flightOptions?.[0];
  const defaultHotel = plan.hotelOptions?.[0];

  // Resolve active accommodation for the selected day
  const dayAccom = currentDay?.accommodation ?? (defaultHotel ? {
    hotelId: defaultHotel.id,
    name: defaultHotel.name,
    address: defaultHotel.address,
    rating: defaultHotel.rating,
    pricePerNight: defaultHotel.pricePerNight,
    status: selectedDayIdx === 0 ? ("check_in" as const) : selectedDayIdx + 1 === days.length ? ("check_out" as const) : ("staying" as const),
    notes: selectedDayIdx === 0 ? `Check-in from 15:00 at ${defaultHotel.name}` : selectedDayIdx + 1 === days.length ? `Check-out by 11:00 AM from ${defaultHotel.name}` : `Night stay at ${defaultHotel.name}`,
  } : undefined);

  return (
    <div className="itinerary-view">
      {/* Top Summary Banner: Flight & Accommodation Overview */}
      <div className="trip-overview-cards">
        {flight && (
          <div className="overview-card">
            <div className="card-icon flight-icon">
              <PlaneIcon className="w-5 h-5" />
            </div>
            <div className="card-details">
              <span className="card-label">Recommended Flights</span>
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

        {defaultHotel && (
          <div className="overview-card">
            <div className="card-icon hotel-icon">
              <HotelIcon className="w-5 h-5" />
            </div>
            <div className="card-details">
              <span className="card-label">Primary Lodging Base</span>
              <strong className="card-title">{defaultHotel.name}</strong>
              <span className="card-sub">
                ⭐ {defaultHotel.rating ?? 4.5} • {defaultHotel.address}
              </span>
            </div>
            <div className="card-price">
              {(defaultHotel.pricePerNight.amount / 100).toLocaleString(undefined, {
                style: "currency",
                currency: defaultHotel.pricePerNight.currency,
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
          {days.map((d, idx) => {
            const isSwitch = d.accommodation?.status === "switch_hotel";
            return (
              <button
                key={d.dayNumber}
                className={`day-tab ${selectedDayIdx === idx ? "active" : ""}`}
                onClick={() => setSelectedDayIdx(idx)}
              >
                <span className="tab-day-num">
                  Day {d.dayNumber} {isSwitch ? "🧳" : ""}
                </span>
                <span className="tab-day-date">{d.date}</span>
              </button>
            );
          })}
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onOpenReplanModal}>
          <SparklesIcon className="w-4 h-4" /> Refine / Replan
        </button>
      </div>

      {currentDay ? (
        <div className="day-content">
          {/* Day Weather & Transit Summary */}
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

          {/* Dynamic Daily Accommodation Card */}
          {dayAccom && (
            <div className={`day-hotel-banner status-${dayAccom.status}`}>
              <div className="hotel-banner-left">
                <div className={`hotel-banner-icon-box icon-${dayAccom.status}`}>
                  <HotelIcon className="w-5 h-5" />
                </div>
                <div className="hotel-banner-info">
                  <div className="hotel-banner-tag-row">
                    <span className={`hotel-status-tag tag-${dayAccom.status}`}>
                      {dayAccom.status === "check_in" && "🏨 Hotel Check-In"}
                      {dayAccom.status === "switch_hotel" && "🧳 Hotel Transfer / Switch Stay"}
                      {dayAccom.status === "check_out" && "🚪 Final Day Check-Out"}
                      {dayAccom.status === "staying" && "🌙 Night Stay Base"}
                    </span>
                    {dayAccom.rating && (
                      <span className="hotel-rating-pill">⭐ {dayAccom.rating}</span>
                    )}
                  </div>
                  <h4 className="hotel-banner-title">{dayAccom.name}</h4>
                  <p className="hotel-banner-address">
                    <MapPinIcon className="w-3.5 h-3.5 hotel-pin-icon" /> {dayAccom.address}
                  </p>
                  {dayAccom.notes && (
                    <p className="hotel-banner-notes">{dayAccom.notes}</p>
                  )}
                </div>
              </div>

              {dayAccom.pricePerNight && (
                <div className="hotel-banner-price">
                  <span className="price-val">
                    {(dayAccom.pricePerNight.amount / 100).toLocaleString(undefined, {
                      style: "currency",
                      currency: dayAccom.pricePerNight.currency,
                    })}
                  </span>
                  <span className="price-unit">/ night</span>
                </div>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="timeline-container">
            {currentDay.stops.map((stop, idx) => {
              const isLodging = stop.type === "lodging";
              const isMeal = stop.type === "meal";

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

                  <div className={`activity-card ${isLodging ? "activity-card-lodging" : isMeal ? "activity-card-meal" : ""}`}>
                    <div className="activity-time-col">
                      <div className="activity-time-window">
                        <span className="time-start">{format12h(stop.startLocal)}</span>
                        <span className="time-sep">to</span>
                        <span className="time-end">{format12h(stop.endLocal || stop.startLocal)}</span>
                      </div>
                      <span className="activity-duration">
                        <ClockIcon className="w-3 h-3" /> {formatDuration(stop.durationMin)}
                      </span>
                    </div>

                    <div className="activity-body">
                      <div className="activity-top-row">
                        <div className="activity-title-group">
                          {isLodging && <HotelIcon className="w-4 h-4 text-purple inline-icon" />}
                          <h4 className="activity-title">{stop.name}</h4>
                        </div>
                        <span className={`activity-badge badge-${stop.type || "activity"}`}>
                          {isLodging ? "HOTEL / LODGING" : isMeal ? "DINING BREAK" : stop.type ? stop.type.toUpperCase() : "ACTIVITY"}
                        </span>
                      </div>

                      {stop.notes && <p className="activity-desc">{stop.notes}</p>}

                      <div className="activity-footer">
                        <span className={`activity-cost ${isLodging ? "cost-lodging" : ""}`}>
                          {isLodging
                            ? "Stay & Luggage handling included"
                            : isMeal
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
