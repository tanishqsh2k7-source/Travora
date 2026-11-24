import React from "react";
import { DESTINATIONS, type Destination } from "../content/destinations.js";
import { Photo } from "./Photo.js";
import {
  Utensils,
  Landmark,
  Compass,
  Building,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  Sparkle,
  Calendar,
} from "lucide-react";

export interface ThemePreset {
  id: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  interests: string[];
  pace: "relaxed" | "moderate" | "fast";
  style: "balanced" | "relaxed" | "luxury" | "budget";
  photoUrl: string;
}

interface LandingSectionsProps {
  onSelectDestination: (destination: string) => void;
  onApplyTheme: (theme: {
    interests: string[];
    pace: "relaxed" | "moderate" | "fast";
    style: "balanced" | "relaxed" | "luxury" | "budget";
  }) => void;
  onOpenSampleTrip?: () => void;
}

export function LandingSections({
  onSelectDestination,
  onApplyTheme,
  onOpenSampleTrip,
}: LandingSectionsProps) {
  const THEMES: ThemePreset[] = [
    {
      id: "food",
      title: "Food trails",
      tagline: "Local markets, specialty taverns, and street fare.",
      icon: <Utensils className="w-5 h-5 text-terracotta" />,
      interests: ["food", "markets", "culture"],
      pace: "relaxed",
      style: "balanced",
      photoUrl: "/images/destinations/tokyo-card.jpg",
    },
    {
      id: "culture",
      title: "History and culture",
      tagline: "Royal palaces, heritage museums, and medieval lanes.",
      icon: <Landmark className="w-5 h-5 text-teal" />,
      interests: ["history", "museums", "architecture"],
      pace: "moderate",
      style: "balanced",
      photoUrl: "/images/destinations/udaipur-card.jpg",
    },
    {
      id: "scenic",
      title: "Slow and scenic",
      tagline: "Coastal clifftops, riverside gardens, and tranquil viewpoints.",
      icon: <Compass className="w-5 h-5 text-forest" />,
      interests: ["nature", "parks", "viewpoints"],
      pace: "relaxed",
      style: "relaxed",
      photoUrl: "/images/destinations/lisbon-card.jpg",
    },
    {
      id: "city-breaks",
      title: "City breaks",
      tagline: "Iconic highlights, shopping boulevards, and vibrant nightlife.",
      icon: <Building className="w-5 h-5 text-indigo-600" />,
      interests: ["shopping", "nightlife", "landmarks"],
      pace: "fast",
      style: "balanced",
      photoUrl: "/images/destinations/paris-card.jpg",
    },
  ];

  return (
    <div className="landing-editorial-flow">
      {/* ────────────────── SECTION 1: DESTINATIONS SHOWCASE ────────────────── */}
      <section id="destinations" className="editorial-section destination-showcase-section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <span className="editorial-kicker">Curated getaways</span>
              <h2 className="editorial-title">Where to next?</h2>
              <p className="editorial-subline">
                Select any destination to prefill your itinerary details.
              </p>
            </div>
            <div className="scroll-hint-desktop">
              <span>Scroll horizontally for more destinations →</span>
            </div>
          </div>

          <div className="destination-scroll-track" role="region" aria-label="Destinations carousel">
            {DESTINATIONS.map((dest) => (
              <div
                key={dest.slug}
                className="destination-card"
                role="button"
                tabIndex={0}
                onClick={() => onSelectDestination(`${dest.name}, ${dest.country}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectDestination(`${dest.name}, ${dest.country}`);
                  }
                }}
                aria-label={`Plan trip to ${dest.name}, ${dest.country}`}
              >
                <div className="dest-card-photo-wrap">
                  <Photo
                    src={dest.cardImage}
                    alt={dest.alt}
                    width={600}
                    height={800}
                    fallbackTitle={dest.name}
                    fallbackSubtitle={dest.country}
                    className="dest-card-photo"
                    fill
                  />
                  <div className="dest-card-duration-badge">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dest.suggestedDays}</span>
                  </div>
                </div>

                <div className="dest-card-content">
                  <div className="dest-card-country">{dest.country}</div>
                  <h3 className="dest-card-name">{dest.name}</h3>
                  <p className="dest-card-tagline">{dest.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 2: TRIP IDEAS / THEMES ────────────────── */}
      <section className="editorial-section themes-section">
        <div className="section-container">
          <div className="section-heading-row">
            <div>
              <span className="editorial-kicker">Travel styles</span>
              <h2 className="editorial-title">Start from a theme</h2>
              <p className="editorial-subline">
                Set up a tailored mix of pacing, interests, and atmosphere with one tap.
              </p>
            </div>
          </div>

          <div className="themes-grid">
            {THEMES.map((theme) => (
              <div
                key={theme.id}
                className="theme-card"
                role="button"
                tabIndex={0}
                onClick={() => {
                  onApplyTheme({
                    interests: theme.interests,
                    pace: theme.pace,
                    style: theme.style,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onApplyTheme({
                      interests: theme.interests,
                      pace: theme.pace,
                      style: theme.style,
                    });
                  }
                }}
              >
                <div className="theme-card-icon-wrap">{theme.icon}</div>
                <h3 className="theme-card-title">{theme.title}</h3>
                <p className="theme-card-desc">{theme.tagline}</p>
                <div className="theme-card-action">
                  <span>Apply theme</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 3: HOW IT WORKS ────────────────── */}
      <section id="how-it-works" className="editorial-section how-it-works-section">
        <div className="section-container">
          <div className="section-heading-centered">
            <span className="editorial-kicker">Thoughtful planning</span>
            <h2 className="editorial-title">How it works</h2>
            <p className="editorial-subline">
              Three straightforward steps from initial idea to a seamless day-by-day itinerary.
            </p>
          </div>

          <div className="steps-row">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Tell us the trip</h3>
              <p className="step-description">
                Enter your departure city, destination, travel dates, and companion count. Or just
                describe what you envision in plain sentences.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Smart routing & hand-picked stays</h3>
              <p className="step-description">
                We check optimal transit connections, select neighborhood lodging, avoid backtracking,
                and balance your daily pace for an effortless journey.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Your complete day-by-day itinerary</h3>
              <p className="step-description">
                Receive a clear schedule with walking times, hotel check-in points, verified costs, and
                weather-smart indoor alternatives when rain is forecast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 4: SAMPLE TRIP TEASER ────────────────── */}
      <section className="editorial-section sample-trip-section">
        <div className="section-container">
          <div className="sample-trip-banner">
            <div className="sample-trip-copy">
              <span className="sample-kicker">Sample itinerary preview</span>
              <h2 className="sample-headline">A taste of Lisbon in 4 days</h2>
              <p className="sample-text">
                Historic tram rides through Alfama, sunset viewpoints at Miradouro de Santa Luzia,
                pastéis de nata in Belém, and seamless transit schedules.
              </p>
              <div className="sample-pill-group">
                <span className="sample-pill">4 days / 3 nights</span>
                <span className="sample-pill">6 cultural stops</span>
                <span className="sample-pill">Verified hotel base</span>
              </div>
            </div>
            <div className="sample-trip-action-wrap">
              <button
                type="button"
                className="btn btn-secondary sample-explore-btn"
                onClick={() => onSelectDestination("Lisbon, Portugal")}
              >
                Plan a Lisbon trip
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 5: TRUST STRIP & FOOTER ────────────────── */}
      <footer className="editorial-footer">
        <div className="section-container">
          <div className="trust-strip">
            <div className="trust-item">
              <Shield className="w-5 h-5 text-forest" />
              <div>
                <strong>Transparent pricing</strong>
                <p>Real-world cost breakdowns with built-in safety buffers so there are no surprises.</p>
              </div>
            </div>
            <div className="trust-item">
              <CheckCircle2 className="w-5 h-5 text-teal" />
              <div>
                <strong>Weather-smart planning</strong>
                <p>Balances open-air sights with indoor cultural alternatives when rain is forecast.</p>
              </div>
            </div>
            <div className="trust-item">
              <Clock className="w-5 h-5 text-terracotta" />
              <div>
                <strong>Effortless hotel logistics</strong>
                <p>Clear check-in, check-out, and luggage transit times whenever your route moves between bases.</p>
              </div>
            </div>
          </div>

          <div className="footer-bottom-row">
            <div className="footer-brand-side">
              <span className="footer-wordmark">Travora</span>
              <p className="footer-copyright">
                © {new Date().getFullYear()} Travora Travel. An editorial travel planner.
              </p>
            </div>
            <div className="footer-meta-side">
              <span className="demo-data-badge">
                Curated Travel Experience
              </span>
              <p className="footer-disclaimer">
                Handcrafted recommendations, real-world transit schedules, and verified neighborhood stays.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
