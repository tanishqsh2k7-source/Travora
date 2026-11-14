import type { Itinerary } from "@travora/contracts";

export interface ItineraryValidationIssue {
  severity: "blocker" | "warning";
  code: string;
  message: string;
  dayNumber?: number;
  eventId?: string;
}

export function validateItinerary(itinerary: Itinerary): ItineraryValidationIssue[] {
  const issues: ItineraryValidationIssue[] = [];

  // ── 1. Check Stays Invariants (Gaps, Overlaps, Zero Nights) ───────────────
  const stays = itinerary.stays;
  if (stays.length === 0 && itinerary.nights > 0) {
    issues.push({
      severity: "blocker",
      code: "NO_STAYS",
      message: "Itinerary has positive night count but zero lodging stays assigned.",
    });
  }

  let totalStayNights = 0;
  for (let i = 0; i < stays.length; i++) {
    const stay = stays[i];
    if (stay.nights <= 0) {
      issues.push({
        severity: "blocker",
        code: "ZERO_NIGHT_STAY",
        message: `Stay ${stay.id} in ${stay.city} has 0 or negative nights.`,
      });
    }
    totalStayNights += stay.nights;

    // Check stay price calculation: total must equal nightlyPrice * nights
    const expectedTotal = stay.hotel.nightlyPrice.amount * stay.nights;
    if (stay.hotel.total.amount !== expectedTotal) {
      issues.push({
        severity: "blocker",
        code: "STAY_PRICE_MISMATCH",
        message: `Stay ${stay.id} total (${stay.hotel.total.amount}) does not match nightly price * nights (${expectedTotal}).`,
      });
    }

    // Check contiguity between adjacent stays
    if (i < stays.length - 1) {
      const nextStay = stays[i + 1];
      if (stay.checkOutDate !== nextStay.checkInDate) {
        issues.push({
          severity: "blocker",
          code: "STAY_GAP_OR_OVERLAP",
          message: `Stays gap/overlap: stay ${stay.id} checkout (${stay.checkOutDate}) does not match next stay checkin (${nextStay.checkInDate}).`,
        });
      }
    }
  }

  if (totalStayNights !== itinerary.nights) {
    issues.push({
      severity: "blocker",
      code: "NIGHTS_COUNT_MISMATCH",
      message: `Total nights in stays (${totalStayNights}) does not match trip nights (${itinerary.nights}).`,
    });
  }

  // ── 2. Check Days & Sleeping Accommodations ──────────────────────────────
  const totalDays = itinerary.days.length;
  for (let dIdx = 0; dIdx < totalDays; dIdx++) {
    const day = itinerary.days[dIdx];
    const isFinalDay = dIdx === totalDays - 1;

    // Every day must have a sleepStayId except the final day when returning home
    if (!isFinalDay && !day.sleepStayId) {
      issues.push({
        severity: "blocker",
        code: "MISSING_SLEEP_STAY",
        message: `Day ${day.dayNumber} (${day.date}) has no assigned sleepStayId.`,
        dayNumber: day.dayNumber,
      });
    }

    // Events outside trip dates
    if (day.date < itinerary.startDate || day.date > itinerary.endDate) {
      issues.push({
        severity: "blocker",
        code: "EVENT_OUTSIDE_DATES",
        message: `Day ${day.dayNumber} date (${day.date}) is outside trip dates (${itinerary.startDate} to ${itinerary.endDate}).`,
        dayNumber: day.dayNumber,
      });
    }

    // Check events within day
    for (const ev of day.events) {
      if (ev.notes?.includes("hours unchecked")) {
        issues.push({
          severity: "warning",
          code: "UNKNOWN_OPENING_HOURS",
          message: `Venue operating hours for '${ev.title}' on Day ${day.dayNumber} are unverified.`,
          dayNumber: day.dayNumber,
          eventId: ev.id,
        });
      }

      if (ev.type === "transfer" && ev.cost?.source === "transit_heuristic") {
        issues.push({
          severity: "warning",
          code: "ESTIMATED_TRAVEL_TIME",
          message: `Transfer '${ev.title}' travel duration is an estimate.`,
          dayNumber: day.dayNumber,
          eventId: ev.id,
        });
      }
    }
  }

  // ── 3. Check Legs Chronology & Transfers ─────────────────────────────────
  for (let i = 0; i < itinerary.journey.length - 1; i++) {
    const curLeg = itinerary.journey[i];
    const nextLeg = itinerary.journey[i + 1];

    const curArrive = new Date(curLeg.arriveLocal).getTime();
    const nextDepart = new Date(nextLeg.departLocal).getTime();

    if (curArrive > nextDepart) {
      issues.push({
        severity: "blocker",
        code: "LEG_CHRONOLOGY_VIOLATION",
        message: `Leg ${curLeg.id} arrives at ${curLeg.arriveLocal} after next leg departs at ${nextLeg.departLocal}.`,
      });
    }
  }

  // Check transitions warnings
  for (const trans of itinerary.transitions) {
    for (const leg of trans.legs) {
      if (leg.durationMin < 20) {
        issues.push({
          severity: "warning",
          code: "TRANSFER_UNDER_20_MIN",
          message: `Hotel transition on ${trans.date} transfer time is under 20 minutes (${leg.durationMin} min).`,
        });
      }
      if (leg.mode !== "flight" && leg.durationMin > 180) {
        issues.push({
          severity: "warning",
          code: "GROUND_TRANSFER_OVER_3_HOURS",
          message: `Ground transition on moving day ${trans.date} exceeds 3 hours (${leg.durationMin} min).`,
        });
      }
    }
  }

  // ── 4. Check Budget Hard Cap ─────────────────────────────────────────────
  // If estimated total is greater than user budget
  if (itinerary.summary.estimatedTotal.amount > itinerary.summary.budget.amount) {
    issues.push({
      severity: "blocker",
      code: "OVER_BUDGET_CAP",
      message: `Trip estimated total (${itinerary.summary.estimatedTotal.amount}) exceeds target budget (${itinerary.summary.budget.amount}).`,
    });
  }

  return issues;
}
