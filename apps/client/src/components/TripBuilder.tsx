import React, { useState, useEffect, useRef } from "react";
import type {
  CreateTripRequest,
  TravelStyle,
  TransportPreference,
  PacePreference,
} from "@travora/contracts";
import { getPreferences, parsePromptToTrip } from "../api/client.js";
import { CityAutocomplete } from "./CityAutocomplete.js";
import { HeroBanner } from "./HeroBanner.js";
import { LandingSections } from "./LandingSections.js";
import {
  Button,
  Chip,
  SegmentedControl,
  TravellerPopover,
  DateRangePicker,
  type TravellerConfig,
  type SegmentedOption,
} from "./ui/index.js";
import {
  ArrowLeftRight,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Compass,
  AlertCircle,
  FileText,
} from "lucide-react";

interface TripBuilderProps {
  onSubmit: (trip: CreateTripRequest) => void;
  isLoading: boolean;
}

const INTEREST_OPTIONS = [
  { id: "culture", label: "Culture & museums" },
  { id: "food", label: "Food & wine" },
  { id: "nature", label: "Outdoor & nature" },
  { id: "history", label: "Historic sites" },
  { id: "shopping", label: "Shopping" },
  { id: "architecture", label: "Architecture" },
  { id: "nightlife", label: "Nightlife" },
  { id: "relaxing", label: "Relaxing" },
  { id: "family", label: "Family-friendly" },
  { id: "hidden-gems", label: "Hidden gems" },
];

const DIETARY_SUGGESTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Step-free access",
  "Near public transit",
];

const ROTATING_PLACEHOLDERS = [
  "A 5-day food and architecture trip to Tokyo for two, moderate budget, not too rushed.",
  "Family road trip from Lisbon to Porto in October, staying in small hotels, with a 7-year-old.",
  "Solo weekend in Edinburgh focused on ghost tours, cozy pubs and bookshops under £500.",
];

const PROMPT_IDEA_CHIPS = [
  "4 days in Paris for a couple, art & gourmet food",
  "5 days luxury trip to Udaipur & Jodhpur for 2",
  "Tokyo 6 days: anime, tech, ramen, moderate pace",
  "Lisbon coastal weekend, historic trams, €1200",
];

const TRAVEL_STYLES: SegmentedOption<TravelStyle>[] = [
  { value: "balanced", label: "Balanced" },
  { value: "relaxed", label: "Relaxed" },
  { value: "luxury", label: "Luxury" },
  { value: "budget", label: "Budget" },
];

const PACE_OPTIONS: SegmentedOption<PacePreference>[] = [
  { value: "relaxed", label: "Relaxed" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CHF", "SGD", "AED"];

const STORAGE_KEY = "travora_planner_draft";

export function TripBuilder({ onSubmit, isLoading }: TripBuilderProps) {
  // Tab state: "details" | "prompt"
  const [activeTab, setActiveTab] = useState<"details" | "prompt">("details");

  // Tab 1 fields
  const [origin, setOrigin] = useState("London, UK");
  const [destination, setDestination] = useState("Lisbon, Portugal");
  const [startDate, setStartDate] = useState("2027-05-10");
  const [endDate, setEndDate] = useState("2027-05-14");
  const [travellers, setTravellers] = useState<TravellerConfig>({
    adults: 2,
    children: 0,
    rooms: 1,
  });

  // More options disclosure
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [currency, setCurrency] = useState(() => {
    try {
      const saved = localStorage.getItem("travora_currency");
      if (saved) return saved;
      const detected = Intl.NumberFormat().resolvedOptions().currency?.toUpperCase();
      return CURRENCIES.includes(detected || "") ? (detected as string) : "USD";
    } catch {
      return "USD";
    }
  });
  const [budgetDisplay, setBudgetDisplay] = useState("2000");
  const [travelStyle, setTravelStyle] = useState<TravelStyle>("balanced");
  const [pace, setPace] = useState<PacePreference>("moderate");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "culture",
    "food",
    "history",
  ]);
  const [dietary, setDietary] = useState("");

  // Tab 2 fields
  const [promptText, setPromptText] = useState("");
  const [isParsingPrompt, setIsParsingPrompt] = useState(false);
  const [promptFeedback, setPromptFeedback] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const plannerCardRef = useRef<HTMLDivElement>(null);

  // Rotate prompt placeholder
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Restore draft from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.origin) setOrigin(parsed.origin);
        if (parsed.destination) setDestination(parsed.destination);
        if (parsed.startDate) setStartDate(parsed.startDate);
        if (parsed.endDate) setEndDate(parsed.endDate);
        if (parsed.travellers) setTravellers(parsed.travellers);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.budgetDisplay) setBudgetDisplay(parsed.budgetDisplay);
        if (parsed.travelStyle) setTravelStyle(parsed.travelStyle);
        if (parsed.pace) setPace(parsed.pace);
        if (parsed.selectedInterests) setSelectedInterests(parsed.selectedInterests);
        if (parsed.dietary) setDietary(parsed.dietary);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  // Autosave draft to sessionStorage
  useEffect(() => {
    try {
      const draft = {
        origin,
        destination,
        startDate,
        endDate,
        travellers,
        currency,
        budgetDisplay,
        travelStyle,
        pace,
        selectedInterests,
        dietary,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [
    origin,
    destination,
    startDate,
    endDate,
    travellers,
    currency,
    budgetDisplay,
    travelStyle,
    pace,
    selectedInterests,
    dietary,
  ]);

  // Fetch backend preferences if available
  useEffect(() => {
    getPreferences()
      .then((pref) => {
        if (pref.preferredCurrency) setCurrency(pref.preferredCurrency);
        if (pref.travelStyle) setTravelStyle(pref.travelStyle as TravelStyle);
        if (pref.pace) setPace(pref.pace as PacePreference);
        if (pref.dietaryRestrictions && pref.dietaryRestrictions.length > 0) {
          setDietary(pref.dietaryRestrictions.join(", "));
        }
        if (pref.interests && pref.interests.length > 0) {
          setSelectedInterests(pref.interests);
        }
      })
      .catch(() => {});
  }, []);

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    try {
      localStorage.setItem("travora_currency", newCurr);
    } catch {
      // ignore
    }
  };

  const handleSwapLocations = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const scrollToPlanner = () => {
    plannerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSelectDestination = (dest: string) => {
    setDestination(dest);
    setActiveTab("details");
    scrollToPlanner();
  };

  const handleApplyTheme = (theme: {
    interests: string[];
    pace: PacePreference;
    style: TravelStyle;
  }) => {
    setSelectedInterests(theme.interests);
    setPace(theme.pace);
    setTravelStyle(theme.style);
    setIsMoreOptionsOpen(true);
    setActiveTab("details");
    scrollToPlanner();
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddDietary = (suggestion: string) => {
    const current = dietary.trim();
    if (!current) {
      setDietary(suggestion);
    } else if (!current.toLowerCase().includes(suggestion.toLowerCase())) {
      setDietary(`${current}, ${suggestion}`);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!origin.trim()) {
      newErrors.origin = "Please provide a starting departure city.";
    }
    if (!destination.trim()) {
      newErrors.destination = "Please specify a destination.";
    }
    if (!startDate) {
      newErrors.startDate = "Select departure date.";
    }
    if (!endDate) {
      newErrors.endDate = "Select return date.";
    } else if (startDate && endDate <= startDate) {
      newErrors.endDate = "Return date must be strictly after departure date.";
    }

    const numBudget = parseFloat(budgetDisplay);
    if (isNaN(numBudget) || numBudget <= 0) {
      newErrors.budget = "Please enter a realistic budget amount.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setSummaryError("Please review the highlighted fields before submitting.");
      return false;
    }

    setSummaryError(null);
    return true;
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const numericBudget = parseFloat(budgetDisplay);
    const amountInSmallestUnit = Math.round(numericBudget * 100);
    const transportPreferences: TransportPreference[] = ["public_transit", "walking"];

    const tripRequest: CreateTripRequest = {
      origin: origin.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      timezone: "UTC",
      travellers: {
        adults: travellers.adults,
        children: travellers.children,
        infants: 0,
      },
      budget: {
        amount: amountInSmallestUnit,
        currency,
        flexibilityPct: 10,
      },
      interests: selectedInterests,
      travelStyle,
      transportPreferences,
      constraints: {
        accessibility: dietary.toLowerCase().includes("step-free") ? ["wheelchair_accessible"] : [],
        dietary: dietary ? dietary.split(",").map((s) => s.trim()).filter(Boolean) : [],
        pace,
      },
    };

    onSubmit(tripRequest);
  };

  const handlePromptParse = async (autoSubmit: boolean) => {
    if (!promptText.trim()) return;
    setIsParsingPrompt(true);
    setPromptFeedback(null);

    try {
      const { tripRequest, summary } = await parsePromptToTrip(promptText.trim());

      setOrigin(tripRequest.origin);
      setDestination(tripRequest.destination);
      setStartDate(tripRequest.startDate);
      setEndDate(tripRequest.endDate);
      setTravellers({
        adults: tripRequest.travellers.adults,
        children: tripRequest.travellers.children,
        rooms: Math.max(1, Math.ceil((tripRequest.travellers.adults + tripRequest.travellers.children) / 2)),
      });
      setCurrency(tripRequest.budget.currency);
      setBudgetDisplay(String(tripRequest.budget.amount / 100));
      setTravelStyle(tripRequest.travelStyle);
      setSelectedInterests(tripRequest.interests);
      setPace(tripRequest.constraints.pace || "moderate");
      setDietary(tripRequest.constraints.dietary.join(", ") || "");

      if (summary) {
        setPromptFeedback(summary);
      }

      if (autoSubmit) {
        onSubmit(tripRequest);
      } else {
        setActiveTab("details");
        scrollToPlanner();
      }
    } catch (err) {
      setPromptFeedback(
        `Could not extract trip: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsParsingPrompt(false);
    }
  };

  // Formatted budget preview
  const budgetNum = parseFloat(budgetDisplay) || 0;
  const formattedBudgetPreview = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCIES.includes(currency) ? currency : "USD",
    maximumFractionDigits: 0,
  }).format(budgetNum);

  return (
    <div className="trip-builder-editorial">
      {/* Editorial Hero with Overlapping Planner */}
      <HeroBanner>
        <div id="planner" className="planner-unified-card" ref={plannerCardRef}>
          {/* Planner Card Header Tabs */}
          <div className="planner-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "details"}
              className={`planner-tab-btn ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              <Compass className="w-4 h-4" />
              <span>Plan with details</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "prompt"}
              className={`planner-tab-btn ${activeTab === "prompt" ? "active" : ""}`}
              onClick={() => setActiveTab("prompt")}
            >
              <FileText className="w-4 h-4" />
              <span>Describe your trip</span>
            </button>
          </div>

          {/* ──────────────── TAB 1: PLAN WITH DETAILS ──────────────── */}
          {activeTab === "details" && (
            <form onSubmit={handleSubmitDetails} className="planner-details-form" noValidate>
              {summaryError && (
                <div className="planner-error-banner" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{summaryError}</span>
                </div>
              )}

              {/* Airline-style horizontal bar */}
              <div className="planner-top-bar">
                {/* 1. From */}
                <div className="planner-bar-segment">
                  <label className="bar-segment-label">Starting from</label>
                  <CityAutocomplete
                    value={origin}
                    onChange={(val) => {
                      setOrigin(val);
                      if (errors.origin) setErrors((prev) => ({ ...prev, origin: "" }));
                    }}
                    placeholder="Departure city (e.g. London, Delhi, NYC)"
                    className={errors.origin ? "has-error" : ""}
                  />
                  {errors.origin && <span className="field-error-text">{errors.origin}</span>}
                </div>

                {/* Swap button */}
                <div className="planner-swap-col">
                  <button
                    type="button"
                    className="planner-swap-btn"
                    onClick={handleSwapLocations}
                    aria-label="Swap departure and destination cities"
                    title="Swap locations"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. To */}
                <div className="planner-bar-segment">
                  <label className="bar-segment-label">Where to</label>
                  <CityAutocomplete
                    value={destination}
                    onChange={(val) => {
                      setDestination(val);
                      if (errors.destination) setErrors((prev) => ({ ...prev, destination: "" }));
                    }}
                    placeholder="Destination (e.g. Lisbon, Tokyo, Paris)"
                    className={errors.destination ? "has-error" : ""}
                  />
                  {errors.destination && (
                    <span className="field-error-text">{errors.destination}</span>
                  )}
                </div>

                {/* 3. Dates */}
                <div className="planner-bar-segment date-segment">
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(start, end) => {
                      setStartDate(start);
                      setEndDate(end);
                      if (errors.startDate || errors.endDate) {
                        setErrors((prev) => ({ ...prev, startDate: "", endDate: "" }));
                      }
                    }}
                    label="Dates"
                    error={errors.endDate || errors.startDate}
                  />
                </div>

                {/* 4. Travellers */}
                <div className="planner-bar-segment travellers-segment">
                  <TravellerPopover
                    value={travellers}
                    onChange={(t) => setTravellers(t)}
                  />
                </div>
              </div>

              {/* More options disclosure toggle */}
              <div className="planner-disclosure-toggle-row">
                <button
                  type="button"
                  className="more-options-toggle-btn"
                  onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                  aria-expanded={isMoreOptionsOpen}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{isMoreOptionsOpen ? "Hide options" : "More options (Budget, style, pace, dietary)"}</span>
                  <ChevronDown className={`w-4 h-4 chevron ${isMoreOptionsOpen ? "rotate" : ""}`} />
                </button>
              </div>

              {/* More options collapsed body */}
              {isMoreOptionsOpen && (
                <div className="planner-more-options-body">
                  <div className="more-options-grid">
                    {/* Budget row */}
                    <div className="option-col budget-col">
                      <label className="field-label">Target Trip Budget</label>
                      <div className="budget-input-group">
                        <select
                          value={currency}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="currency-select"
                          aria-label="Currency"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          step="10"
                          value={budgetDisplay}
                          onChange={(e) => setBudgetDisplay(e.target.value)}
                          placeholder="e.g. 2000"
                          className="budget-number-input"
                          aria-label="Budget amount"
                        />
                      </div>
                      <span className="budget-preview-hint">
                        Formatted: <strong>{formattedBudgetPreview}</strong>
                      </span>
                      {errors.budget && <span className="field-error-text">{errors.budget}</span>}
                    </div>

                    {/* Travel Style */}
                    <div className="option-col">
                      <SegmentedControl
                        label="Travel Style"
                        value={travelStyle}
                        onChange={(v) => setTravelStyle(v)}
                        options={TRAVEL_STYLES}
                      />
                    </div>

                    {/* Daily Pace */}
                    <div className="option-col">
                      <SegmentedControl
                        label="Daily Pace"
                        value={pace}
                        onChange={(v) => setPace(v)}
                        options={PACE_OPTIONS}
                      />
                    </div>
                  </div>

                  {/* Interests toggle chips */}
                  <div className="option-block mt-4">
                    <label className="field-label">Interests & Activities</label>
                    <div className="interests-chip-grid">
                      {INTEREST_OPTIONS.map((item) => {
                        const isSelected = selectedInterests.includes(item.id);
                        return (
                          <Chip
                            key={item.id}
                            label={item.label}
                            selected={isSelected}
                            onToggle={() => toggleInterest(item.id)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary & Accessibility notes */}
                  <div className="option-block mt-4">
                    <label className="field-label">Dietary & Accessibility Notes</label>
                    <textarea
                      rows={2}
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      placeholder="e.g. Vegetarian, elevator access preferred, stroller-friendly..."
                      className="editorial-textarea"
                    />
                    <div className="dietary-suggestions-row">
                      <span className="suggestions-label">Quick suggestions:</span>
                      {DIETARY_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          className="dietary-pill-btn"
                          onClick={() => handleAddDietary(sug)}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="planner-submit-bar">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="planner-plan-btn"
                >
                  Plan my trip
                </Button>
              </div>
            </form>
          )}

          {/* ──────────────── TAB 2: DESCRIBE YOUR TRIP ──────────────── */}
          {activeTab === "prompt" && (
            <div className="planner-prompt-view">
              <label className="field-label">Describe your ideal itinerary in plain words</label>
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
                className="prompt-large-textarea"
              />

              {/* 4 Prompt idea chips */}
              <div className="prompt-ideas-row">
                <span className="prompt-ideas-label">Sample prompts:</span>
                <div className="prompt-chips-wrap">
                  {PROMPT_IDEA_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="prompt-idea-chip"
                      onClick={() => setPromptText(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {promptFeedback && (
                <div className="prompt-feedback-notice">
                  <span>{promptFeedback}</span>
                </div>
              )}

              <div className="prompt-action-row">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading || isParsingPrompt}
                  onClick={() => handlePromptParse(true)}
                  disabled={!promptText.trim()}
                >
                  Plan my trip
                </Button>

                <button
                  type="button"
                  className="prompt-secondary-btn"
                  onClick={() => handlePromptParse(false)}
                  disabled={!promptText.trim() || isParsingPrompt}
                >
                  {isParsingPrompt ? "Extracting..." : "Fill the form from my description"}
                </button>
              </div>
            </div>
          )}
        </div>
      </HeroBanner>

      {/* Landing Page Editorial Content */}
      <LandingSections
        onSelectDestination={handleSelectDestination}
        onApplyTheme={handleApplyTheme}
      />
    </div>
  );
}
