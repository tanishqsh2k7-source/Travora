import React from "react";
import { SparklesIcon } from "./Icons";

interface NavbarProps {
  onNewTrip: () => void;
  hasActiveTrip: boolean;
  onOpenPreferences: () => void;
}

export function Navbar({ onNewTrip, hasActiveTrip, onOpenPreferences }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="brand" onClick={onNewTrip} style={{ cursor: "pointer" }}>
          <div className="brand-logo">
            <SparklesIcon className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">Travora</span>
            <span className="brand-badge">Multi-Agent AI</span>
          </div>
        </div>

        <div className="navbar-actions">
          {hasActiveTrip && (
            <button className="btn btn-secondary btn-sm" onClick={onNewTrip}>
              + Plan New Trip
            </button>
          )}
          <button
            className="user-pill user-pill-btn"
            onClick={onOpenPreferences}
            title="Manage traveler profile & preferences"
          >
            <span className="user-dot"></span>
            <span>Preferences</span>
          </button>
        </div>
      </div>
    </header>
  );
}

