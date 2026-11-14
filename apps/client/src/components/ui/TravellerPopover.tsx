import React, { useState, useRef, useEffect } from "react";
import { Users, ChevronDown } from "lucide-react";
import { Stepper } from "./Stepper.js";

export interface TravellerConfig {
  adults: number;
  children: number;
  childAges?: number[];
  rooms?: number;
}

interface TravellerPopoverProps {
  value: TravellerConfig;
  onChange: (val: TravellerConfig) => void;
  className?: string;
}

export function TravellerPopover({ value, onChange, className = "" }: TravellerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const adults = value.adults || 1;
  const children = value.children || 0;
  const total = adults + children;
  const rooms = value.rooms ?? Math.max(1, Math.ceil(total / 2));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleAdultsChange = (nextAdults: number) => {
    onChange({
      ...value,
      adults: nextAdults,
      rooms: Math.max(1, Math.ceil((nextAdults + children) / 2)),
    });
  };

  const handleChildrenChange = (nextChildren: number) => {
    const currentAges = value.childAges || [];
    let nextAges = [...currentAges];
    if (nextChildren > currentAges.length) {
      while (nextAges.length < nextChildren) {
        nextAges.push(7); // default age 7
      }
    } else {
      nextAges = nextAges.slice(0, nextChildren);
    }
    onChange({
      ...value,
      children: nextChildren,
      childAges: nextAges,
      rooms: Math.max(1, Math.ceil((adults + nextChildren) / 2)),
    });
  };

  const handleChildAgeChange = (index: number, age: number) => {
    const nextAges = [...(value.childAges || [])];
    nextAges[index] = age;
    onChange({
      ...value,
      childAges: nextAges,
    });
  };

  const summary = `${total} traveller${total > 1 ? "s" : ""}, ${rooms} room${rooms > 1 ? "s" : ""}`;

  return (
    <div className={`traveller-popover-container ${className}`} ref={containerRef}>
      <label className="field-label">Travellers & Rooms</label>
      <button
        type="button"
        className={`traveller-trigger-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="trigger-icon-wrap">
          <Users className="w-4 h-4 text-ink-muted" />
        </span>
        <span className="trigger-text">{summary}</span>
        <ChevronDown className={`w-4 h-4 text-ink-muted chevron ${isOpen ? "rotate" : ""}`} />
      </button>

      {isOpen && (
        <div className="traveller-dropdown-panel" role="dialog" aria-label="Choose travellers">
          <div className="traveller-stepper-row">
            <div>
              <div className="traveller-row-title">Adults</div>
              <div className="traveller-row-sub">Ages 18 or above</div>
            </div>
            <Stepper
              value={adults}
              onChange={handleAdultsChange}
              min={1}
              max={9}
              ariaLabel="Adults"
            />
          </div>

          <div className="traveller-stepper-row">
            <div>
              <div className="traveller-row-title">Children</div>
              <div className="traveller-row-sub">Ages 0 to 17</div>
            </div>
            <Stepper
              value={children}
              onChange={handleChildrenChange}
              min={0}
              max={6}
              ariaLabel="Children"
            />
          </div>

          {children > 0 && (
            <div className="child-ages-section">
              <span className="child-ages-label">Ages of children at travel time:</span>
              <div className="child-ages-grid">
                {(value.childAges || []).map((age, idx) => (
                  <div key={idx} className="child-age-select-wrap">
                    <label className="child-age-sub">Child {idx + 1}</label>
                    <select
                      value={age}
                      onChange={(e) => handleChildAgeChange(idx, parseInt(e.target.value, 10))}
                      className="child-age-select"
                    >
                      {Array.from({ length: 18 }, (_, a) => (
                        <option key={a} value={a}>
                          {a === 0 ? "Under 1" : `${a} yrs`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="traveller-stepper-row border-top">
            <div>
              <div className="traveller-row-title">Rooms</div>
              <div className="traveller-row-sub">Estimated lodging rooms</div>
            </div>
            <Stepper
              value={rooms}
              onChange={(nextRooms) => onChange({ ...value, rooms: nextRooms })}
              min={1}
              max={5}
              ariaLabel="Rooms"
            />
          </div>

          <button
            type="button"
            className="traveller-done-btn"
            onClick={() => setIsOpen(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
