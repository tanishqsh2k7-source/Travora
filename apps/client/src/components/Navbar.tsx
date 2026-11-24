import React, { useState } from "react";
import { Menu, X, SlidersHorizontal, User, Compass, LogOut } from "lucide-react";
import type { AuthUser } from "@travora/contracts";

interface NavbarProps {
  onNewTrip: () => void;
  hasActiveTrip: boolean;
  onOpenPreferences: () => void;
  onNavigateDestinations?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateMyTrips?: () => void;
  currentUser?: AuthUser | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export function Navbar({
  onNewTrip,
  hasActiveTrip,
  onOpenPreferences,
  onNavigateDestinations,
  onNavigateHowItWorks,
  onNavigateMyTrips,
  currentUser = null,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

          {currentUser ? (
            <div className="user-nav-dropdown-wrapper">
              <button
                type="button"
                className="header-action-btn user-nav-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
              >
                <div className="user-avatar-badge">
                  {(currentUser.name || currentUser.email)[0].toUpperCase()}
                </div>
                <span className="user-display-name">
                  {currentUser.name || currentUser.email.split("@")[0]}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="user-nav-popover">
                  <div className="user-popover-info">
                    <strong className="user-full-name">{currentUser.name || "Explorer"}</strong>
                    <span className="user-email-addr">{currentUser.email}</span>
                  </div>
                  <div className="user-popover-sep"></div>
                  <button
                    type="button"
                    className="user-popover-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      scrollTo("planner", onNavigateMyTrips);
                    }}
                  >
                    My Trips
                  </button>
                  <button
                    type="button"
                    className="user-popover-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenPreferences();
                    }}
                  >
                    Trip Preferences
                  </button>
                  <div className="user-popover-sep"></div>
                  <button
                    type="button"
                    className="user-popover-item text-danger"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout?.();
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5 inline" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="header-action-btn ghost auth-signin-btn"
              onClick={onOpenAuth}
              aria-label="Account sign in"
            >
              <User className="w-4 h-4 mr-1.5" />
              <span>Sign in</span>
            </button>
          )}

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
            {currentUser ? (
              <button
                type="button"
                className="mobile-drawer-link text-danger"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout?.();
                }}
              >
                <LogOut className="w-4 h-4" /> Sign Out ({currentUser.name || currentUser.email})
              </button>
            ) : (
              <button
                type="button"
                className="mobile-drawer-link"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth?.();
                }}
              >
                <User className="w-4 h-4" /> Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
