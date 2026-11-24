import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, ArrowRight, X } from "lucide-react";
import {
  toDateOnly,
  parseDateOnly,
  createLocalDate,
  computeNights,
  formatDateSegment,
  formatRangeSummary,
  formatMonthTitle,
  addDaysToDateOnly,
  getTodayDateOnly,
  getFirstDayOfWeek,
  getWeekdayHeaders,
  MIN_NIGHTS,
  MAX_NIGHTS,
} from "../../utils/date-utils.js";
import { DESTINATIONS } from "../../content/destinations.js";
import seasonsDataRaw from "../../content/seasons.json";

export interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  className?: string;
  label?: string;
  error?: string;
  destination?: string;
  renderDayMeta?: (date: Date) => React.ReactNode;
}

interface SeasonsCatalog {
  [slug: string]: {
    reviewed: boolean;
    months: { [monthNum: string]: "peak" | "shoulder" | "quiet" };
  };
}

const seasonsData = seasonsDataRaw as SeasonsCatalog;

const LENGTH_PRESETS = [
  { label: "Weekend (2 nights)", nights: 2 },
  { label: "5 nights", nights: 5 },
  { label: "1 week", nights: 7 },
  { label: "2 weeks", nights: 14 },
];

const LAST_TRIP_STORAGE_KEY = "travora_last_trip_nights";

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = "",
  label = "Dates",
  error,
  destination = "",
  renderDayMeta,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Draft selection state inside open picker
  const [draftStart, setDraftStart] = useState<string | null>(startDate || null);
  const [draftEnd, setDraftEnd] = useState<string | null>(endDate || null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Active duration preset (primes next click to automatically choose end date)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Calendar view state (year & month index of primary month)
  const todayStr = getTodayDateOnly();
  const [viewYear, setViewYear] = useState(() => {
    if (startDate) return parseDateOnly(startDate).year;
    return parseDateOnly(todayStr).year;
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) return parseDateOnly(startDate).month - 1;
    // Default to next month if no date is selected, per spec item 3
    const today = parseDateOnly(todayStr);
    return today.month === 12 ? 0 : today.month;
  });

  // Focused date for keyboard navigation
  const [focusedDate, setFocusedDate] = useState<string>(startDate || todayStr);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const sheetScrollRef = useRef<HTMLDivElement>(null);
  const dayButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const dialogId = useId();
  const titleId = useId();

  // Detect mobile viewport (< 768px)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // F4: Check previous trip from storage
  const [previousTripNights, setPreviousTripNights] = useState<number | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_TRIP_STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= MAX_NIGHTS) {
          setPreviousTripNights(parsed);
          return;
        }
      }
      // Fallback check in draft storage
      const draftRaw = localStorage.getItem("travora_planner_draft");
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.startDate && draft.endDate) {
          const n = computeNights(draft.startDate, draft.endDate);
          if (n > 0 && n <= MAX_NIGHTS) {
            setPreviousTripNights(n);
          }
        }
      }
    } catch {
      // Storage access failed, ignore
    }
  }, []);

  // F2: Match destination to get suggested duration
  const matchedDestination = React.useMemo(() => {
    if (!destination) return null;
    const destClean = destination.toLowerCase().trim();
    return DESTINATIONS.find(
      (d) =>
        destClean.includes(d.name.toLowerCase()) ||
        destClean.includes(d.slug.toLowerCase()) ||
        d.name.toLowerCase().includes(destClean)
    );
  }, [destination]);

  const typicalNights = React.useMemo(() => {
    if (!matchedDestination?.suggestedDays) return null;
    const match = matchedDestination.suggestedDays.match(/(\d+)\s*(?:to|-)\s*(\d+)/i);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return Math.round((min + max) / 2);
    }
    return 5;
  }, [matchedDestination]);

  // Sync draft and calendar view when opening
  const handleOpen = () => {
    setDraftStart(startDate || null);
    setDraftEnd(endDate || null);
    setSelectedDuration(null);
    setValidationMessage(null);

    if (startDate) {
      const p = parseDateOnly(startDate);
      setViewYear(p.year);
      setViewMonth(p.month - 1);
      setFocusedDate(startDate);
    } else {
      // Open on next month when no date is selected
      const today = parseDateOnly(todayStr);
      const nextM = today.month === 12 ? 0 : today.month;
      const nextY = today.month === 12 ? today.year + 1 : today.year;
      setViewYear(nextY);
      setViewMonth(nextM);
      setFocusedDate(todayStr);
    }

    setIsOpen(true);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setDraftStart(startDate || null);
    setDraftEnd(endDate || null);
    setValidationMessage(null);
    setSelectedDuration(null);
    // Return focus to trigger button
    triggerRef.current?.focus();
  }, [startDate, endDate]);

  const handleApply = () => {
    if (draftStart && draftEnd) {
      const nights = computeNights(draftStart, draftEnd);
      if (nights < MIN_NIGHTS) {
        setValidationMessage(`Minimum stay is ${MIN_NIGHTS} night.`);
        return;
      }
      if (nights > MAX_NIGHTS) {
        setValidationMessage(`Maximum stay is ${MAX_NIGHTS} nights.`);
        return;
      }
      onChange(draftStart, draftEnd);
      // Persist for F4
      try {
        localStorage.setItem(LAST_TRIP_STORAGE_KEY, String(nights));
      } catch {
        // ignore
      }
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  const handleClear = () => {
    setDraftStart(null);
    setDraftEnd(null);
    setSelectedDuration(null);
    setValidationMessage(null);
    onChange("", "");
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleDocClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [isOpen, handleClose]);

  // Escape key & focus trapping
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && popoverRef.current) {
        const focusable = popoverRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex="0"]:not([disabled])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Position popover on desktop with flip, shift (16px), and max-height sizing
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!isOpen || isMobile || !triggerRef.current) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = Math.min(740, window.innerWidth - 32);
      const estimatedHeight = 560;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top = rect.bottom + 8;
      const shouldFlip = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
      if (shouldFlip) {
        top = Math.max(16, rect.top - estimatedHeight - 8);
      }

      // Shift horizontally with 16px edge padding
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16;
      }
      left = Math.max(16, left);

      const maxHeight = Math.min(620, window.innerHeight - 32);

      setPopoverStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: 9999,
      });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, isMobile]);

  // Navigation handlers
  const canGoPrev = () => {
    const today = parseDateOnly(todayStr);
    return !(viewYear < today.year || (viewYear === today.year && viewMonth <= today.month - 1));
  };

  const handlePrevMonth = () => {
    if (!canGoPrev()) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day selection logic
  const handleDayClick = (dateStr: string) => {
    if (dateStr < todayStr) return;
    setValidationMessage(null);

    // If a duration preset is active, clicking start immediately sets end date
    if (selectedDuration) {
      const computedEnd = addDaysToDateOnly(dateStr, selectedDuration);
      setDraftStart(dateStr);
      setDraftEnd(computedEnd);
      setSelectedDuration(null);
      setFocusedDate(dateStr);
      return;
    }

    // Step 1: No start date, or both start & end are already set -> start fresh
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(dateStr);
      setDraftEnd(null);
      setFocusedDate(dateStr);
      return;
    }

    // Step 2: Start date is chosen, user is clicking second date
    if (draftStart && !draftEnd) {
      if (dateStr < draftStart) {
        // If clicked date is before start date, treat as new start date
        setDraftStart(dateStr);
        setDraftEnd(null);
        setFocusedDate(dateStr);
        return;
      }

      if (dateStr === draftStart) {
        setValidationMessage(`Minimum stay is ${MIN_NIGHTS} night.`);
        return;
      }

      const nights = computeNights(draftStart, dateStr);
      if (nights > MAX_NIGHTS) {
        setValidationMessage(`Maximum stay is ${MAX_NIGHTS} nights. Please choose a date within 30 nights.`);
        return;
      }

      setDraftEnd(dateStr);
      setFocusedDate(dateStr);
    }
  };

  // F1 Preset click
  const handleSelectPreset = (nights: number) => {
    setSelectedDuration(nights);
    setValidationMessage(null);
    if (draftStart) {
      const computedEnd = addDaysToDateOnly(draftStart, nights);
      setDraftEnd(computedEnd);
    }
  };

  // Keyboard navigation within day cells
  const handleDayKeyDown = (e: React.KeyboardEvent, dateStr: string) => {
    let nextDateStr = dateStr;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        nextDateStr = addDaysToDateOnly(dateStr, -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        nextDateStr = addDaysToDateOnly(dateStr, 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        nextDateStr = addDaysToDateOnly(dateStr, -7);
        break;
      case "ArrowDown":
        e.preventDefault();
        nextDateStr = addDaysToDateOnly(dateStr, 7);
        break;
      case "PageUp": {
        e.preventDefault();
        const p = parseDateOnly(dateStr);
        const prevM = p.month === 1 ? 12 : p.month - 1;
        const prevY = p.month === 1 ? p.year - 1 : p.year;
        const daysInPrev = new Date(prevY, prevM, 0).getDate();
        const clampedDay = Math.min(p.day, daysInPrev);
        nextDateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
        break;
      }
      case "PageDown": {
        e.preventDefault();
        const p = parseDateOnly(dateStr);
        const nextM = p.month === 12 ? 1 : p.month + 1;
        const nextY = p.month === 12 ? p.year + 1 : p.year;
        const daysInNext = new Date(nextY, nextM, 0).getDate();
        const clampedDay = Math.min(p.day, daysInNext);
        nextDateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
        break;
      }
      case "Home": {
        e.preventDefault();
        const dt = createLocalDate(dateStr);
        const dayOfWeek = dt.getDay(); // 0 is Sunday
        nextDateStr = addDaysToDateOnly(dateStr, -dayOfWeek);
        break;
      }
      case "End": {
        e.preventDefault();
        const dt = createLocalDate(dateStr);
        const dayOfWeek = dt.getDay();
        nextDateStr = addDaysToDateOnly(dateStr, 6 - dayOfWeek);
        break;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        handleDayClick(dateStr);
        return;
      default:
        return;
    }

    if (nextDateStr < todayStr) return;

    setFocusedDate(nextDateStr);
    const nextParsed = parseDateOnly(nextDateStr);
    // Ensure the month of nextDateStr is visible
    if (nextParsed.year !== viewYear || nextParsed.month - 1 < viewMonth || nextParsed.month - 1 > viewMonth + 1) {
      setViewYear(nextParsed.year);
      setViewMonth(nextParsed.month - 1);
    }

    // Set focus on button
    setTimeout(() => {
      dayButtonRefs.current.get(nextDateStr)?.focus();
    }, 10);
  };

  // Locale-aware first day of week and weekday headers
  const userFirstDayOfWeek = React.useMemo(() => getFirstDayOfWeek(), []);
  const weekdayHeaders = React.useMemo(
    () => getWeekdayHeaders(userFirstDayOfWeek),
    [userFirstDayOfWeek]
  );

  // Month grid renderer
  const renderMonthGrid = (year: number, monthIndex: number) => {
    const startDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 = Sunday
    const leadingBlanksCount = (startDayOfWeek - userFirstDayOfWeek + 7) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthTitle = formatMonthTitle(year, monthIndex);
    const monthNumStr = String(monthIndex + 1);

    // F3: Season badge check (only when reviewed === true)
    let seasonBadge: React.ReactNode = null;
    if (matchedDestination) {
      const seasonEntry = seasonsData[matchedDestination.slug];
      if (seasonEntry && seasonEntry.reviewed === true) {
        const season = seasonEntry.months[monthNumStr];
        if (season) {
          const label = season === "peak" ? "Peak" : season === "shoulder" ? "Shoulder" : "Quiet";
          seasonBadge = (
            <span
              className={`cal-season-badge season-${season}`}
              title="Typical season, not a forecast"
              aria-label={`Typical season: ${label}`}
            >
              {label}
            </span>
          );
        }
      }
    }

    const blanks = Array.from({ length: leadingBlanksCount });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="cal-month-card" key={`${year}-${monthIndex}`}>
        <div className="cal-month-header">
          <h3 className="cal-month-title">{monthTitle}</h3>
          {seasonBadge}
        </div>

        <div className="cal-weekdays-row" role="row">
          {weekdayHeaders.map((w, idx) => (
            <span key={idx} className="cal-weekday-label" role="columnheader" aria-label={w.full}>
              {w.label}
            </span>
          ))}
        </div>

        <div className="cal-days-grid" role="grid">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="cal-day-cell cal-day-empty" aria-hidden="true" />
          ))}

          {days.map((d) => {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const localDate = createLocalDate(dateStr);
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;

            const isStart = draftStart === dateStr;
            const isEnd = draftEnd === dateStr;
            const isSingleSelected = isStart && !draftEnd;

            // In-range state
            let isInRange = false;
            let isHoverRange = false;

            if (draftStart && draftEnd) {
              isInRange = dateStr > draftStart && dateStr < draftEnd;
            } else if (draftStart && !draftEnd && hoverDate) {
              if (hoverDate > draftStart) {
                isHoverRange = dateStr > draftStart && dateStr <= hoverDate;
              }
            }

            // Aria label
            const dateFull = localDate.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            let ariaDesc = dateFull;
            if (isStart) ariaDesc += ", start of trip";
            else if (isEnd) ariaDesc += ", end of trip";
            else if (isInRange) ariaDesc += ", in trip range";

            const isFocused = dateStr === focusedDate;

            return (
              <div
                key={dateStr}
                className={`cal-day-cell ${isInRange ? "cell-in-range" : ""} ${isHoverRange ? "cell-hover-range" : ""}`}
              >
                <button
                  type="button"
                  ref={(el) => {
                    if (el) dayButtonRefs.current.set(dateStr, el);
                    else dayButtonRefs.current.delete(dateStr);
                  }}
                  disabled={isPast}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => handleDayClick(dateStr)}
                  onMouseEnter={() => draftStart && !draftEnd && setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                  onKeyDown={(e) => handleDayKeyDown(e, dateStr)}
                  className={`cal-day-btn ${isPast ? "is-past" : ""} ${isToday ? "is-today" : ""} ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""} ${isSingleSelected ? "is-single" : ""}`}
                  aria-label={ariaDesc}
                  aria-pressed={isStart || isEnd}
                >
                  <span className="cal-day-num">{d}</span>
                  {/* F5 Extension point: optional day meta */}
                  {renderDayMeta && !isPast && (
                    <span className="cal-day-meta" aria-hidden="true">
                      {renderDayMeta(localDate)}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Month 2 for desktop
  const secondMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  // 12 Months list for mobile vertical scroll
  const mobileMonths = React.useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const today = parseDateOnly(todayStr);
    let curY = today.year;
    let curM = today.month - 1;
    for (let i = 0; i < 12; i++) {
      list.push({ year: curY, month: curM });
      if (curM === 11) {
        curM = 0;
        curY++;
      } else {
        curM++;
      }
    }
    return list;
  }, [todayStr]);

  // Header step instruction text (16px semibold)
  const headerStepText = !draftStart
    ? "Select start date"
    : !draftEnd
    ? "Select return date"
    : "Dates selected";

  // Footer summary
  const currentNights = draftStart && draftEnd ? computeNights(draftStart, draftEnd) : 0;
  const footerSummary =
    draftStart && draftEnd
      ? formatRangeSummary(draftStart, draftEnd)
      : draftStart
      ? `${formatDateSegment(draftStart, true)} (Select return date)`
      : "No dates selected";

  // Trigger preview text
  const nights = computeNights(startDate, endDate);

  return (
    <div className={`date-range-picker-container ${className}`}>
      {label && <label className="field-label">{label}</label>}

      {/* Trigger Button - One line, never wrapping */}
      <button
        type="button"
        ref={triggerRef}
        className={`date-picker-trigger ${isOpen ? "open" : ""} ${error ? "has-error" : ""}`}
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="trigger-icon-wrap" aria-hidden="true">
          <Calendar className="w-4 h-4 text-ink-muted" />
        </span>

        <div className="trigger-content-row">
          {startDate && endDate ? (
            <>
              <span className="trigger-date-segment">
                <span className="desktop-date">{formatDateSegment(startDate, true)}</span>
                <span className="mobile-date">{formatDateSegment(startDate, false)}</span>
              </span>
              <span className="trigger-date-separator" aria-hidden="true">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="trigger-date-segment">
                <span className="desktop-date">{formatDateSegment(endDate, true)}</span>
                <span className="mobile-date">{formatDateSegment(endDate, false)}</span>
              </span>
              <span className="trigger-nights-pill">
                {nights} night{nights === 1 ? "" : "s"}
              </span>
            </>
          ) : startDate ? (
            <>
              <span className="trigger-date-segment">
                <span className="desktop-date">{formatDateSegment(startDate, true)}</span>
                <span className="mobile-date">{formatDateSegment(startDate, false)}</span>
              </span>
              <span className="trigger-date-separator" aria-hidden="true">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="trigger-placeholder">Select return</span>
            </>
          ) : (
            <span className="trigger-placeholder">Add dates</span>
          )}
        </div>
      </button>

      {error && <p className="field-error-msg">{error}</p>}

      {/* ────────────────── CALENDAR PORTAL ────────────────── */}
      {isOpen &&
        createPortal(
          isMobile ? (
            /* ── MOBILE: Full-Width Bottom Sheet (< 768px) ── */
            <div className="cal-sheet-backdrop" onClick={handleClose}>
              <div
                className="cal-bottom-sheet"
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                id={dialogId}
                aria-labelledby={titleId}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Handle */}
                <div className="sheet-drag-handle" aria-hidden="true" />

                {/* Header */}
                <div className="cal-sheet-header">
                  <div>
                    <h2 id={titleId} className="cal-step-title">
                      {headerStepText}
                    </h2>
                    <p className="cal-step-sub">{footerSummary}</p>
                  </div>
                  <button
                    type="button"
                    className="cal-close-icon-btn"
                    onClick={handleClose}
                    aria-label="Close date picker"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* F1 & F4: Length Preset Chips */}
                <div className="cal-chips-scroll-row">
                  {previousTripNights && (
                    <button
                      type="button"
                      className={`cal-chip-btn ${selectedDuration === previousTripNights ? "active" : ""}`}
                      onClick={() => handleSelectPreset(previousTripNights)}
                    >
                      Same as last trip ({previousTripNights}n)
                    </button>
                  )}
                  {LENGTH_PRESETS.map((p) => (
                    <button
                      key={p.nights}
                      type="button"
                      className={`cal-chip-btn ${selectedDuration === p.nights ? "active" : ""}`}
                      onClick={() => handleSelectPreset(p.nights)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Validation Banner */}
                {validationMessage && (
                  <div className="cal-validation-banner" role="alert">
                    {validationMessage}
                  </div>
                )}

                {/* Scrollable Months (12 months vertically stacked) */}
                <div className="cal-sheet-scrollable" ref={sheetScrollRef}>
                  {mobileMonths.map((m) => renderMonthGrid(m.year, m.month))}
                </div>

                {/* Sticky Footer */}
                <div className="cal-sheet-footer">
                  <button type="button" className="cal-clear-link" onClick={handleClear}>
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary cal-apply-btn"
                    disabled={!draftStart || !draftEnd}
                    onClick={handleApply}
                  >
                    Apply {draftStart && draftEnd ? `(${currentNights}n)` : ""}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── DESKTOP: Floating 2-Month Popover (>= 768px) ── */
            <div
              className="cal-desktop-popover"
              ref={popoverRef}
              style={popoverStyle}
              role="dialog"
              aria-modal="true"
              id={dialogId}
              aria-labelledby={titleId}
            >
              {/* Top Navigation & Step Header */}
              <div className="cal-popover-header">
                <button
                  type="button"
                  className="cal-nav-circle-btn"
                  disabled={!canGoPrev()}
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="cal-step-center">
                  <h2 id={titleId} className="cal-step-title">
                    {headerStepText}
                  </h2>
                </div>

                <div className="cal-header-right-actions">
                  <button
                    type="button"
                    className="cal-nav-circle-btn"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="cal-nav-circle-btn cal-close-btn"
                    onClick={handleClose}
                    aria-label="Close date picker"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* F1 & F4: Length Preset Chips */}
              <div className="cal-chips-row">
                {previousTripNights && (
                  <button
                    type="button"
                    className={`cal-chip-btn ${selectedDuration === previousTripNights ? "active" : ""}`}
                    onClick={() => handleSelectPreset(previousTripNights)}
                  >
                    Same length as last trip ({previousTripNights} nights)
                  </button>
                )}
                {LENGTH_PRESETS.map((p) => (
                  <button
                    key={p.nights}
                    type="button"
                    className={`cal-chip-btn ${selectedDuration === p.nights ? "active" : ""}`}
                    onClick={() => handleSelectPreset(p.nights)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Validation Message */}
              {validationMessage && (
                <div className="cal-validation-banner" role="alert">
                  {validationMessage}
                </div>
              )}

              {/* Two Months Side-by-Side */}
              <div className="cal-months-duo-wrapper">
                {renderMonthGrid(viewYear, viewMonth)}
                {renderMonthGrid(secondYear, secondMonth)}
              </div>

              {/* Footer */}
              <div className="cal-popover-footer">
                <div className="cal-footer-left">
                  <span className="cal-footer-summary">{footerSummary}</span>

                  {/* F2: Suggested duration based on destination */}
                  {matchedDestination && typicalNights && (
                    <span className="cal-suggested-notice">
                      {matchedDestination.name}: {matchedDestination.suggestedDays} is typical.{" "}
                      <button
                        type="button"
                        className="cal-use-typical-link"
                        onClick={() => handleSelectPreset(typicalNights)}
                      >
                        Use {typicalNights} nights
                      </button>
                    </span>
                  )}
                </div>

                <div className="cal-footer-right">
                  <button type="button" className="cal-clear-link" onClick={handleClear}>
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary cal-apply-btn"
                    disabled={!draftStart || !draftEnd}
                    onClick={handleApply}
                  >
                    Apply dates
                  </button>
                </div>
              </div>
            </div>
          ),
          document.body
        )}
    </div>
  );
}
