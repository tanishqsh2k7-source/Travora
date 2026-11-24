import React, { useState, useEffect } from "react";
import type { FinalPlanResponse } from "@travora/contracts";
import { ItineraryHeader } from "./results/ItineraryHeader";
import { JourneyStrip } from "./results/JourneyStrip";
import { StaysTimeline } from "./results/StaysTimeline";
import { DayByDayTimeline } from "./results/DayByDayTimeline";
import { RouteMap } from "./results/RouteMap";
import { FlightOptionsView } from "./results/FlightOptionsView";
import { HotelOptionsView } from "./results/HotelOptionsView";
import { BudgetView } from "./BudgetView";
import "../styles/itinerary-v2.css";
import type { FlightOffer, HotelOffer } from "@travora/contracts";
import {
  Compass,
  Calendar,
  Bed,
  MapPin,
  Wallet,
  Clock,
  Sun,
  CloudRain,
  Plane,
  Building2,
  FileText,
  Moon,
  Landmark,
  Luggage,
  LogOut,
  Star,
  RotateCcw,
} from "lucide-react";

interface ItineraryViewProps {
  plan: FinalPlanResponse;
  onOpenReplanModal: () => void;
}

type ItineraryTab = "overview" | "day-by-day" | "stays" | "flights" | "hotels" | "map" | "budget";

export function ItineraryView({ plan, onOpenReplanModal }: ItineraryViewProps) {
  // Check if we have Itinerary V2
  const itineraryV2 = plan.itineraryV2;

  // Selected Flight State
  const [selectedFlightOffer, setSelectedFlightOffer] = useState<FlightOffer | undefined>(
    () => plan.flightOptions?.[0]
  );

  // Selected Hotel State
  const [selectedHotelOffer, setSelectedHotelOffer] = useState<HotelOffer | undefined>(
    () => plan.hotelOptions?.[0]
  );

  // URL-synced tab state
  const [activeTab, setActiveTab] = useState<ItineraryTab>(() => {
    const hash = window.location.hash.replace("#", "") as ItineraryTab;
    if (["overview", "day-by-day", "stays", "flights", "hotels", "map", "budget"].includes(hash)) {
      return hash;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as ItineraryTab;
    if (["overview", "day-by-day", "stays", "flights", "hotels", "map", "budget"].includes(tabParam)) {
      return tabParam;
    }
    return "overview";
  });

  const handleTabChange = (tab: ItineraryTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.hash = tab;
    window.history.replaceState(null, "", url.toString());
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as ItineraryTab;
      if (["overview", "day-by-day", "stays", "flights", "hotels", "map", "budget"].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSelectFlight = (flight: FlightOffer) => {
    setSelectedFlightOffer(flight);
    if (itineraryV2 && itineraryV2.journey.length > 0) {
      const isRoundTrip = itineraryV2.journey.some((l) => l.kind === "return");
      const outboundAmount = isRoundTrip ? Math.round(flight.price.amount * 0.52) : flight.price.amount;
      const returnAmount = flight.price.amount - outboundAmount;

      const outboundLeg = itineraryV2.journey.find((l) => l.kind === "outbound") || itineraryV2.journey[0];
      if (outboundLeg) {
        outboundLeg.carrier = flight.carrierName;
        outboundLeg.number = flight.segments[0]?.flightNumber || flight.carrier;
        outboundLeg.durationMin = flight.totalDurationMinutes;
        if (outboundLeg.cost) {
          outboundLeg.cost.amount = outboundAmount;
        }
      }

      const returnLeg = itineraryV2.journey.find((l) => l.kind === "return");
      if (returnLeg) {
        returnLeg.carrier = flight.carrierName;
        returnLeg.number = flight.segments[flight.segments.length - 1]?.flightNumber || flight.carrier;
        returnLeg.durationMin = flight.totalDurationMinutes;
        if (returnLeg.cost) {
          returnLeg.cost.amount = returnAmount;
        }
      }

      // Recalculate estimated total
      const totalStays = itineraryV2.stays.reduce((acc, s) => acc + s.hotel.total.amount, 0);
      const totalJourney = itineraryV2.journey.reduce((acc, j) => acc + (j.cost?.amount || 0), 0);
      const totalActivities = itineraryV2.days.reduce(
        (acc, d) => acc + d.events.reduce((eAcc, e) => eAcc + (e.cost?.amount || 0), 0),
        0
      );
      itineraryV2.summary.estimatedTotal.amount = totalStays + totalJourney + totalActivities;
    }
  };

  const handleSelectHotel = (hotel: HotelOffer, targetStayId?: string) => {
    setSelectedHotelOffer(hotel);
    if (itineraryV2 && itineraryV2.stays.length > 0) {
      const stay = targetStayId
        ? itineraryV2.stays.find((s) => s.id === targetStayId) || itineraryV2.stays[0]
        : itineraryV2.stays[0];

      if (stay) {
        stay.hotel.name = hotel.name;
        if (hotel.address) stay.hotel.address = hotel.address;
        if (hotel.stars) stay.hotel.stars = hotel.stars;
        stay.hotel.nightlyPrice = {
          amount: hotel.pricePerNight.amount,
          currency: hotel.pricePerNight.currency,
          source: "live_offer",
          fetchedAt: new Date().toISOString(),
          kind: "live_offer",
        };
        stay.hotel.total = {
          amount: hotel.pricePerNight.amount * stay.nights,
          currency: hotel.pricePerNight.currency,
          source: "live_offer",
          fetchedAt: new Date().toISOString(),
          kind: "live_offer",
        };

        // Recalculate estimated total
        const totalStays = itineraryV2.stays.reduce((acc, s) => acc + s.hotel.total.amount, 0);
        const totalJourney = itineraryV2.journey.reduce((acc, j) => acc + (j.cost?.amount || 0), 0);
        const totalActivities = itineraryV2.days.reduce(
          (acc, d) => acc + d.events.reduce((eAcc, e) => eAcc + (e.cost?.amount || 0), 0),
          0
        );
        itineraryV2.summary.estimatedTotal.amount = totalStays + totalJourney + totalActivities;
      }
    }
  };

  // -------------------------------------------------------------
  // If we have Itinerary V2, render the new rich editorial view
  // -------------------------------------------------------------
  if (itineraryV2) {
    return (
      <div className="itinerary-v2-container">
        {/* Editorial Header Band */}
        <ItineraryHeader
          itinerary={itineraryV2}
          onOpenReplanModal={onOpenReplanModal}
        />

        {/* 5 Synchronized Tabs */}
        <div className="itinerary-nav-tabs-bar">
          <button
            className={`nav-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            <Compass className="w-4 h-4 mr-2" /> Overview
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "day-by-day" ? "active" : ""}`}
            onClick={() => handleTabChange("day-by-day")}
          >
            <Calendar className="w-4 h-4 mr-2" /> Day by Day ({itineraryV2.days.length})
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "stays" ? "active" : ""}`}
            onClick={() => handleTabChange("stays")}
          >
            <Bed className="w-4 h-4 mr-2" /> Stays ({itineraryV2.stays.length})
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "flights" ? "active" : ""}`}
            onClick={() => handleTabChange("flights")}
          >
            <Plane className="w-4 h-4 mr-2" /> Flight Choices
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "hotels" ? "active" : ""}`}
            onClick={() => handleTabChange("hotels")}
          >
            <Building2 className="w-4 h-4 mr-2" /> Hotel Options
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "map" ? "active" : ""}`}
            onClick={() => handleTabChange("map")}
          >
            <MapPin className="w-4 h-4 mr-2" /> Map & Route
          </button>

          <button
            className={`nav-tab-btn ${activeTab === "budget" ? "active" : ""}`}
            onClick={() => handleTabChange("budget")}
          >
            <Wallet className="w-4 h-4 mr-2" /> Budget
          </button>
        </div>

        {/* Tab Contents */}
        <div className="itinerary-tab-panels">
          {activeTab === "overview" && (
            <div className="tab-pane overview-pane">
              <JourneyStrip
                itinerary={itineraryV2}
                onViewFlights={() => handleTabChange("flights")}
              />
              <div className="overview-day-preview-section">
                <div className="section-head">
                  <h3 className="section-title">Schedule Highlights</h3>
                  <button
                    className="btn-text-action"
                    onClick={() => handleTabChange("day-by-day")}
                  >
                    View detailed day-by-day plan →
                  </button>
                </div>
                <DayByDayTimeline
                  days={itineraryV2.days.slice(0, 3)}
                  stays={itineraryV2.stays}
                  currency={itineraryV2.currency}
                />
              </div>
            </div>
          )}

          {activeTab === "day-by-day" && (
            <div className="tab-pane day-by-day-pane">
              <DayByDayTimeline
                days={itineraryV2.days}
                stays={itineraryV2.stays}
                currency={itineraryV2.currency}
              />
            </div>
          )}

          {activeTab === "stays" && (
            <div className="tab-pane stays-pane">
              <StaysTimeline
                stays={itineraryV2.stays}
                transitions={itineraryV2.transitions}
                currency={itineraryV2.currency}
                onViewHotels={() => handleTabChange("hotels")}
              />
            </div>
          )}

          {activeTab === "flights" && (
            <div className="tab-pane flights-pane">
              <FlightOptionsView
                flightOptions={plan.flightOptions}
                selectedFlightId={selectedFlightOffer?.id}
                onSelectFlight={handleSelectFlight}
                currency={itineraryV2.currency}
                itinerary={itineraryV2}
                destination={plan.destination}
              />
            </div>
          )}

          {activeTab === "hotels" && (
            <div className="tab-pane hotels-pane">
              <HotelOptionsView
                hotelOptions={plan.hotelOptions || []}
                selectedHotelName={selectedHotelOffer?.name}
                onSelectHotel={handleSelectHotel}
                currency={itineraryV2.currency}
                itinerary={itineraryV2}
              />
            </div>
          )}

          {activeTab === "map" && (
            <div className="tab-pane map-pane">
              <RouteMap itinerary={itineraryV2} />
            </div>
          )}

          {activeTab === "budget" && (
            <div className="tab-pane budget-pane">
              <BudgetView budget={plan.budgetBreakdown} />
            </div>
          )}
        </div>

        {/* Print-Only Comprehensive Dossier (Visible only during window.print()) */}
        <div className="print-only-itinerary-dossier" aria-hidden="true">
          <div className="print-dossier-header">
            <div className="print-brand-line">
              <span className="print-brand-name">TRAVORA</span>
              <span className="print-dossier-tag">Curated Itinerary</span>
            </div>
            <h1 className="print-trip-title">{itineraryV2.summary.title}</h1>
            <div className="print-meta-grid">
              <div className="print-meta-item">
                <strong>Dates:</strong> {itineraryV2.startDate} to {itineraryV2.endDate} ({itineraryV2.nights} nights)
              </div>
              <div className="print-meta-item">
                <strong>Party:</strong> {itineraryV2.travellers.adults} Adults {itineraryV2.travellers.children > 0 ? `, ${itineraryV2.travellers.children} Children` : ""}
              </div>
              <div className="print-meta-item">
                <strong>Est. Total:</strong> {(itineraryV2.summary.estimatedTotal.amount / 100).toLocaleString(undefined, { style: "currency", currency: itineraryV2.currency })}
              </div>
            </div>
          </div>

          <div className="print-section">
            <h2 className="print-section-heading">Hotel & Lodging Bases</h2>
            <div className="print-stays-summary">
              {itineraryV2.stays.map((stay, idx) => (
                <div key={stay.id} className="print-stay-item">
                  <strong>Stay {idx + 1}: {stay.hotel.name}</strong> ({stay.city}) — {stay.nights} nights ({stay.checkInDate} to {stay.checkOutDate})
                  {stay.hotel.address && <p className="print-stay-addr">{stay.hotel.address}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="print-section">
            <h2 className="print-section-heading">Complete Day-by-Day Journey</h2>
            <DayByDayTimeline
              days={itineraryV2.days}
              stays={itineraryV2.stays}
              currency={itineraryV2.currency}
            />
          </div>

          <div className="print-footer-mark">
            <span>Generated with Travora Travel • All timings in local destination zones</span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Backward compatibility fallback for V1 itinerary
  // -------------------------------------------------------------
  const days = plan.itinerary ?? [];
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const currentDay = days[selectedDayIdx];
  const weather = plan.weatherForecast;
  const currentDayWeather =
    weather?.daily?.find((d) => d.date === currentDay?.date) ??
    weather?.daily?.[selectedDayIdx] ??
    weather?.daily?.[0];

  const flight = plan.flightOptions?.[0];
  const defaultHotel = plan.hotelOptions?.[0];

  const dayAccom = currentDay?.accommodation
    ? {
        name: currentDay.accommodation.name,
        address: currentDay.accommodation.address,
        pricePerNight: currentDay.accommodation.pricePerNight,
        status: currentDay.accommodation.status,
        rating: currentDay.accommodation.rating,
        notes: currentDay.accommodation.notes,
      }
    : defaultHotel
    ? {
        name: defaultHotel.name,
        address: defaultHotel.address,
        pricePerNight: defaultHotel.pricePerNight,
        status: selectedDayIdx === 0 ? "check_in" : selectedDayIdx === days.length - 1 ? "check_out" : "staying",
        rating: defaultHotel.rating,
        notes: defaultHotel.hotelStyle ? `${defaultHotel.hotelStyle} base accommodation` : undefined,
      }
    : null;

  return (
    <div className="itinerary-view">
      <div className="itinerary-top-bar">
        {flight && (
          <div className="top-flight-card">
            <div className="top-flight-icon-box">
              <Plane className="w-5 h-5 text-sky-600" />
            </div>
            <div className="top-flight-details">
              <span className="card-sub-label">Recommended Flights</span>
              <strong className="top-flight-carrier">{flight.carrierName} ({flight.carrier})</strong>
              <div className="top-flight-route">
                <span>{flight.origin} → {flight.destination}</span>
                <span className="dot-sep">•</span>
                <span>{Math.floor(flight.totalDurationMinutes / 60)}h {flight.totalDurationMinutes % 60}m</span>
                <span className="dot-sep">•</span>
                <span className="badge-stops">{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}</span>
              </div>
            </div>
            <div className="top-flight-price">
              {(flight.price.amount / 100).toLocaleString(undefined, {
                style: "currency",
                currency: flight.price.currency,
              })}
            </div>
          </div>
        )}

        {defaultHotel && (
          <div className="top-hotel-card">
            <div className="top-hotel-icon-box">
              <Building2 className="w-5 h-5 text-terracotta" />
            </div>
            <div className="top-hotel-details">
              <span className="card-sub-label">Primary Lodging Base</span>
              <strong className="top-hotel-name">{defaultHotel.name}</strong>
              <div className="top-hotel-meta">
                {defaultHotel.rating && (
                  <span className="rating-pill">
                    <Star className="w-3 h-3 inline text-amber fill-amber mr-1" />
                    {defaultHotel.rating}
                  </span>
                )}
                <span className="hotel-addr-text">{defaultHotel.address}</span>
              </div>
            </div>
            <div className="top-hotel-price">
              <span className="val">
                {(defaultHotel.pricePerNight.amount / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: defaultHotel.pricePerNight.currency,
                })}
              </span>
              <span className="unit">/night</span>
            </div>
          </div>
        )}
      </div>

      <div className="day-selector-strip">
        <div className="day-tabs-wrapper">
          {days.map((d, idx) => (
            <button
              key={d.dayNumber}
              className={`day-selector-tab ${selectedDayIdx === idx ? "active" : ""}`}
              onClick={() => setSelectedDayIdx(idx)}
            >
              <div className="tab-day-number">Day {d.dayNumber}</div>
              <div className="tab-date">{d.date}</div>
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onOpenReplanModal}>
          <RotateCcw className="w-4 h-4 mr-1.5" /> Adjust itinerary
        </button>
      </div>

      {currentDay && (
        <div className="day-content">
          <div className="day-weather-bar">
            <div className="weather-forecast">
              {currentDayWeather?.isRainy ? (
                <CloudRain className="w-5 h-5 text-teal" />
              ) : (
                <Sun className="w-5 h-5 text-amber" />
              )}
              <span className="weather-text">
                <strong>{currentDayWeather?.condition ?? "Pleasant weather"}</strong>
                {currentDayWeather && (
                  <> • {currentDayWeather.tempMinC}°C to {currentDayWeather.tempMaxC}°C</>
                )}
              </span>
            </div>
            <div className="day-stats">
              <span>{currentDay.stops.length} Stops</span> •{" "}
              <span>~{currentDay.totalTravelTimeMin} mins transit</span>
            </div>
          </div>

          <div className="explained-day-card">
            <div className="explained-day-header">
              <h3 className="explained-day-title">
                Day {currentDay.dayNumber} – Itinerary {currentDay.theme ? `(${currentDay.theme})` : ""}
              </h3>
            </div>
            <div className="explained-day-body">
              {currentDay.dayPlan && (
                <div className="explained-day-row">
                  <span className="explained-row-icon">
                    <FileText className="w-4 h-4 text-terracotta" />
                  </span>
                  <div className="explained-row-content">
                    <strong>Day plan:</strong> {currentDay.dayPlan}
                  </div>
                </div>
              )}
              <div className="explained-day-row">
                <span className="explained-row-icon">
                  <Moon className="w-4 h-4 text-indigo-600" />
                </span>
                <div className="explained-row-content">
                  <strong>Night stay:</strong> {currentDay.nightStay || dayAccom?.name || "Local Base Stay"}
                </div>
              </div>
              {((currentDay.attractions && currentDay.attractions.length > 0) ||
                currentDay.stops.filter((s) => s.type === "activity").length > 0) && (
                <div className="explained-day-row">
                  <span className="explained-row-icon">
                    <Landmark className="w-4 h-4 text-teal" />
                  </span>
                  <div className="explained-row-content">
                    <strong>Attractions:</strong>{" "}
                    {currentDay.attractions && currentDay.attractions.length > 0
                      ? currentDay.attractions.join(", ")
                      : currentDay.stops
                          .filter((s) => s.type === "activity")
                          .map((s) => s.name)
                          .join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="stops-timeline">
            {currentDay.stops.map((stop) => (
              <div key={stop.id} className="timeline-stop-item">
                <div className="stop-time">
                  <span className="time-val">{stop.startLocal}</span>
                  <span className="time-duration">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {stop.durationMin}m
                  </span>
                </div>
                <div className="stop-card">
                  <h4 className="stop-name">{stop.name}</h4>
                  <p className="stop-desc">{stop.notes || "Scheduled activity visit"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default ItineraryView;
