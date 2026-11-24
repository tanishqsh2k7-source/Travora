import React, { useState } from "react";
import type { Itinerary } from "@travora/contracts";
import {
  Calendar,
  Users,
  Share2,
  Printer,
  RotateCcw,
  Info,
  Check,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface ItineraryHeaderProps {
  itinerary: Itinerary;
  onOpenReplanModal: () => void;
}

export function ItineraryHeader({ itinerary, onOpenReplanModal }: ItineraryHeaderProps) {
  const [copied, setCopied] = useState(false);

  const { summary, startDate, endDate, nights, travellers, currency } = itinerary;

  const formatDateRange = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString(undefined, options)} – ${end.toLocaleDateString(
      undefined,
      options
    )}, ${start.getFullYear()}`;
  };

  const formatCost = (minorUnits: number) => {
    return (minorUnits / 100).toLocaleString(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="itinerary-header-band">
      <div className="header-top-row">
        <div className="header-titles">
          <div className="header-badge-row">
            <span className="curated-journey-tag">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-terracotta" />
              Custom Curated Journey
            </span>
          </div>

          <h1 className="header-main-title">{summary.title}</h1>

          <div className="header-meta-chips">
            <span className="meta-chip">
              <Calendar className="w-4 h-4 text-emerald mr-1.5" />
              <strong>{formatDateRange()}</strong>
              <span className="nights-sub">({nights} nights)</span>
            </span>

            <span className="meta-chip">
              <Users className="w-4 h-4 text-terracotta mr-1.5" />
              <span>
                {travellers.adults} {travellers.adults === 1 ? "adult" : "adults"}
                {travellers.children > 0 ? `, ${travellers.children} children` : ""}
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Summary Block */}
        <div className="header-pricing-block">
          <div className="price-tag-label">Estimated Total</div>
          <div className="price-headline">{formatCost(summary.estimatedTotal.amount)}</div>
          <div className="budget-comparison">
            {summary.withinBudget ? (
              <span className="budget-status within">
                Within {formatCost(summary.budget.amount)} budget ({formatCost(summary.remaining.amount)} buffer)
              </span>
            ) : (
              <span className="budget-status over">
                Exceeds budget by {formatCost(Math.abs(summary.remaining.amount))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="header-actions-row">
        <div className="header-actions-group">
          <button className="btn btn-secondary btn-sm" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald mr-1.5" /> Copied Link!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-1.5" /> Share Trip
              </>
            )}
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Print / Export PDF
          </button>
        </div>

        <button className="btn btn-primary btn-sm" onClick={onOpenReplanModal}>
          <RotateCcw className="w-4 h-4 mr-1.5" /> Adjust / Replan Itinerary
        </button>
      </div>
    </div>
  );
}
