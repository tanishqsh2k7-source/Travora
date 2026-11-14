import React from "react";
import { X, Network, Calculator, CloudSun, ShieldCheck } from "lucide-react";

interface BehindTheScenesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BehindTheScenesModal({ isOpen, onClose }: BehindTheScenesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card editorial-modal"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="modal-header-copy">
            <span className="modal-kicker">Architecture Note</span>
            <h2 id="modal-title" className="modal-headline">
              How Travora builds your itinerary
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-6">
          <p className="modal-lead">
            Travora does not use a single chatbot to guess your trip. Instead, specialized software
            workers and deterministic mathematical engines collaborate in stages:
          </p>

          <div className="architecture-grid">
            <div className="arch-card">
              <div className="arch-icon-box">
                <Network className="w-5 h-5 text-terracotta" />
              </div>
              <h3 className="arch-card-title">Parallel Researchers</h3>
              <p className="arch-card-desc">
                When you submit your trip, separate researchers inspect flight schedules, hotel
                options, local attractions, and microclimate forecasts simultaneously.
              </p>
            </div>

            <div className="arch-card">
              <div className="arch-icon-box">
                <Calculator className="w-5 h-5 text-teal" />
              </div>
              <h3 className="arch-card-title">Deterministic Engines</h3>
              <p className="arch-card-desc">
                Distances, travel times, and budgets are never guessed by language models. Pure
                mathematical engines run TSP route clustering and penny-exact currency calculations.
              </p>
            </div>

            <div className="arch-card">
              <div className="arch-icon-box">
                <CloudSun className="w-5 h-5 text-amber" />
              </div>
              <h3 className="arch-card-title">Weather & Disruption Critic</h3>
              <p className="arch-card-desc">
                A review system cross-references forecasted rain against outdoor activities. If bad
                weather threatens an open-air visit, indoor cultural alternatives are automatically substituted.
              </p>
            </div>

            <div className="arch-card">
              <div className="arch-icon-box">
                <ShieldCheck className="w-5 h-5 text-forest" />
              </div>
              <h3 className="arch-card-title">Multi-Hotel Logistics</h3>
              <p className="arch-card-desc">
                If your itinerary spans multiple cities or districts, Travora tracks check-in times
                and signals exactly when you need to switch hotels.
              </p>
            </div>
          </div>

          <div className="modal-note-box">
            <p>
              Travora connects to live flight and hotel distribution systems (Duffel, Booking.com,
              LiteAPI) when configured, and falls back to curated verified fixtures in demo mode.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Back to trip planner
          </button>
        </div>
      </div>
    </div>
  );
}
