import React from "react";
import type { Itinerary, Leg } from "@travora/contracts";
import {
  Plane,
  Train,
  Bus,
  Car,
  Ship,
  Bed,
  AlertTriangle,
  Info,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface JourneyStripProps {
  itinerary: Itinerary;
}

function getLegIcon(mode: Leg["mode"]) {
  switch (mode) {
    case "flight":
      return <Plane className="w-4 h-4 text-sky-600" />;
    case "train":
      return <Train className="w-4 h-4 text-emerald-600" />;
    case "bus":
      return <Bus className="w-4 h-4 text-amber-600" />;
    case "car":
      return <Car className="w-4 h-4 text-orange-600" />;
    case "ferry":
      return <Ship className="w-4 h-4 text-blue-600" />;
    default:
      return <ArrowRight className="w-4 h-4 text-neutral-500" />;
  }
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function JourneyStrip({ itinerary }: JourneyStripProps) {
  const { journey, stays, summary, currency } = itinerary;

  // Identify biggest cost item
  let biggestCostName = "Flights";
  let biggestCostAmount = 0;

  for (const leg of journey) {
    if (leg.cost && leg.cost.amount > biggestCostAmount) {
      biggestCostAmount = leg.cost.amount;
      biggestCostName = `${leg.from.city} → ${leg.to.city} (${leg.mode})`;
    }
  }

  for (const stay of stays) {
    if (stay.hotel.total && stay.hotel.total.amount > biggestCostAmount) {
      biggestCostAmount = stay.hotel.total.amount;
      biggestCostName = `${stay.hotel.name} (${stay.nights} nights)`;
    }
  }

  const formatCost = (minorUnits: number) => {
    return (minorUnits / 100).toLocaleString(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="journey-strip-wrapper">
      <div className="journey-strip-header">
        <h3 className="journey-strip-title">Full Journey Arc</h3>
        <span className="journey-strip-meta">
          {itinerary.nights} nights • {stays.length} {stays.length === 1 ? "base stay" : "distinct stays"} •{" "}
          {journey.length} transit legs
        </span>
      </div>

      {/* Main Journey Flow */}
      <div className="journey-timeline-flow">
        {journey.map((leg, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === journey.length - 1;
          const matchingStay = stays.find(
            (s) => s.city.toLowerCase() === leg.to.city.toLowerCase()
          );

          return (
            <React.Fragment key={leg.id}>
              {/* Origin node on first leg */}
              {isFirst && (
                <div className="journey-node origin-node">
                  <div className="node-marker origin-marker">
                    <span className="node-dot"></span>
                  </div>
                  <div className="node-info">
                    <span className="node-type">Origin</span>
                    <strong className="node-city">{leg.from.city}</strong>
                    {leg.from.code && <span className="node-code">{leg.from.code}</span>}
                  </div>
                </div>
              )}

              {/* Transit Leg Connector */}
              <div className={`journey-leg-connector mode-${leg.mode}`}>
                <div className="connector-line"></div>
                <div className="connector-pill">
                  <span className="leg-icon">{getLegIcon(leg.mode)}</span>
                  <div className="leg-details">
                    <div className="leg-route-title">
                      <span className="leg-carrier">
                        {leg.carrier ? `${leg.carrier} ${leg.number || ""}` : leg.mode.toUpperCase()}
                      </span>
                      <span className="leg-duration">{formatDuration(leg.durationMin)}</span>
                    </div>
                    <div className="leg-times">
                      <span>{leg.departLocal.split("T")[1]?.slice(0, 5)}</span>
                      <ArrowRight className="w-2.5 h-2.5 inline mx-1 opacity-60" />
                      <span>{leg.arriveLocal.split("T")[1]?.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination City Node */}
              <div className={`journey-node ${isLast ? "return-node" : "destination-node"}`}>
                <div className="node-marker destination-marker">
                  <span className="node-dot"></span>
                </div>
                <div className="node-info">
                  <span className="node-type">
                    {isLast ? "Return Home" : matchingStay ? `${matchingStay.nights} nights` : "Stopover"}
                  </span>
                  <strong className="node-city">{leg.to.city}</strong>
                  {leg.to.code && <span className="node-code">{leg.to.code}</span>}
                  {matchingStay && (
                    <div className="node-hotel-preview">
                      <Bed className="w-3 h-3 inline mr-1 text-terracotta" />
                      <span className="hotel-name">{matchingStay.hotel.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 3 Summary Highlight Cards Underneath */}
      <div className="journey-highlights-grid">
        {/* 1. Where You Sleep */}
        <div className="highlight-card sleep-card">
          <div className="highlight-icon-box bg-emerald-50 text-emerald-700">
            <Bed className="w-5 h-5" />
          </div>
          <div className="highlight-content">
            <span className="highlight-label">Where you sleep</span>
            <div className="highlight-stay-list">
              {stays.map((s, i) => (
                <div key={s.id} className="stay-mini-row">
                  <span className="stay-counter">Stay {i + 1}:</span>
                  <strong className="stay-hotel">{s.hotel.name}</strong>
                  <span className="stay-nights">
                    ({s.nights}n in {s.city})
                  </span>
                  {s.changeReason && (
                    <span className="stay-reason-pill">{s.changeReason.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Biggest Cost */}
        <div className="highlight-card cost-card">
          <div className="highlight-icon-box bg-amber-50 text-amber-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="highlight-content">
            <span className="highlight-label">Biggest single expense</span>
            <strong className="cost-title">{biggestCostName}</strong>
            <div className="cost-value-row">
              <span className="cost-amount">{formatCost(biggestCostAmount)}</span>
              {summary.estimatedTotal.amount > 0 && (
                <span className="cost-pct">
                  ~{Math.round((biggestCostAmount / summary.estimatedTotal.amount) * 100)}% of total
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Disclaimers & Warnings */}
        <div className="highlight-card warning-card">
          <div className="highlight-icon-box bg-sky-50 text-sky-700">
            {summary.warnings.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <Info className="w-5 h-5 text-sky-600" />
            )}
          </div>
          <div className="highlight-content">
            <div className="highlight-label-row">
              <span className="highlight-label">Planning notes & verification</span>
              <span className={`badge-mode ${itinerary.dataMode}`}>
                {itinerary.dataMode === "live" ? "Live Offers Verified" : "Simulated Demo Offers"}
              </span>
            </div>
            {summary.warnings.length > 0 ? (
              <ul className="notes-list">
                {summary.warnings.slice(0, 2).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            ) : (
              <p className="clean-schedule-note">
                Contiguous stays, validated buffer times, and no overlapping event schedules.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
