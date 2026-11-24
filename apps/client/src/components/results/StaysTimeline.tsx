import React from "react";
import type { StaySegment, Transition } from "@travora/contracts";
import {
  Bed,
  MapPin,
  Calendar,
  Star,
  Luggage,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Building2,
} from "lucide-react";

interface StaysTimelineProps {
  stays: StaySegment[];
  transitions: Transition[];
  currency: string;
  onViewHotels?: (stayId?: string) => void;
}

export function StaysTimeline({ stays, transitions, currency, onViewHotels }: StaysTimelineProps) {
  const formatMoney = (minorUnits: number) => {
    return (minorUnits / 100).toLocaleString(undefined, {
      style: "currency",
      currency,
    });
  };

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="stays-timeline-container">
      <div className="stays-header">
        <div>
          <h3 className="stays-title">Accommodations & Moving Plan</h3>
          <p className="stays-subtitle">
            Every night allocated with zero overlap. Clear check-in/out transitions and verified
            relocation reasons.
          </p>
        </div>
        <div className="stays-counter-badge">
          <Bed className="w-4 h-4 text-emerald" />
          <span>{stays.length} {stays.length === 1 ? "Stay" : "Stays"} Scheduled</span>
        </div>
      </div>

      <div className="stays-sequence">
        {stays.map((stay, idx) => {
          const matchingTransition = transitions.find((t) => t.fromStayId === stay.id);

          return (
            <React.Fragment key={stay.id}>
              {/* Stay Segment Card */}
              <div className="stay-card">
                <div className="stay-card-side">
                  <div className="stay-index-bubble">{idx + 1}</div>
                  <div className="stay-nights-badge">
                    <strong>{stay.nights}</strong>
                    <span>{stay.nights === 1 ? "night" : "nights"}</span>
                  </div>
                </div>

                <div className="stay-card-main">
                  {/* Change Reason Banner if moving */}
                  {stay.changeReason && (
                    <div className="stay-reason-banner">
                      <span className="reason-code-badge">{stay.changeReason.code}</span>
                      <span className="reason-text">{stay.changeReason.text}</span>
                    </div>
                  )}

                  <div className="stay-info-header">
                    <div>
                      <div className="stay-city-area">
                        <MapPin className="w-3.5 h-3.5 text-terracotta inline mr-1" />
                        <strong>{stay.city}</strong> • <span>{stay.area}</span>
                      </div>
                      <h4 className="stay-hotel-name">{stay.hotel.name}</h4>
                      {stay.hotel.address && (
                        <p className="stay-address">{stay.hotel.address}</p>
                      )}
                    </div>

                    <div className="stay-pricing">
                      <div className="nightly-rate">
                        <strong>{formatMoney(stay.hotel.nightlyPrice.amount)}</strong>
                        <span>/ night</span>
                      </div>
                      <div className="total-rate">
                        Total: <strong>{formatMoney(stay.hotel.total.amount)}</strong>
                      </div>
                      <span className={`offer-kind-tag ${stay.hotel.nightlyPrice.kind}`}>
                        {stay.hotel.nightlyPrice.kind === "live_offer"
                          ? "Live Rate"
                          : stay.hotel.nightlyPrice.kind === "demo_offer"
                          ? "Verified Market Estimate"
                          : "Calculated Estimate"}
                      </span>
                    </div>
                  </div>

                  {/* Dates & Hotel Details */}
                  <div className="stay-meta-grid">
                    <div className="meta-box">
                      <Calendar className="w-4 h-4 text-emerald" />
                      <div>
                        <span className="meta-label">Check-in</span>
                        <strong className="meta-value">
                          {formatDate(stay.checkInDate)} (from 15:00)
                        </strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <Calendar className="w-4 h-4 text-terracotta" />
                      <div>
                        <span className="meta-label">Check-out</span>
                        <strong className="meta-value">
                          {formatDate(stay.checkOutDate)} (by 11:00)
                        </strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <Star className="w-4 h-4 text-amber fill-amber" />
                      <div>
                        <span className="meta-label">Rating</span>
                        <strong className="meta-value">
                          {stay.hotel.stars ? `${stay.hotel.stars} Stars` : "Curated Boutique"}
                        </strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <div>
                        <span className="meta-label">Cancellation</span>
                        <strong className="meta-value">
                          {stay.hotel.cancellation || "Free cancellation up to 48h prior"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Source Footer */}
                  <div className="stay-footer">
                    <span className="stay-source">
                      Provider: <code>{stay.hotel.nightlyPrice.source}</code> • Fetched:{" "}
                      {new Date(stay.hotel.nightlyPrice.fetchedAt).toLocaleDateString()}
                    </span>
                    <div className="stay-footer-right">
                      {onViewHotels && (
                        <button
                          type="button"
                          className="btn-switch-hotel"
                          onClick={() => onViewHotels(stay.id)}
                        >
                          <Building2 className="w-3.5 h-3.5 inline mr-1 text-emerald" />
                          Compare & switch hotel options →
                        </button>
                      )}
                      <span className="guarantee-pill">
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald" />
                        Continuous Booking Window
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Moving Day Transition Connector */}
              {matchingTransition && (
                <div className="transition-connector-block">
                  <div className="transition-icon-node">
                    <Luggage className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="transition-body">
                    <div className="transition-header">
                      <span className="moving-badge">Moving Day: {formatDate(matchingTransition.date)}</span>
                      <span className="transition-hours">
                        Check out by <strong>{matchingTransition.checkOutBy}</strong> • Check in from{" "}
                        <strong>{matchingTransition.checkInFrom}</strong>
                      </span>
                    </div>

                    <div className="transition-legs-row">
                      {matchingTransition.legs.map((leg) => (
                        <div key={leg.id} className="transition-leg-badge">
                          <span className="leg-mode-tag">{leg.mode.toUpperCase()}</span>
                          <span className="leg-text">
                            {leg.from.city} → {leg.to.city} ({leg.durationMin} mins)
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="transition-tips">
                      <div className="tip-row">
                        <Luggage className="w-3.5 h-3.5 text-amber-600 inline mr-1.5" />
                        <strong>Luggage Tip:</strong> {matchingTransition.luggageTip}
                      </div>
                      <div className="tip-row">
                        <Clock className="w-3.5 h-3.5 text-sky-600 inline mr-1.5" />
                        <strong>Transfer Plan:</strong> {matchingTransition.tip}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
