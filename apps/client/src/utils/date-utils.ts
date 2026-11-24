/**
 * Date utilities for Travora DateRangePicker.
 * Avoids timezone off-by-one shifts by always using local year/month/date
 * and date-only YYYY-MM-DD representations.
 */

export const MIN_NIGHTS = 1;
export const MAX_NIGHTS = 30;

/**
 * Converts a Date object to a YYYY-MM-DD string using LOCAL getFullYear, getMonth, getDate.
 * NEVER uses toISOString().slice(0, 10) to avoid UTC midnight shifts.
 */
export function toDateOnly(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses a YYYY-MM-DD string into local component numbers.
 */
export function parseDateOnly(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split("-").map(Number);
  return {
    year: parts[0],
    month: parts[1], // 1-indexed
    day: parts[2],
  };
}

/**
 * Creates a local Date instance from a YYYY-MM-DD string at local midnight.
 * NEVER uses new Date("YYYY-MM-DD") which parses as UTC midnight.
 */
export function createLocalDate(dateStr: string): Date {
  const { year, month, day } = parseDateOnly(dateStr);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Computes exact nights between two date-only strings using Date.UTC(y, m, d)
 * so daylight saving time changes cannot alter the count.
 */
export function computeNights(startDateStr?: string, endDateStr?: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const p1 = parseDateOnly(startDateStr);
  const p2 = parseDateOnly(endDateStr);

  const utc1 = Date.UTC(p1.year, p1.month - 1, p1.day);
  const utc2 = Date.UTC(p2.year, p2.month - 1, p2.day);

  const diffMs = utc2 - utc1;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Formats a date-only string for display:
 * - With weekday: "Mon 10 May" (e.g. desktop)
 * - Without weekday: "10 May" (e.g. mobile trigger)
 */
export function formatDateSegment(dateStr: string, includeWeekday = true, locale = "en-GB"): string {
  if (!dateStr) return "";
  const dt = createLocalDate(dateStr);
  if (includeWeekday) {
    return dt.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }
  return dt.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

/**
 * Formats summary string like "10 May to 14 May, 4 nights"
 */
export function formatRangeSummary(startStr: string, endStr: string, locale = "en-GB"): string {
  if (!startStr) return "";
  const nights = computeNights(startStr, endStr);
  const startPart = formatDateSegment(startStr, false, locale);
  if (!endStr) return `${startPart} (Select return)`;
  const endPart = formatDateSegment(endStr, false, locale);
  return `${startPart} to ${endPart}, ${nights} night${nights === 1 ? "" : "s"}`;
}

/**
 * Returns the month's localized title e.g. "May 2027"
 */
export function formatMonthTitle(year: number, monthIndex: number, locale = "en-GB"): string {
  const dt = new Date(year, monthIndex, 1);
  return dt.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

/**
 * Adds days to a date-only string and returns the new date-only string.
 */
export function addDaysToDateOnly(dateStr: string, days: number): string {
  const dt = createLocalDate(dateStr);
  dt.setDate(dt.getDate() + days);
  return toDateOnly(dt);
}

/**
 * Returns today's date-only string in the user's local timezone.
 */
export function getTodayDateOnly(): string {
  return toDateOnly(new Date());
}

/**
 * Returns the first day of the week (0 = Sunday, 1 = Monday, etc.) following the user/browser locale.
 */
export function getFirstDayOfWeek(locale?: string): number {
  try {
    const locStr = locale || (typeof navigator !== "undefined" ? navigator.language : "en-US");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loc = new Intl.Locale(locStr) as any;
    if (typeof loc.getWeekInfo === "function") {
      const first = loc.getWeekInfo().firstDay; // 1 = Mon, 7 = Sun
      return first === 7 ? 0 : first;
    }
    if (loc.weekInfo && typeof loc.weekInfo.firstDay === "number") {
      const first = loc.weekInfo.firstDay;
      return first === 7 ? 0 : first;
    }
  } catch {
    // fallback
  }
  return 0; // Default Sunday
}

/**
 * Gets localized 2-letter weekday names starting from the first day of the week according to locale.
 */
export function getWeekdayHeaders(firstDay = 0, locale = "en-US"): { label: string; full: string }[] {
  const days: { label: string; full: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayOffset = (firstDay + i) % 7;
    // 2023-01-01 was a Sunday
    const d = new Date(2023, 0, 1 + dayOffset);
    days.push({
      label: d.toLocaleDateString(locale, { weekday: "short" }).slice(0, 2),
      full: d.toLocaleDateString(locale, { weekday: "long" }),
    });
  }
  return days;
}
