import React, { useState } from "react";
import type { DayPlan, DayEvent, StaySegment } from "@travora/contracts";
import {
  Sun,
  CloudRain,
  Bed,
  Moon,
  Luggage,
  Plane,
  Train,
  Car,
  Utensils,
  Landmark,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Coffee,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface DayByDayTimelineProps {
  days: DayPlan[];
  stays: StaySegment[];
  currency: string;
}

function getEventIcon(type: DayEvent["type"]) {
  switch (type) {
    case "arrival":
      return <Plane className="w-4 h-4 text-sky-600" />;
    case "departure":
      return <Plane className="w-4 h-4 text-rose-600 rotate-45" />;
    case "checkin":
      return <Bed className="w-4 h-4 text-emerald-600" />;
    case "checkout":
      return <Luggage className="w-4 h-4 text-amber-600" />;
    case "meal":
      return <Utensils className="w-4 h-4 text-orange-600" />;
    case "activity":
      return <Landmark className="w-4 h-4 text-indigo-600" />;
    case "transfer":
      return <Train className="w-4 h-4 text-blue-600" />;
    case "free":
      return <Coffee className="w-4 h-4 text-teal-600" />;
    default:
      return <Clock className="w-4 h-4 text-neutral-500" />;
  }
}

export function DayByDayTimeline({ days, stays, currency }: DayByDayTimelineProps) {
  // All days open by default for rich reading
  const [openDays, setOpenDays] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    days.forEach((d) => {
      init[d.dayNumber] = true;
    });
    return init;
  });

  const toggleDay = (dayNum: number) => {
    setOpenDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }));
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    days.forEach((d) => (next[d.dayNumber] = true));
    setOpenDays(next);
  };

  const collapseAll = () => {
    const next: Record<number, boolean> = {};
    days.forEach((d) => (next[d.dayNumber] = false));
    setOpenDays(next);
  };

  const formatCost = (minorUnits: number) => {
    return (minorUnits / 100).toLocaleString(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="day-timeline-container">
      {/* Top Controls */}
      <div className="day-timeline-toolbar">
        <div>
          <h3 className="timeline-title">Day-by-Day Journey Schedule</h3>
          <p className="timeline-subtitle">
            Chronologically organized stops with realistic buffers, opening hours validation, and
            wake-up / sleep coordinates.
          </p>
        </div>
        <div className="accordion-toggle-btns">
          <button className="btn-text-action" onClick={expandAll}>
            Expand all
          </button>
          <span className="dot-divider">•</span>
          <button className="btn-text-action" onClick={collapseAll}>
            Collapse all
          </button>
        </div>
      </div>

      {/* Days List */}
      <div className="days-stack">
        {days.map((day) => {
          const isOpen = openDays[day.dayNumber] ?? true;
          const wakeStay = stays.find((s) => s.id === day.wakeUpStayId);
          const sleepStay = stays.find((s) => s.id === day.sleepStayId);
          const activities = day.events.filter((e) => e.type === "activity");

          return (
            <div
              key={day.dayNumber}
              className={`day-accordion-card ${day.isMovingDay ? "is-moving-day" : ""}`}
            >
              {/* Accordion Header */}
              <div
                className="day-accordion-header"
                onClick={() => toggleDay(day.dayNumber)}
                role="button"
                tabIndex={0}
              >
                <div className="header-left">
                  <div className="day-pill-badge">
                    <span className="pill-day-label">Day {day.dayNumber}</span>
                  </div>

                  <div className="day-heading-info">
                    <div className="day-date-line">
                      <strong>{formatDate(day.date)}</strong>
                      <span className="day-city-tag">({day.city})</span>
                    </div>
                    <h4 className="day-theme-title">{day.theme}</h4>
                  </div>
                </div>

                <div className="header-right">
                  {/* Status Chips */}
                  <div className="day-chips-row">
                    {day.isMovingDay && (
                      <span className="chip-badge chip-moving">
                        <Luggage className="w-3.5 h-3.5 inline mr-1" />
                        Hotel Relocation Day
                      </span>
                    )}

                    {/* Weather Chip */}
                    {day.weather && (
                      <span className="chip-badge chip-weather">
                        {day.weather.summary.toLowerCase().includes("rain") ? (
                          <CloudRain className="w-3.5 h-3.5 inline mr-1 text-teal" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 inline mr-1 text-amber" />
                        )}
                        <span>
                          {day.weather.low !== undefined && day.weather.high !== undefined
                            ? `${day.weather.low}°C – ${day.weather.high}°C`
                            : day.weather.summary}
                        </span>
                      </span>
                    )}

                    {/* Wake / Sleep Chips */}
                    {wakeStay && (
                      <span className="chip-badge chip-stay" title={wakeStay.hotel.name}>
                        <Sun className="w-3 h-3 inline mr-1 text-amber" />
                        Wake: {wakeStay.city}
                      </span>
                    )}
                    {sleepStay && (
                      <span className="chip-badge chip-stay" title={sleepStay.hotel.name}>
                        <Moon className="w-3 h-3 inline mr-1 text-indigo-500" />
                        Sleep: {sleepStay.hotel.name.split(" ")[0]}
                      </span>
                    )}
                  </div>

                  <div className="accordion-arrow">
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {isOpen && (
                <div className="day-accordion-content">
                  {/* Narrative Day Plan (Magazine-Style Flow) */}
                  <div className="narrative-day-box">
                    <div className="narrative-header">
                      <FileText className="w-4 h-4 text-terracotta inline mr-2" />
                      <strong>Daily Curated Narrative</strong>
                    </div>
                    <p className="narrative-text">
                      {day.dayNumber === 1
                        ? `Touch down in ${day.city}. Clear transit and customs before checking in at ${sleepStay?.hotel.name || "your hotel"} to refresh. Spend a leisurely afternoon settling into the neighbourhood vibe with a stroll through local markets and a relaxed evening meal.`
                        : day.isMovingDay
                        ? `Morning check-out from ${wakeStay?.hotel.name || wakeStay?.city}. Board scenic transit across the country toward ${day.city}. Store your luggage or check in directly at ${sleepStay?.hotel.name || sleepStay?.city} by mid-afternoon, followed by an evening orientation walk.`
                        : day.dayNumber === days.length
                        ? `Conclude your travels across ${day.city} with a final morning of boutique shopping and souvenir collecting. Check out by 11:00 and head to the airport with comfortable 3-hour departure buffers.`
                        : `Wake up rested in ${day.city}. Today balances immersive cultural highlights with authentic dining. Explore ${activities.map((a) => a.title).join(" and ") || "key attractions"} with planned transit breaks and photo stops.`}
                    </p>

                    <div className="narrative-meta-row">
                      <div className="narrative-meta-item">
                        <Moon className="w-3.5 h-3.5 text-indigo-500 inline mr-1.5" />
                        <strong>Night Stay:</strong> {sleepStay ? `${sleepStay.hotel.name} (${sleepStay.city})` : "Return Travel"}
                      </div>
                      {activities.length > 0 && (
                        <div className="narrative-meta-item">
                          <Landmark className="w-3.5 h-3.5 text-emerald inline mr-1.5" />
                          <strong>Key Sights:</strong> {activities.map((a) => a.title).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chronological Event Timeline */}
                  <div className="events-timeline">
                    {day.events.map((ev, eIdx) => {
                      return (
                        <div key={ev.id} className={`event-timeline-item event-type-${ev.type}`}>
                          <div className="event-time-column">
                            <span className="event-start">{ev.startLocal}</span>
                            <span className="event-end">{ev.endLocal}</span>
                          </div>

                          <div className="event-marker-column">
                            <div className="event-icon-circle">{getEventIcon(ev.type)}</div>
                            {eIdx < day.events.length - 1 && <div className="event-connector-line"></div>}
                          </div>

                          <div className="event-card-column">
                            <div className="event-card-box">
                              <div className="event-card-header">
                                <div className="event-title-line">
                                  <span className={`event-type-badge type-${ev.type}`}>
                                    {ev.type.replace("_", " ").toUpperCase()}
                                  </span>
                                  <strong className="event-name">{ev.title}</strong>
                                </div>

                                {ev.cost && ev.cost.amount > 0 && (
                                  <div className="event-cost-pill">
                                    <DollarSign className="w-3 h-3 inline text-emerald" />
                                    <span>{formatCost(ev.cost.amount)}</span>
                                  </div>
                                )}
                              </div>

                              {ev.place && (
                                <div className="event-location-line">
                                  <MapPin className="w-3.5 h-3.5 text-terracotta inline mr-1" />
                                  <span>{ev.place.name}</span>
                                  {ev.place.code && <span className="place-code">({ev.place.code})</span>}
                                </div>
                              )}

                              {ev.notes && <p className="event-notes-text">{ev.notes}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Footer Summary */}
                  <div className="day-card-footer">
                    <div className="footer-left">
                      <span className="footer-stat">
                        <strong>{day.events.length}</strong> scheduled events
                      </span>
                      <span className="stat-separator">•</span>
                      <span className="footer-stat">
                        <strong>{activities.length}</strong> sightseeing stops
                      </span>
                    </div>

                    <div className="footer-right">
                      <span className="day-cost-label">Estimated Day Expenses:</span>
                      <strong className="day-cost-val">{formatCost(day.dayCost.amount)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
