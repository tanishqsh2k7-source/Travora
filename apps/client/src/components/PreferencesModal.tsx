import React, { useState, useEffect } from "react";
import {
  getPreferences,
  updatePreferences,
  type UserPreferencesResponse,
} from "../api/client";
import { SparklesIcon, CurrencyIcon, CheckCircleIcon } from "./Icons";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (preferences: UserPreferencesResponse) => void;
}

const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "gluten-free",
  "dairy-free",
  "nut-free",
];

const ACCESSIBILITY_OPTIONS = [
  "wheelchair",
  "minimal_walking",
  "elevator_required",
  "step_free",
];

const TRANSPORT_OPTIONS = [
  { key: "public_transit", label: "Public Transit" },
  { key: "walking", label: "Walking" },
  { key: "train", label: "High-speed / Regional Train" },
  { key: "flight", label: "Domestic Flight" },
  { key: "rideshare", label: "Rideshare / Taxi" },
  { key: "car_rental", label: "Car Rental" },
];

export function PreferencesModal({ isOpen, onClose, onSaved }: PreferencesModalProps) {
  const [currency, setCurrency] = useState("EUR");
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [pace, setPace] = useState("moderate");
  const [dietary, setDietary] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [transport, setTransport] = useState<string[]>(["public_transit", "walking"]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getPreferences()
        .then((pref) => {
          if (pref.preferredCurrency) setCurrency(pref.preferredCurrency);
          if (pref.travelStyle) setTravelStyle(pref.travelStyle);
          if (pref.pace) setPace(pref.pace);
          if (pref.dietaryRestrictions) setDietary(pref.dietaryRestrictions);
          if (pref.accessibilityRequirements) setAccessibility(pref.accessibilityRequirements);
          if (pref.transportPreferences) setTransport(pref.transportPreferences);
        })
        .catch((err) => {
          console.warn("Failed to load user preferences:", err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDietary = (item: string) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item]
    );
  };

  const toggleAccessibility = (item: string) => {
    setAccessibility((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const toggleTransport = (item: string) => {
    setTransport((prev) =>
      prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await updatePreferences({
        preferredCurrency: currency,
        travelStyle,
        pace,
        dietaryRestrictions: dietary,
        accessibilityRequirements: accessibility,
        transportPreferences: transport,
      });

      setSaveSuccess(true);
      if (onSaved) onSaved(updated);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      alert("Failed to save preferences: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <SparklesIcon className="w-5 h-5 text-indigo" />
            <h3>Traveler Profile & Global Preferences</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="form-grid">
            {/* Preferred Currency */}
            <div className="form-group">
              <label>
                <CurrencyIcon className="w-4 h-4 text-muted" /> Preferred Currency
              </label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="EUR">EUR (€) - Eurozone</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            {/* Travel Style */}
            <div className="form-group">
              <label>Default Travel Style</label>
              <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)}>
                <option value="balanced">Balanced (Well-rounded)</option>
                <option value="relaxed">Relaxed (Spacious schedule)</option>
                <option value="budget">Budget (Cost-conscious)</option>
                <option value="luxury">Luxury (Premium)</option>
                <option value="fast-paced">Fast-Paced (Active highlights)</option>
              </select>
            </div>

            {/* Pace */}
            <div className="form-group">
              <label>Daily Pace</label>
              <select value={pace} onChange={(e) => setPace(e.target.value)}>
                <option value="relaxed">Relaxed (~2 places / day)</option>
                <option value="moderate">Moderate (~3-4 places / day)</option>
                <option value="fast">Fast (~5+ places / day)</option>
              </select>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="preferences-section">
            <label className="section-label">Dietary Restrictions & Allergies</label>
            <div className="tag-cloud">
              {DIETARY_OPTIONS.map((item) => {
                const active = dietary.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    className={`tag-pill ${active ? "active" : ""}`}
                    onClick={() => toggleDietary(item)}
                  >
                    {active ? "✓ " : "+ "}
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessibility Requirements */}
          <div className="preferences-section">
            <label className="section-label">Accessibility Requirements</label>
            <div className="tag-cloud">
              {ACCESSIBILITY_OPTIONS.map((item) => {
                const active = accessibility.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    className={`tag-pill ${active ? "active" : ""}`}
                    onClick={() => toggleAccessibility(item)}
                  >
                    {active ? "✓ " : "+ "}
                    {item.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transport Preferences */}
          <div className="preferences-section">
            <label className="section-label">Preferred Transport Modes</label>
            <div className="checkbox-grid">
              {TRANSPORT_OPTIONS.map((opt) => (
                <label key={opt.key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={transport.includes(opt.key)}
                    onChange={() => toggleTransport(opt.key)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {saveSuccess && (
            <div className="success-banner">
              <CheckCircleIcon className="w-4 h-4 text-emerald" />
              <span>Preferences updated successfully!</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Profile Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

