import React, { useState } from "react";
import { Menu, X, SlidersHorizontal, User, Compass } from "lucide-react";

interface NavbarProps {
  onNewTrip: () => void;
  hasActiveTrip: boolean;
  onOpenPreferences: () => void;
  onNavigateDestinations?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateMyTrips?: () => void;
}

export function Navbar({
  onNewTrip,
  hasActiveTrip,
  onOpenPreferences,
  onNavigateDestinations,
  onNavigateHowItWorks,
  onNavigateMyTrips,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollTo = (id: string, customCb?: () => void) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    if (customCb) {
      customCb();
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleBrandClick = () => {
    setActiveSection(null);
    onNewTrip();
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand wordmark */}
        <div
          className="brand-wordmark"
          onClick={handleBrandClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleBrandClick()}
        >
          <span className="brand-name">Travora</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main navigation">
          <button
            type="button"
            className={`nav-link ${activeSection === "destinations" ? "active" : ""}`}
            aria-current={activeSection === "destinations" ? "page" : undefined}
            onClick={() => scrollTo("destinations", onNavigateDestinations)}
          >
            Destinations
          </button>
          <button
            type="button"
            className={`nav-link ${activeSection === "how-it-works" ? "active" : ""}`}
            aria-current={activeSection === "how-it-works" ? "page" : undefined}
            onClick={() => scrollTo("how-it-works", onNavigateHowItWorks)}
          >
            How it works
          </button>
          <button
            type="button"
            className={`nav-link ${activeSection === "planner" ? "active" : ""}`}
            aria-current={activeSection === "planner" ? "page" : undefined}
            onClick={() => scrollTo("planner", onNavigateMyTrips)}
          >
            My trips
          </button>
        </nav>

        {/* Desktop Right actions */}
        <div className="header-actions">
          {hasActiveTrip && (
            <button
              type="button"
              className="header-action-btn primary"
              onClick={onNewTrip}
            >
              New trip
            </button>
          )}

          <button
            type="button"
            className="header-action-btn secondary"
            onClick={onOpenPreferences}
            title="Trip preferences & currencies"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Preferences</span>
          </button>

          <button
            type="button"
            className="header-action-btn ghost"
            onClick={onOpenPreferences}
            aria-label="Account profile"
          >
            <User className="w-4 h-4" />
            <span>Sign in</span>
          </button>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer" role="dialog" aria-label="Mobile navigation">
          <div className="mobile-drawer-links">
            <button
              type="button"
              className={`mobile-drawer-link ${activeSection === "destinations" ? "active" : ""}`}
              onClick={() => scrollTo("destinations", onNavigateDestinations)}
            >
              <Compass className="w-4 h-4" /> Destinations
            </button>
            <button
              type="button"
              className={`mobile-drawer-link ${activeSection === "how-it-works" ? "active" : ""}`}
              onClick={() => scrollTo("how-it-works", onNavigateHowItWorks)}
            >
              How it works
            </button>
            <button
              type="button"
              className={`mobile-drawer-link ${activeSection === "planner" ? "active" : ""}`}
              onClick={() => scrollTo("planner", onNavigateMyTrips)}
            >
              My trips
            </button>
            <button
              type="button"
              className="mobile-drawer-link"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPreferences();
              }}
            >
              <SlidersHorizontal className="w-4 h-4" /> Preferences
            </button>
            <button
              type="button"
              className="mobile-drawer-link"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPreferences();
              }}
            >
              <User className="w-4 h-4" /> Sign in
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
