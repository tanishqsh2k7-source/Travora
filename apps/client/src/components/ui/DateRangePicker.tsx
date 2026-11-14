import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  className?: string;
  label?: string;
  error?: string;
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getDaysBetween(startStr?: string, endStr?: string): number {
  if (!startStr || !endStr) return 0;
  const s = new Date(startStr);
  const e = new Date(endStr);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  return Math.max(0, diffDays);
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = "",
  label = "Dates",
  error,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayStr = toIsoDate(new Date());
  const initialMonth = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth()); // 0-indexed

  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState<string | null>(startDate || null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setTempStart(null);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const nights = getDaysBetween(startDate, endDate);
  const displayText =
    startDate && endDate
      ? `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)} (${nights} night${nights > 1 ? "s" : ""})`
      : startDate
      ? `${formatDateDisplay(startDate)} (Select return)`
      : "Select travel dates";

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const prevMonth = () => {
    const curDate = new Date();
    const isCurrentOrPast =
      viewYear < curDate.getFullYear() ||
      (viewYear === curDate.getFullYear() && viewMonth <= curDate.getMonth());
    if (isCurrentOrPast) return;

    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (dateStr < todayStr) return;

    if (!tempStart || (tempStart && endDate && !tempStart)) {
      setTempStart(dateStr);
    } else if (tempStart) {
      if (dateStr < tempStart) {
        setTempStart(dateStr);
      } else if (dateStr === tempStart) {
        // Can't have 0 nights
        const nextDay = new Date(dateStr);
        nextDay.setDate(nextDay.getDate() + 1);
        onChange(tempStart, toIsoDate(nextDay));
        setTempStart(null);
        setIsOpen(false);
      } else {
        onChange(tempStart, dateStr);
        setTempStart(null);
        setIsOpen(false);
      }
    }
  };

  const renderMonthGrid = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = new Date(year, month).toLocaleString("en-GB", {
      month: "long",
      year: "numeric",
    });

    const blanks = Array.from({ length: firstDay });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="cal-month-card">
        <div className="cal-month-title">{monthName}</div>
        <div className="cal-weekdays-row">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d} className="cal-weekday-label">
              {d}
            </span>
          ))}
        </div>
        <div className="cal-days-grid">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="cal-day empty" />
          ))}
          {days.map((d) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isPast = dateStr < todayStr;
            const isStart = tempStart ? dateStr === tempStart : dateStr === startDate;
            const isEnd = !tempStart && dateStr === endDate;
            const isInRange =
              tempStart && hoverDate
                ? dateStr > tempStart && dateStr < hoverDate
                : startDate && endDate
                ? dateStr > startDate && dateStr < endDate
                : false;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast}
                onClick={() => handleDayClick(dateStr)}
                onMouseEnter={() => tempStart && setHoverDate(dateStr)}
                className={`cal-day-btn ${isPast ? "past" : ""} ${isStart ? "selected-start" : ""} ${isEnd ? "selected-end" : ""} ${isInRange ? "in-range" : ""}`}
                aria-label={dateStr}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Month 2 is viewMonth + 1
  const secondMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  return (
    <div className={`date-range-picker-container ${className}`} ref={containerRef}>
      {label && <label className="field-label">{label}</label>}
      <button
        type="button"
        className={`date-picker-trigger ${isOpen ? "open" : ""} ${error ? "has-error" : ""}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setTempStart(null);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Calendar className="w-4 h-4 text-ink-muted" />
        <span className="trigger-date-text">{displayText}</span>
      </button>

      {error && <p className="field-error-msg">{error}</p>}

      {isOpen && (
        <div className="date-picker-popover" role="dialog" aria-label="Choose travel dates">
          <div className="cal-popover-nav">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="cal-popover-hint">
              {tempStart ? "Select check-out / return date" : "Select departure date"}
            </span>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="cal-months-wrapper">
            {renderMonthGrid(viewYear, viewMonth)}
            <div className="desktop-second-month">
              {renderMonthGrid(secondYear, secondMonth)}
            </div>
          </div>

          <div className="cal-popover-footer">
            <div className="cal-quick-picks">
              <button
                type="button"
                className="cal-quick-btn"
                onClick={() => {
                  const s = new Date();
                  s.setDate(s.getDate() + 7);
                  const e = new Date(s);
                  e.setDate(e.getDate() + 4);
                  onChange(toIsoDate(s), toIsoDate(e));
                  setIsOpen(false);
                }}
              >
                Next weekend (4n)
              </button>
              <button
                type="button"
                className="cal-quick-btn"
                onClick={() => {
                  const s = new Date();
                  s.setDate(s.getDate() + 14);
                  const e = new Date(s);
                  e.setDate(e.getDate() + 7);
                  onChange(toIsoDate(s), toIsoDate(e));
                  setIsOpen(false);
                }}
              >
                In 2 weeks (7n)
              </button>
            </div>
            <button
              type="button"
              className="cal-close-btn"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
