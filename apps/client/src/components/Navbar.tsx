import React from "react";
import { SparklesIcon } from "./Icons";

interface NavbarProps {
  onNewTrip: () => void;
  hasActiveTrip: boolean;
}

export function Navbar({ onNewTrip, hasActiveTrip }: NavbarProps) {
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
          <div className="user-pill">
            <span className="user-dot"></span>
            <span>Demo Guest</span>
          </div>
        </div>
      </div>
    </header>
  );
}
