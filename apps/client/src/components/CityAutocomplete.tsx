import React, { useState, useRef, useEffect } from "react";
import { MapPinIcon } from "./Icons";

export interface CityOption {
  city: string;
  region?: string;
  country: string;
  label: string;
}

export const POPULAR_CITIES: CityOption[] = [
  // India (Major Hubs & Tourist Destinations)
  { city: "Delhi", region: "NCR", country: "India", label: "Delhi, India" },
  { city: "New Delhi", region: "Delhi", country: "India", label: "New Delhi, India" },
  { city: "Mumbai", region: "Maharashtra", country: "India", label: "Mumbai, Maharashtra, India" },
  { city: "Bengaluru", region: "Karnataka", country: "India", label: "Bengaluru, Karnataka, India" },
  { city: "Dehradun", region: "Uttarakhand", country: "India", label: "Dehradun, Uttarakhand, India" },
  { city: "Udaipur", region: "Rajasthan", country: "India", label: "Udaipur, Rajasthan, India" },
  { city: "Jaipur", region: "Rajasthan", country: "India", label: "Jaipur, Rajasthan, India" },
  { city: "Jodhpur", region: "Rajasthan", country: "India", label: "Jodhpur, Rajasthan, India" },
  { city: "Agra", region: "Uttar Pradesh", country: "India", label: "Agra, Uttar Pradesh, India" },
  { city: "Goa", region: "Goa", country: "India", label: "Goa, India" },
  { city: "Varanasi", region: "Uttar Pradesh", country: "India", label: "Varanasi, Uttar Pradesh, India" },
  { city: "Kolkata", region: "West Bengal", country: "India", label: "Kolkata, West Bengal, India" },
  { city: "Chennai", region: "Tamil Nadu", country: "India", label: "Chennai, Tamil Nadu, India" },
  { city: "Hyderabad", region: "Telangana", country: "India", label: "Hyderabad, Telangana, India" },
  { city: "Kochi", region: "Kerala", country: "India", label: "Kochi, Kerala, India" },
  { city: "Manali", region: "Himachal Pradesh", country: "India", label: "Manali, Himachal Pradesh, India" },
  { city: "Shimla", region: "Himachal Pradesh", country: "India", label: "Shimla, Himachal Pradesh, India" },
  { city: "Rishikesh", region: "Uttarakhand", country: "India", label: "Rishikesh, Uttarakhand, India" },
  { city: "Amritsar", region: "Punjab", country: "India", label: "Amritsar, Punjab, India" },
  { city: "Srinagar", region: "Jammu & Kashmir", country: "India", label: "Srinagar, Jammu & Kashmir, India" },
  { city: "Pune", region: "Maharashtra", country: "India", label: "Pune, Maharashtra, India" },
  { city: "Ahmedabad", region: "Gujarat", country: "India", label: "Ahmedabad, Gujarat, India" },

  // USA & Americas
  { city: "Denver", region: "CO", country: "USA", label: "Denver, CO, USA" },
  { city: "Detroit", region: "MI", country: "USA", label: "Detroit, MI, USA" },
  { city: "Destin", region: "FL", country: "USA", label: "Destin, FL, USA" },
  { city: "New York", region: "NY", country: "USA", label: "New York, NY, USA" },
  { city: "San Francisco", region: "CA", country: "USA", label: "San Francisco, CA, USA" },
  { city: "Los Angeles", region: "CA", country: "USA", label: "Los Angeles, CA, USA" },
  { city: "Miami", region: "FL", country: "USA", label: "Miami, FL, USA" },
  { city: "Chicago", region: "IL", country: "USA", label: "Chicago, IL, USA" },
  { city: "Seattle", region: "WA", country: "USA", label: "Seattle, WA, USA" },
  { city: "Boston", region: "MA", country: "USA", label: "Boston, MA, USA" },
  { city: "Las Vegas", region: "NV", country: "USA", label: "Las Vegas, NV, USA" },
  { city: "Honolulu", region: "HI", country: "USA", label: "Honolulu, HI, USA" },
  { city: "Toronto", region: "ON", country: "Canada", label: "Toronto, ON, Canada" },
  { city: "Vancouver", region: "BC", country: "Canada", label: "Vancouver, BC, Canada" },
  { city: "Cancun", region: "Quintana Roo", country: "Mexico", label: "Cancun, Mexico" },
  { city: "Rio de Janeiro", country: "Brazil", label: "Rio de Janeiro, Brazil" },
  { city: "Buenos Aires", country: "Argentina", label: "Buenos Aires, Argentina" },

  // Europe
  { city: "Derby", country: "UK", label: "Derby, UK" },
  { city: "London", country: "UK", label: "London, UK" },
  { city: "Lisbon", country: "Portugal", label: "Lisbon, Portugal" },
  { city: "Paris", country: "France", label: "Paris, France" },
  { city: "Rome", country: "Italy", label: "Rome, Italy" },
  { city: "Barcelona", country: "Spain", label: "Barcelona, Spain" },
  { city: "Madrid", country: "Spain", label: "Madrid, Spain" },
  { city: "Amsterdam", country: "Netherlands", label: "Amsterdam, Netherlands" },
  { city: "Berlin", country: "Germany", label: "Berlin, Germany" },
  { city: "Munich", country: "Germany", label: "Munich, Germany" },
  { city: "Vienna", country: "Austria", label: "Vienna, Austria" },
  { city: "Prague", country: "Czechia", label: "Prague, Czechia" },
  { city: "Zurich", country: "Switzerland", label: "Zurich, Switzerland" },
  { city: "Geneva", country: "Switzerland", label: "Geneva, Switzerland" },
  { city: "Florence", country: "Italy", label: "Florence, Italy" },
  { city: "Venice", country: "Italy", label: "Venice, Italy" },
  { city: "Athens", country: "Greece", label: "Athens, Greece" },
  { city: "Santorini", country: "Greece", label: "Santorini, Greece" },
  { city: "Dublin", country: "Ireland", label: "Dublin, Ireland" },
  { city: "Edinburgh", country: "UK", label: "Edinburgh, UK" },

  // Asia & Middle East
  { city: "Tokyo", country: "Japan", label: "Tokyo, Japan" },
  { city: "Kyoto", country: "Japan", label: "Kyoto, Japan" },
  { city: "Osaka", country: "Japan", label: "Osaka, Japan" },
  { city: "Bangkok", country: "Thailand", label: "Bangkok, Thailand" },
  { city: "Phuket", country: "Thailand", label: "Phuket, Thailand" },
  { city: "Singapore", country: "Singapore", label: "Singapore" },
  { city: "Dubai", country: "UAE", label: "Dubai, UAE" },
  { city: "Abu Dhabi", country: "UAE", label: "Abu Dhabi, UAE" },
  { city: "Doha", country: "Qatar", label: "Doha, Qatar" },
  { city: "Bali", country: "Indonesia", label: "Bali, Indonesia" },
  { city: "Seoul", country: "South Korea", label: "Seoul, South Korea" },
  { city: "Hanoi", country: "Vietnam", label: "Hanoi, Vietnam" },
  { city: "Hong Kong", country: "Hong Kong", label: "Hong Kong" },
  { city: "Taipei", country: "Taiwan", label: "Taipei, Taiwan" },
  { city: "Kuala Lumpur", country: "Malaysia", label: "Kuala Lumpur, Malaysia" },

  // Australia & Oceania
  { city: "Sydney", country: "Australia", label: "Sydney, Australia" },
  { city: "Melbourne", country: "Australia", label: "Melbourne, Australia" },
  { city: "Auckland", country: "New Zealand", label: "Auckland, New Zealand" },

  // Africa
  { city: "Cairo", country: "Egypt", label: "Cairo, Egypt" },
  { city: "Cape Town", country: "South Africa", label: "Cape Town, South Africa" },
  { city: "Marrakech", country: "Morocco", label: "Marrakech, Morocco" },
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Search for a city...",
  required = false,
  className = "",
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter cities based on typed input with prefix match priority
  const query = value.trim().toLowerCase();
  const filtered = query.length === 0
    ? POPULAR_CITIES.slice(0, 8)
    : POPULAR_CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(query) ||
          c.country.toLowerCase().includes(query) ||
          (c.region && c.region.toLowerCase().includes(query)) ||
          c.label.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const aCity = a.city.toLowerCase();
        const bCity = b.city.toLowerCase();
        const aStarts = aCity.startsWith(query);
        const bStarts = bCity.startsWith(query);

        // 1. Exact city name match first
        if (aCity === query) return -1;
        if (bCity === query) return 1;

        // 2. City startsWith query comes before substring match
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 3. Among startsWith, shorter length (e.g. "Delhi" vs "Dehradun") first
        if (aStarts && bStarts) {
          return aCity.length - bCity.length;
        }

        return a.city.localeCompare(b.city);
      })
      .slice(0, 10);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cityLabel: string) => {
    onChange(cityLabel);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        e.preventDefault();
        handleSelect(filtered[highlightedIndex].label);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const inputId = React.useId();
  const listboxId = React.useId();

  return (
    <div className={`city-autocomplete-container ${className}`} ref={containerRef}>
      <div className="city-input-wrapper">
        <input
          id={inputId}
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="city-text-input"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
          }
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="City suggestions"
          className="city-dropdown-menu"
        >
          {filtered.map((item, idx) => (
            <li
              id={`${listboxId}-option-${idx}`}
              key={item.label}
              role="option"
              aria-selected={highlightedIndex === idx}
              className={`city-dropdown-item ${highlightedIndex === idx ? "highlighted" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input blur before select
                handleSelect(item.label);
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              <div className="city-item-icon" aria-hidden="true">
                <MapPinIcon className="w-4 h-4 text-emerald" />
              </div>
              <div className="city-item-details">
                <strong className="city-item-name">{item.city}</strong>
                <span className="city-item-meta">
                  {item.region ? `${item.region}, ` : ""}
                  {item.country}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
