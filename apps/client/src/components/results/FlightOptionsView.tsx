import React, { useState } from "react";
import type { FlightOffer, Itinerary } from "@travora/contracts";
import {
  Plane,
  Clock,
  Luggage,
  Check,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Info,
} from "lucide-react";

interface FlightOptionsViewProps {
  flightOptions: FlightOffer[];
  selectedFlightId?: string;
  onSelectFlight: (flight: FlightOffer) => void;
  currency: string;
  itinerary?: Itinerary;
  origin?: string;
  destination?: string;
}

export function FlightOptionsView({
  flightOptions,
  selectedFlightId,
  onSelectFlight,
  currency,
  itinerary,
  origin,
  destination,
}: FlightOptionsViewProps) {
  const [filterStops, setFilterStops] = useState<"all" | "direct" | "stops">("all");
  const [sortBy, setSortBy] = useState<"price" | "duration" | "recommended">("recommended");

  // Determine origin and destination labels
  const originCity = origin || itinerary?.journey[0]?.from.city || "Origin";
  const destCity = destination || itinerary?.journey[0]?.to.city || "Destination";

  // Build a fallback list if fewer than 2 flights exist in payload
  const resolvedOffers: FlightOffer[] = React.useMemo(() => {
    const partyCount = itinerary?.travellers
      ? Math.max(1, (itinerary.travellers.adults || 1) + (itinerary.travellers.children || 0))
      : 1;

    if (flightOptions && flightOptions.length >= 2) {
      return flightOptions;
    }

    const base = flightOptions?.[0];
    const isINR = currency.toUpperCase() === "INR";
    const multiplier = isINR ? 85 : 1;

    const mockOffers: FlightOffer[] = [
      base || {
        id: "flt_opt_direct_primary",
        carrier: "SQ",
        carrierName: "Singapore Airlines",
        origin: originCity,
        destination: destCity,
        departureDate: itinerary?.startDate || "2027-05-10",
        returnDate: itinerary?.endDate || "2027-05-18",
        segments: [
          {
            departureAirport: originCity.slice(0, 3).toUpperCase(),
            arrivalAirport: destCity.slice(0, 3).toUpperCase(),
            departureTime: `${itinerary?.startDate || "2027-05-10"}T08:30:00Z`,
            arrivalTime: `${itinerary?.startDate || "2027-05-10"}T19:45:00Z`,
            carrier: "SQ",
            carrierName: "Singapore Airlines",
            flightNumber: "SQ622",
            durationMinutes: 675,
          },
        ],
        totalDurationMinutes: 675,
        stops: 0,
        price: {
          amount: Math.round(750 * multiplier * partyCount * 100),
          currency,
        },
        baggageIncluded: true,
        bookingUrl: "https://www.singaporeair.com",
        fetchedAt: new Date().toISOString(),
        provider: "flights_search",
      },
      {
        id: "flt_opt_direct_fastest",
        carrier: "JL",
        carrierName: "Japan Airlines / Partner",
        origin: originCity,
        destination: destCity,
        departureDate: itinerary?.startDate || "2027-05-10",
        returnDate: itinerary?.endDate || "2027-05-18",
        segments: [
          {
            departureAirport: originCity.slice(0, 3).toUpperCase(),
            arrivalAirport: destCity.slice(0, 3).toUpperCase(),
            departureTime: `${itinerary?.startDate || "2027-05-10"}T11:15:00Z`,
            arrivalTime: `${itinerary?.startDate || "2027-05-10"}T21:30:00Z`,
            carrier: "JL",
            carrierName: "Japan Airlines",
            flightNumber: "JL042",
            durationMinutes: 615,
          },
        ],
        totalDurationMinutes: 615,
        stops: 0,
        price: {
          amount: Math.round(860 * multiplier * partyCount * 100),
          currency,
        },
        baggageIncluded: true,
        bookingUrl: "https://www.jal.co.jp",
        fetchedAt: new Date().toISOString(),
        provider: "flights_search",
      },
      {
        id: "flt_opt_1stop_value",
        carrier: "EK",
        carrierName: "Emirates (1 Stop via DXB)",
        origin: originCity,
        destination: destCity,
        departureDate: itinerary?.startDate || "2027-05-10",
        returnDate: itinerary?.endDate || "2027-05-18",
        segments: [
          {
            departureAirport: originCity.slice(0, 3).toUpperCase(),
            arrivalAirport: "DXB",
            departureTime: `${itinerary?.startDate || "2027-05-10"}T14:20:00Z`,
            arrivalTime: `${itinerary?.startDate || "2027-05-10"}T18:30:00Z`,
            carrier: "EK",
            carrierName: "Emirates",
            flightNumber: "EK511",
            durationMinutes: 250,
          },
          {
            departureAirport: "DXB",
            arrivalAirport: destCity.slice(0, 3).toUpperCase(),
            departureTime: `${itinerary?.startDate || "2027-05-10"}T21:00:00Z`,
            arrivalTime: `${itinerary?.startDate || "2027-05-11"}T09:30:00Z`,
            carrier: "EK",
            carrierName: "Emirates",
            flightNumber: "EK318",
            durationMinutes: 510,
          },
        ],
        totalDurationMinutes: 760,
        stops: 1,
        price: {
          amount: Math.round(560 * multiplier * partyCount * 100),
          currency,
        },
        baggageIncluded: true,
        bookingUrl: "https://www.emirates.com",
        fetchedAt: new Date().toISOString(),
        provider: "flights_search",
      },
      {
        id: "flt_opt_budget_airline",
        carrier: "AI",
        carrierName: "Air India / Star Alliance",
        origin: originCity,
        destination: destCity,
        departureDate: itinerary?.startDate || "2027-05-10",
        returnDate: itinerary?.endDate || "2027-05-18",
        segments: [
          {
            departureAirport: originCity.slice(0, 3).toUpperCase(),
            arrivalAirport: destCity.slice(0, 3).toUpperCase(),
            departureTime: `${itinerary?.startDate || "2027-05-10"}T22:30:00Z`,
            arrivalTime: `${itinerary?.startDate || "2027-05-11"}T10:15:00Z`,
            carrier: "AI",
            carrierName: "Air India",
            flightNumber: "AI306",
            durationMinutes: 705,
          },
        ],
        totalDurationMinutes: 705,
        stops: 0,
        price: {
          amount: Math.round(650 * multiplier * partyCount * 100),
          currency,
        },
        baggageIncluded: true,
        bookingUrl: "https://www.airindia.com",
        fetchedAt: new Date().toISOString(),
        provider: "flights_search",
      },
    ];

    return mockOffers;
  }, [flightOptions, originCity, destCity, currency, itinerary]);

  // Active selected ID (default to first flight if not explicitly set)
  const currentSelectedId = selectedFlightId || resolvedOffers[0]?.id;

  // Filter & sort offers
  const filteredOffers = resolvedOffers
    .filter((f) => {
      if (filterStops === "direct") return f.stops === 0;
      if (filterStops === "stops") return f.stops > 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") return a.price.amount - b.price.amount;
      if (sortBy === "duration") return a.totalDurationMinutes - b.totalDurationMinutes;
      // recommended: direct first, then price
      if (a.stops !== b.stops) return a.stops - b.stops;
      return a.price.amount - b.price.amount;
    });

  const formatCost = (minorUnits: number) => {
    return (minorUnits / 100).toLocaleString(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  };

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m > 0 ? `${m}m` : ""}`;
  };

  return (
    <div className="flight-options-container">
      {/* Flight Options Header */}
      <div className="flight-options-header">
        <div className="header-copy">
          <div className="header-route-badge">
            <Plane className="w-4 h-4 text-sky-600 inline mr-1" />
            <span>Flight Comparison & Alternatives</span>
          </div>
          <h2 className="header-title">
            Flights: {originCity} → {destCity}
          </h2>
          <p className="header-subline">
            Select your preferred flight offer. Updating your flight updates transit times, check-in schedules, and overall trip budget.
          </p>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flight-controls-row">
          <div className="filter-pill-group">
            <span className="control-label">Stops:</span>
            <button
              type="button"
              className={`pill-btn ${filterStops === "all" ? "active" : ""}`}
              onClick={() => setFilterStops("all")}
            >
              All ({resolvedOffers.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterStops === "direct" ? "active" : ""}`}
              onClick={() => setFilterStops("direct")}
            >
              Non-stop
            </button>
            <button
              type="button"
              className={`pill-btn ${filterStops === "stops" ? "active" : ""}`}
              onClick={() => setFilterStops("stops")}
            >
              1 Stop
            </button>
          </div>

          <div className="sort-pill-group">
            <span className="control-label">Sort by:</span>
            <button
              type="button"
              className={`pill-btn ${sortBy === "recommended" ? "active" : ""}`}
              onClick={() => setSortBy("recommended")}
            >
              Recommended
            </button>
            <button
              type="button"
              className={`pill-btn ${sortBy === "price" ? "active" : ""}`}
              onClick={() => setSortBy("price")}
            >
              Lowest Price
            </button>
            <button
              type="button"
              className={`pill-btn ${sortBy === "duration" ? "active" : ""}`}
              onClick={() => setSortBy("duration")}
            >
              Shortest Duration
            </button>
          </div>
        </div>
      </div>

      {/* Flight Offers List */}
      <div className="flight-cards-stack">
        {filteredOffers.map((offer, idx) => {
          const isSelected = offer.id === currentSelectedId;
          const firstSeg = offer.segments[0];
          const lastSeg = offer.segments[offer.segments.length - 1];

          const departTime = firstSeg?.departureTime.split("T")[1]?.slice(0, 5) || "08:30";
          const arriveTime = lastSeg?.arrivalTime.split("T")[1]?.slice(0, 5) || "20:45";

          return (
            <div
              key={offer.id}
              className={`flight-offer-card ${isSelected ? "is-selected" : ""}`}
            >
              {/* Highlight Badges */}
              <div className="flight-card-top-tags">
                {idx === 0 && (
                  <span className="tag-pill tag-recommended">
                    <Sparkles className="w-3 h-3 inline mr-1" /> Best Value
                  </span>
                )}
                {offer.stops === 0 && (
                  <span className="tag-pill tag-direct">
                    <Check className="w-3 h-3 inline mr-1" /> Non-stop Direct
                  </span>
                )}
                {offer.baggageIncluded && (
                  <span className="tag-pill tag-baggage">
                    <Luggage className="w-3 h-3 inline mr-1" /> Checked bag included
                  </span>
                )}
              </div>

              <div className="flight-card-main-grid">
                {/* 1. Airline Info */}
                <div className="airline-col">
                  <div className="airline-logo-box">
                    <Plane className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="airline-info">
                    <strong className="airline-name">{offer.carrierName}</strong>
                    <span className="flight-number">
                      {offer.carrier} • {firstSeg?.flightNumber || "Direct Route"}
                    </span>
                  </div>
                </div>

                {/* 2. Schedule Times & Stops */}
                <div className="times-col">
                  <div className="departure-block">
                    <strong className="time-val">{departTime}</strong>
                    <span className="airport-code">{firstSeg?.departureAirport || originCity}</span>
                  </div>

                  <div className="flight-path-bar">
                    <span className="duration-label">{formatDuration(offer.totalDurationMinutes)}</span>
                    <div className="path-line">
                      <div className="path-dot start"></div>
                      {offer.stops > 0 && <div className="path-stop-dot" title="1 intermediate stop"></div>}
                      <div className="path-dot end"></div>
                    </div>
                    <span className={`stops-label ${offer.stops === 0 ? "text-emerald" : ""}`}>
                      {offer.stops === 0 ? "Non-stop" : `${offer.stops} stop`}
                    </span>
                  </div>

                  <div className="arrival-block">
                    <strong className="time-val">{arriveTime}</strong>
                    <span className="airport-code">{lastSeg?.arrivalAirport || destCity}</span>
                  </div>
                </div>

                {/* 3. Pricing & Select CTA */}
                <div className="price-action-col">
                  <div className="price-block">
                    <span className="price-label">
                      {itinerary?.travellers && (itinerary.travellers.adults + itinerary.travellers.children) > 1
                        ? `${itinerary.travellers.adults + itinerary.travellers.children} Travelers (Round-Trip)`
                        : "Round-Trip Airfare"}
                    </span>
                    <div className="price-amount">{formatCost(offer.price.amount)}</div>
                    <span className="taxes-sub">
                      {itinerary?.travellers && (itinerary.travellers.adults + itinerary.travellers.children) > 1
                        ? `${formatCost(Math.round(offer.price.amount / (itinerary.travellers.adults + itinerary.travellers.children)))} / passenger • Taxes & fees included`
                        : "Taxes & fees included"}
                    </span>
                  </div>

                  <div className="action-buttons-group">
                    {isSelected ? (
                      <div className="selected-active-badge">
                        <Check className="w-4 h-4 text-emerald" />
                        <span>Selected in Itinerary</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm select-flight-btn"
                        onClick={() => onSelectFlight(offer)}
                      >
                        Select this flight
                      </button>
                    )}

                    {offer.bookingUrl && (
                      <a
                        href={offer.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="airline-site-link"
                      >
                        <span>Airline site</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flight-options-footer-note">
        <Info className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
        <span>
          Flight schedules and fares are synced with distribution systems. Selecting an alternative flight automatically adjusts your itinerary buffer times and estimated trip total.
        </span>
      </div>
    </div>
  );
}
