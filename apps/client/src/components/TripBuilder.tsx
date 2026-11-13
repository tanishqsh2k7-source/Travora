import React, { useState } from "react";
import type { CreateTripRequest, TravelStyle, TransportPreference } from "@travora/contracts";
import { SparklesIcon, CalendarIcon, MapPinIcon, CurrencyIcon } from "./Icons";

interface TripBuilderProps {
  onSubmit: (trip: CreateTripRequest) => void;
  isLoading: boolean;
}

const INTEREST_OPTIONS = [
  "history",
  "culture",
  "museums",
  "food",
  "architecture",
  "nature",
  "photography",
  "shopping",
  "nightlife",
];

const PRESETS: Array<{ label: string; description: string; data: CreateTripRequest }> = [
  {
    label: "Lisbon 4-Day Culture & Food",
    description: "Belém Tower, Jerónimos, Tram 28, Pastel de Nata, and fado vibes.",
    data: {
      origin: "London, UK",
      destination: "Lisbon, Portugal",
      startDate: "2027-05-10",
      endDate: "2027-05-13",
      timezone: "Europe/Lisbon",
      travellers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: 150000, currency: "EUR", flexibilityPct: 10 }, // €1,500
      interests: ["history", "culture", "food", "museums"],
      travelStyle: "balanced",
      transportPreferences: ["public_transit", "walking"],
      constraints: { accessibility: [], dietary: [], pace: "moderate" },
    },
  },
  {
    label: "Tokyo 5-Day Highlights",
    description: "Senso-ji, Shibuya Sky, Akihabara, sushi markets, and TeamLab.",
    data: {
      origin: "Delhi, India",
      destination: "Tokyo, Japan",
      startDate: "2027-04-10",
      endDate: "2027-04-14",
      timezone: "Asia/Tokyo",
      travellers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: 25000000, currency: "INR", flexibilityPct: 5 }, // ₹2,50,000
      interests: ["culture", "food", "shopping", "museums"],
      travelStyle: "balanced",
      transportPreferences: ["public_transit"],
      constraints: { accessibility: [], dietary: ["vegetarian"], pace: "moderate" },
    },
  },
  {
    label: "Paris 3-Day Romance & Art",
    description: "Louvre, Eiffel Tower, Montmartre, Seine cruise, and patisseries.",
    data: {
      origin: "New York, USA",
      destination: "Paris, France",
      startDate: "2027-06-15",
      endDate: "2027-06-17",
      timezone: "Europe/Paris",
      travellers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: 220000, currency: "USD", flexibilityPct: 15 }, // $2,200
      interests: ["museums", "architecture", "food", "history"],
      travelStyle: "relaxed",
      transportPreferences: ["public_transit", "walking"],
      constraints: { accessibility: [], dietary: [], pace: "relaxed" },
    },
  },
];

export function TripBuilder({ onSubmit, isLoading }: TripBuilderProps) {
  const [origin, setOrigin] = useState("London, UK");
  const [destination, setDestination] = useState("Lisbon, Portugal");
  const [startDate, setStartDate] = useState("2027-05-10");
  const [endDate, setEndDate] = useState("2027-05-13");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [currency, setCurrency] = useState("EUR");
  const [budgetDisplay, setBudgetDisplay] = useState("1500");
  const [travelStyle, setTravelStyle] = useState<TravelStyle>("balanced");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "history",
    "culture",
    "food",
  ]);
  const [pace, setPace] = useState<"relaxed" | "moderate" | "fast">("moderate");
  const [dietary, setDietary] = useState("");

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    const d = preset.data;
    setOrigin(d.origin);
    setDestination(d.destination);
    setStartDate(d.startDate);
    setEndDate(d.endDate);
    setAdults(d.travellers.adults);
    setChildren(d.travellers.children);
    setCurrency(d.budget.currency);
    setBudgetDisplay(String(d.budget.amount / 100));
    setTravelStyle(d.travelStyle);
    setSelectedInterests(d.interests);
    setPace(d.constraints.pace || "moderate");
    setDietary(d.constraints.dietary.join(", ") || "");
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericBudget = parseFloat(budgetDisplay);
    if (isNaN(numericBudget) || numericBudget <= 0) {
      alert("Please enter a valid budget amount");
      return;
    }

    const amountInSmallestUnit = Math.round(numericBudget * 100);

    const transportPreferences: TransportPreference[] = ["public_transit", "walking"];

    const tripRequest: CreateTripRequest = {
      origin,
      destination,
      startDate,
      endDate,
      timezone: "UTC",
      travellers: { adults, children, infants: 0 },
      budget: {
        amount: amountInSmallestUnit,
        currency,
        flexibilityPct: 10,
      },
      interests: selectedInterests,
      travelStyle,
      transportPreferences,
      constraints: {
        accessibility: [],
        dietary: dietary ? dietary.split(",").map((s) => s.trim()).filter(Boolean) : [],
        pace,
      },
    };

    onSubmit(tripRequest);
  };

  return (
    <div className="trip-builder">
      <div className="builder-header">
        <div className="hero-tag">
          <SparklesIcon className="w-4 h-4" /> Next-Gen Multi-Agent Travel Engine
        </div>
        <h2>Where do you want to travel?</h2>
        <p className="hero-subtitle">
          Supervised multi-agent architecture coordinates specialist research, pure-function
          arithmetic engines, route TSP heuristics, and critic replanning.
        </p>
      </div>

      <div className="presets-container">
        <span className="presets-label">⚡ Quick Presets:</span>
        <div className="preset-chips">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => applyPreset(preset)}
              title={preset.description}
            >
              <strong>{preset.label.split(" ")[0]}</strong> {preset.label.slice(preset.label.indexOf(" "))}
            </button>
          ))}
        </div>
      </div>

      <form className="builder-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Origin & Destination */}
          <div className="form-group">
            <label>
              <MapPinIcon className="w-4 h-4 text-muted" /> Origin City
            </label>
            <input
              type="text"
              required
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. London, UK"
            />
          </div>

          <div className="form-group">
            <label>
              <MapPinIcon className="w-4 h-4 text-emerald" /> Destination
            </label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Lisbon, Portugal"
            />
          </div>

          {/* Dates */}
          <div className="form-group">
            <label>
              <CalendarIcon className="w-4 h-4 text-muted" /> Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <CalendarIcon className="w-4 h-4 text-muted" /> End Date
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Travellers */}
          <div className="form-group">
            <label>Adults (18+)</label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="form-group">
            <label>Children</label>
            <input
              type="number"
              min="0"
              max="10"
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Budget */}
          <div className="form-group">
            <label>
              <CurrencyIcon className="w-4 h-4 text-muted" /> Currency
            </label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Target Budget</label>
            <input
              type="number"
              step="any"
              min="50"
              required
              value={budgetDisplay}
              onChange={(e) => setBudgetDisplay(e.target.value)}
              placeholder="e.g. 1500"
            />
          </div>

          {/* Travel Style */}
          <div className="form-group">
            <label>Travel Style</label>
            <select
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value as TravelStyle)}
            >
              <option value="balanced">Balanced (Well-rounded)</option>
              <option value="relaxed">Relaxed (Spacious schedule)</option>
              <option value="budget">Budget (Cost-conscious)</option>
              <option value="luxury">Luxury (Premium)</option>
              <option value="fast-paced">Fast-Paced (Active)</option>
            </select>
          </div>

          {/* Daily Pace */}
          <div className="form-group">
            <label>Daily Pace</label>
            <select value={pace} onChange={(e) => setPace(e.target.value as any)}>
              <option value="relaxed">Relaxed (~2 places / day)</option>
              <option value="moderate">Moderate (~3-4 places / day)</option>
              <option value="fast">Fast (~5+ places / day)</option>
            </select>
          </div>
        </div>

        {/* Interests */}
        <div className="interests-section">
          <label className="section-label">Travel Interests & Passions</label>
          <div className="tag-cloud">
            {INTEREST_OPTIONS.map((interest) => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  className={`tag-pill ${active ? "active" : ""}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {active ? "✓ " : "+ "}
                  {interest.charAt(0).toUpperCase() + interest.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary Constraints */}
        <div className="constraints-section">
          <label className="section-label">Dietary or Accessibility Needs (Optional)</label>
          <input
            type="text"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder="e.g. vegetarian, gluten-free, wheelchair accessible"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span> Dispatching Multi-Agent Graph...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" /> Generate AI Multi-Agent Itinerary
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
