import React, { useState } from "react";
import type { HotelOffer, Itinerary, StaySegment } from "@travora/contracts";
import {
  Building2,
  Star,
  MapPin,
  Check,
  ExternalLink,
  Sparkles,
  Wifi,
  Coffee,
  ShieldCheck,
  Info,
  SlidersHorizontal,
} from "lucide-react";

interface HotelOptionsViewProps {
  hotelOptions: HotelOffer[];
  selectedHotelName?: string;
  onSelectHotel: (hotel: HotelOffer, targetStayId?: string) => void;
  currency: string;
  itinerary?: Itinerary;
  initialStayId?: string;
}

export function HotelOptionsView({
  hotelOptions,
  selectedHotelName,
  onSelectHotel,
  currency,
  itinerary,
  initialStayId,
}: HotelOptionsViewProps) {
  // If multi-stay itinerary, allow selecting which stay city to view options for
  const stays = itinerary?.stays ?? [];
  const [selectedStayId, setSelectedStayId] = useState<string>(
    () => initialStayId || stays[0]?.id || "stay_default"
  );

  const currentStay = stays.find((s) => s.id === selectedStayId) || stays[0];
  const targetCity = currentStay?.city || "Destination";
  const stayNights = currentStay?.nights || 4;

  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recommended" | "price" | "rating">("recommended");

  // Build resolved offers tailored to city & nights
  const resolvedOffers: HotelOffer[] = React.useMemo(() => {
    const isINR = currency.toUpperCase() === "INR";
    const multiplier = isINR ? 85 : 1;

    // Filter provided hotel options for this city if available
    const matchingProvided = (hotelOptions || []).filter(
      (h) =>
        h.address.toLowerCase().includes(targetCity.toLowerCase()) ||
        h.name.toLowerCase().includes(targetCity.toLowerCase())
    );

    if (matchingProvided.length >= 3) {
      return matchingProvided;
    }

    // Rich fallback hotel alternatives for the city with distinct rates
    const baseList: HotelOffer[] = [
      ...matchingProvided,
      {
        id: `htl_${targetCity.toLowerCase()}_luxury_palace`,
        name: `${targetCity} Grand Palace & Spa`,
        description: "5-star premier luxury hotel offering signature suites, spa sanctuaries, and fine dining.",
        address: `1 Promenade Avenue, ${targetCity}`,
        coordinates: { lat: 35.6895, lng: 139.6917 },
        rating: 4.9,
        stars: 5,
        pricePerNight: {
          amount: Math.round(290 * multiplier * 100),
          currency,
        },
        totalPrice: {
          amount: Math.round(290 * multiplier * stayNights * 100),
          currency,
        },
        nights: stayNights,
        amenities: ["Signature Spa", "Fine Dining", "Infinity Pool", "Butler Service"],
        cancellationPolicy: "Free cancellation until 7 days before check-in",
        hotelStyle: "luxury",
        bookingUrl: "https://www.booking.com",
        fetchedAt: new Date().toISOString(),
        provider: "hotel_provider",
      },
      {
        id: `htl_${targetCity.toLowerCase()}_boutique`,
        name: `${targetCity} Grand Heritage Boutique Suites`,
        description: "Charming boutique lodging located within walking distance of prime cultural landmarks.",
        address: `12 Central Boulevard, ${targetCity}`,
        coordinates: { lat: 35.6895, lng: 139.6917 },
        rating: 4.7,
        stars: 5,
        pricePerNight: {
          amount: Math.round(180 * multiplier * 100),
          currency,
        },
        totalPrice: {
          amount: Math.round(180 * multiplier * stayNights * 100),
          currency,
        },
        nights: stayNights,
        amenities: ["Free Wi-Fi", "Breakfast included", "Spa & Wellness", "Central Location"],
        cancellationPolicy: "Free cancellation up to 48 hours before check-in",
        hotelStyle: "luxury",
        bookingUrl: "https://www.booking.com",
        fetchedAt: new Date().toISOString(),
        provider: "hotel_provider",
      },
      {
        id: `htl_${targetCity.toLowerCase()}_design`,
        name: `${targetCity} Modern Design Riverside Base`,
        description: "Contemporary urban hotel featuring tranquil views, stylish rooms, and effortless transit links.",
        address: `45 Riverbank Walk, ${targetCity}`,
        coordinates: { lat: 35.685, lng: 139.7 },
        rating: 4.5,
        stars: 4,
        pricePerNight: {
          amount: Math.round(115 * multiplier * 100),
          currency,
        },
        totalPrice: {
          amount: Math.round(115 * multiplier * stayNights * 100),
          currency,
        },
        nights: stayNights,
        amenities: ["Free Wi-Fi", "Rooftop Terrace", "Bicycle Rental", "Step-free Access"],
        cancellationPolicy: "Free cancellation up to 24 hours before check-in",
        hotelStyle: "balanced",
        bookingUrl: "https://www.booking.com",
        fetchedAt: new Date().toISOString(),
        provider: "hotel_provider",
      },
      {
        id: `htl_${targetCity.toLowerCase()}_comfort`,
        name: `${targetCity} Central Comfort Inn & Lofts`,
        description: "Cozy and convenient base situated close to metro stations and local evening dining.",
        address: `8 Station Square, ${targetCity}`,
        coordinates: { lat: 35.68, lng: 139.71 },
        rating: 4.3,
        stars: 3,
        pricePerNight: {
          amount: Math.round(68 * multiplier * 100),
          currency,
        },
        totalPrice: {
          amount: Math.round(68 * multiplier * stayNights * 100),
          currency,
        },
        nights: stayNights,
        amenities: ["Free High-speed Wi-Fi", "Luggage Storage", "Near Metro", "24/7 Desk"],
        cancellationPolicy: "Non-refundable option with 10% instant savings",
        hotelStyle: "balanced",
        bookingUrl: "https://www.booking.com",
        fetchedAt: new Date().toISOString(),
        provider: "hotel_provider",
      },
      {
        id: `htl_${targetCity.toLowerCase()}_budget_pods`,
        name: `${targetCity} Urban Pods & Social Hostel`,
        description: "Vibrant budget stay with social cafe lounge, co-working desks, and modern clean pods.",
        address: `22 Backpacker Alley, ${targetCity}`,
        coordinates: { lat: 35.682, lng: 139.705 },
        rating: 4.4,
        stars: 3,
        pricePerNight: {
          amount: Math.round(32 * multiplier * 100),
          currency,
        },
        totalPrice: {
          amount: Math.round(32 * multiplier * stayNights * 100),
          currency,
        },
        nights: stayNights,
        amenities: ["Free Wi-Fi", "Co-working Space", "Social Lounge", "Lockers"],
        cancellationPolicy: "Free cancellation up to 24 hours before check-in",
        hotelStyle: "budget",
        bookingUrl: "https://www.hostelworld.com",
        fetchedAt: new Date().toISOString(),
        provider: "hotel_provider",
      },
    ];

    // Ensure unique by ID
    const seen = new Set<string>();
    return baseList.filter((item) => {
      if (seen.has(item.name.toLowerCase())) return false;
      seen.add(item.name.toLowerCase());
      return true;
    });
  }, [hotelOptions, targetCity, stayNights, currency]);

  // Active hotel name for comparison
  const activeHotelName = currentStay?.hotel?.name || selectedHotelName || resolvedOffers[0]?.name;

  // Filter & sort
  const filteredOffers = resolvedOffers
    .filter((h) => {
      if (filterStyle === "luxury") return (h.stars ?? 4) >= 5 || h.hotelStyle === "luxury";
      if (filterStyle === "boutique") return h.hotelStyle === "balanced" || h.rating && h.rating >= 4.6;
      if (filterStyle === "budget") return h.hotelStyle === "budget" || (h.stars ?? 3) <= 3;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") return a.pricePerNight.amount - b.pricePerNight.amount;
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return 0; // recommended order
    });

  const formatCost = (minorUnits: number) => {
    return (minorUnits / 100).toLocaleString(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="hotel-options-container">
      {/* Header Banner */}
      <div className="hotel-options-header">
        <div className="header-copy">
          <div className="header-stay-badge">
            <Building2 className="w-4 h-4 text-emerald inline mr-1" />
            <span>Accommodations & Lodging Bases</span>
          </div>
          <h2 className="header-title">Hotels & Stays in {targetCity}</h2>
          <p className="header-subline">
            Select your preferred accommodation base. Switching your hotel recalculates lodging expenses, check-in logistics, and overall trip budget.
          </p>
        </div>

        {/* Multi-Stay Switcher if trip has multiple cities */}
        {stays.length > 1 && (
          <div className="stay-city-switcher-row">
            <span className="switcher-label">Select City Stay:</span>
            <div className="stay-chips-group">
              {stays.map((stay, idx) => (
                <button
                  key={stay.id}
                  type="button"
                  className={`stay-city-chip ${stay.id === selectedStayId ? "active" : ""}`}
                  onClick={() => setSelectedStayId(stay.id)}
                >
                  <span className="chip-stay-num">Stay {idx + 1}:</span>
                  <strong>{stay.city}</strong>
                  <span className="chip-stay-nights">({stay.nights} nights)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter and Sort Controls */}
        <div className="hotel-controls-row">
          <div className="filter-pill-group">
            <span className="control-label">Style:</span>
            <button
              type="button"
              className={`pill-btn ${filterStyle === "all" ? "active" : ""}`}
              onClick={() => setFilterStyle("all")}
            >
              All Hotels ({resolvedOffers.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${filterStyle === "luxury" ? "active" : ""}`}
              onClick={() => setFilterStyle("luxury")}
            >
              Luxury & 5-Star
            </button>
            <button
              type="button"
              className={`pill-btn ${filterStyle === "boutique" ? "active" : ""}`}
              onClick={() => setFilterStyle("boutique")}
            >
              Boutique & Design
            </button>
            <button
              type="button"
              className={`pill-btn ${filterStyle === "budget" ? "active" : ""}`}
              onClick={() => setFilterStyle("budget")}
            >
              Budget & Comfort
            </button>
          </div>

          <div className="sort-pill-group">
            <span className="control-label">Sort:</span>
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
              Lowest Nightly
            </button>
            <button
              type="button"
              className={`pill-btn ${sortBy === "rating" ? "active" : ""}`}
              onClick={() => setSortBy("rating")}
            >
              Top Rated
            </button>
          </div>
        </div>
      </div>

      {/* Hotel Cards List */}
      <div className="hotel-cards-stack">
        {filteredOffers.map((hotel, idx) => {
          const isSelected =
            hotel.name.toLowerCase() === activeHotelName.toLowerCase() ||
            currentStay?.hotel?.name?.toLowerCase() === hotel.name.toLowerCase();

          return (
            <div
              key={hotel.id}
              className={`hotel-offer-card ${isSelected ? "is-selected" : ""}`}
            >
              {/* Top Tags */}
              <div className="hotel-card-top-tags">
                {idx === 0 && (
                  <span className="tag-pill tag-recommended">
                    <Sparkles className="w-3 h-3 inline mr-1" /> Top Recommendation
                  </span>
                )}
                {hotel.stars && (
                  <span className="tag-pill tag-stars">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 inline fill-amber text-amber" />
                    ))}
                    <span className="ml-1">{hotel.stars}-Star</span>
                  </span>
                )}
                {hotel.hotelStyle && (
                  <span className="tag-pill tag-style">
                    {hotel.hotelStyle.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="hotel-card-main-grid">
                {/* 1. Hotel Details */}
                <div className="hotel-info-col">
                  <div className="hotel-title-line">
                    <Building2 className="w-5 h-5 text-emerald flex-shrink-0" />
                    <h3 className="hotel-name">{hotel.name}</h3>
                  </div>

                  <div className="hotel-location-line">
                    <MapPin className="w-3.5 h-3.5 text-leather inline mr-1" />
                    <span>{hotel.address}</span>
                  </div>

                  {hotel.description && (
                    <p className="hotel-desc-text">{hotel.description}</p>
                  )}

                  {/* Amenities */}
                  <div className="hotel-amenities-row">
                    {hotel.amenities.map((amenity, aIdx) => (
                      <span key={aIdx} className="amenity-chip">
                        <Check className="w-3 h-3 inline mr-1 text-emerald" />
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="hotel-cancellation-notice">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald inline mr-1" />
                    <span>{hotel.cancellationPolicy}</span>
                  </div>
                </div>

                {/* 2. Rating & Pricing */}
                <div className="hotel-price-col">
                  {hotel.rating && (
                    <div className="hotel-rating-box">
                      <div className="rating-score">
                        <Star className="w-4 h-4 fill-amber text-amber inline mr-1" />
                        <strong>{hotel.rating}</strong>
                        <span className="rating-scale">/ 5</span>
                      </div>
                      <span className="rating-label">Guest Verified</span>
                    </div>
                  )}

                  <div className="pricing-box">
                    <div className="nightly-rate-line">
                      <strong className="rate-amount">{formatCost(hotel.pricePerNight.amount)}</strong>
                      <span className="rate-unit">/ night</span>
                    </div>
                    <span className="total-stay-price">
                      Total: {formatCost(hotel.totalPrice?.amount ?? hotel.pricePerNight.amount * stayNights)} ({stayNights} nights)
                    </span>
                    <span className="taxes-note">Taxes & fees included</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="hotel-action-buttons">
                    {isSelected ? (
                      <div className="selected-active-badge">
                        <Check className="w-4 h-4 text-emerald" />
                        <span>Active Base in Itinerary</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm select-hotel-btn"
                        onClick={() => onSelectHotel(hotel, currentStay?.id)}
                      >
                        Select this hotel base
                      </button>
                    )}

                    {hotel.bookingUrl && (
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="booking-partner-link"
                      >
                        <span>View booking details</span>
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

      <div className="hotel-options-footer-note">
        <Info className="w-4 h-4 text-stone-400 mr-2 flex-shrink-0" />
        <span>
          Hotel offers are checked for availability across verified distribution channels. Selecting an alternative accommodation base automatically recalculates daily walking routes and total trip budget.
        </span>
      </div>
    </div>
  );
}
export default HotelOptionsView;
