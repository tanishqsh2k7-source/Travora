import type { DayEvent, DayEventType, Place, ItineraryMoney } from "@travora/contracts";

export interface ActivityCandidate {
  id: string;
  name: string;
  place?: Place;
  durationMin?: number;
  openingHours?: { open: string; close: string }; // e.g. { open: "09:00", close: "17:00" }
  cost?: ItineraryMoney;
  notes?: string;
}

export interface ScheduleDayContext {
  dayNumber: number;
  date: string;
  isArrivalDay?: boolean;
  isDepartureDay?: boolean;
  isMovingDay?: boolean;
  flightLandingLocalTime?: string; // e.g. "14:30"
  flightDepartureLocalTime?: string; // e.g. "18:00"
  isInternational?: boolean; // default true
  standardCheckOutTime?: string; // "11:00"
  standardCheckInTime?: string; // "15:00"
  movingTransferDurationMin?: number;
  hotelPlace?: Place;
  nextHotelPlace?: Place;
  airportPlace?: Place;
  currency?: string;
}

export const SPEED_TABLE_KMH: Record<string, number> = {
  flight: 700,
  train: 120,
  metro: 35,
  car: 40,
  bus: 25,
  walk: 4.5,
};

function parseTimeToMin(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatMinToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function scheduleDay(
  activities: ActivityCandidate[],
  context: ScheduleDayContext
): DayEvent[] {
  const events: DayEvent[] = [];
  const currency = context.currency ?? "USD";
  const isInternational = context.isInternational ?? true;

  let currentMin = parseTimeToMin("09:00");

  // ── 1. Arrival Day Special Handling ─────────────────────────────────────
  if (context.isArrivalDay && context.flightLandingLocalTime) {
    const landingMin = parseTimeToMin(context.flightLandingLocalTime);
    const bufferMin = isInternational ? 90 : 45;
    const clearanceEndMin = landingMin + bufferMin;

    events.push({
      id: `ev_d${context.dayNumber}_arrival`,
      type: "arrival",
      startLocal: formatMinToTime(landingMin),
      endLocal: formatMinToTime(clearanceEndMin),
      title: `Flight arrival & airport buffer (${isInternational ? "International 90m" : "Domestic 45m"})`,
      place: context.airportPlace,
      notes: "Customs, border inspection, baggage claim, and transit connection.",
    });

    // Transfer from airport to hotel (estimated 45 mins)
    const transferEndMin = clearanceEndMin + 45;
    events.push({
      id: `ev_d${context.dayNumber}_airport_transfer`,
      type: "transfer",
      startLocal: formatMinToTime(clearanceEndMin),
      endLocal: formatMinToTime(transferEndMin),
      title: "Airport express transfer to hotel base",
      place: context.hotelPlace,
      cost: {
        amount: 2500,
        currency,
        kind: "estimate",
        source: "transit_heuristic",
        fetchedAt: new Date().toISOString(),
      },
      notes: "Direct express train / taxi to city lodging.",
    });

    // Check-in or luggage drop
    const checkInStartMin = transferEndMin;
    const checkInEndMin = checkInStartMin + 30;
    events.push({
      id: `ev_d${context.dayNumber}_checkin`,
      type: "checkin",
      startLocal: formatMinToTime(checkInStartMin),
      endLocal: formatMinToTime(checkInEndMin),
      title: `Check-in / Luggage drop at ${context.hotelPlace?.name || "Hotel Base"}`,
      place: context.hotelPlace,
      notes: "Freshen up before local evening exploration.",
    });

    currentMin = checkInEndMin + 15; // 15 min buffer
  }

  // ── 2. Moving Day Special Handling ──────────────────────────────────────
  else if (context.isMovingDay) {
    const checkOutMin = parseTimeToMin(context.standardCheckOutTime || "11:00");
    events.push({
      id: `ev_d${context.dayNumber}_checkout`,
      type: "checkout",
      startLocal: formatMinToTime(checkOutMin - 30),
      endLocal: formatMinToTime(checkOutMin),
      title: `Check out from ${context.hotelPlace?.name || "Current Hotel"}`,
      place: context.hotelPlace,
      notes: "Settle room extras and collect packed luggage.",
    });

    const transferDuration = context.movingTransferDurationMin || 135;
    const transferEndMin = checkOutMin + transferDuration;
    events.push({
      id: `ev_d${context.dayNumber}_intercity_transfer`,
      type: "transfer",
      startLocal: formatMinToTime(checkOutMin),
      endLocal: formatMinToTime(transferEndMin),
      title: "Intercity transit & hotel relocation",
      place: context.nextHotelPlace,
      notes: "Transit leg connecting your previous and upcoming hotel bases.",
    });

    const checkInTimeMin = parseTimeToMin(context.standardCheckInTime || "15:00");
    const dropStartMin = transferEndMin;
    const dropEndMin = Math.max(dropStartMin + 30, checkInTimeMin);

    events.push({
      id: `ev_d${context.dayNumber}_checkin_drop`,
      type: "checkin",
      startLocal: formatMinToTime(dropStartMin),
      endLocal: formatMinToTime(dropEndMin),
      title: `Luggage drop & check-in at ${context.nextHotelPlace?.name || "New Hotel"}`,
      place: context.nextHotelPlace,
      notes: "Front desk baggage hold if arriving prior to room readiness.",
    });

    currentMin = dropEndMin + 15; // 15 min buffer
  }

  // ── 3. Schedule Activities with Opening Hours & Non-Overlap ─────────────
  const maxEndMin = context.isDepartureDay && context.flightDepartureLocalTime
    ? parseTimeToMin(context.flightDepartureLocalTime) - (isInternational ? 180 : 120) - 60
    : parseTimeToMin("20:30");

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const duration = act.durationMin || 90;

    // Check if enough time left in day before departure cutoff
    if (currentMin + duration > maxEndMin) {
      break;
    }

    let startMin = currentMin;
    let endMin = startMin + duration;
    let notes = act.notes || "";

    // Opening hours check
    if (act.openingHours) {
      const openMin = parseTimeToMin(act.openingHours.open);
      const closeMin = parseTimeToMin(act.openingHours.close);

      if (startMin < openMin) {
        startMin = openMin;
        endMin = startMin + duration;
      }
      if (endMin > closeMin) {
        notes = `${notes ? notes + " • " : ""}Adjusted for venue closing time at ${act.openingHours.close}`;
      }
    } else {
      notes = `${notes ? notes + " • " : ""}hours unchecked`;
    }

    events.push({
      id: `ev_d${context.dayNumber}_act_${i + 1}`,
      type: "activity",
      startLocal: formatMinToTime(startMin),
      endLocal: formatMinToTime(endMin),
      title: act.name,
      place: act.place,
      cost: act.cost,
      notes,
    });

    // 15-minute buffer between activities
    currentMin = endMin + 15;
  }

  // ── 4. Departure Day Special Handling ───────────────────────────────────
  if (context.isDepartureDay && context.flightDepartureLocalTime) {
    const flightMin = parseTimeToMin(context.flightDepartureLocalTime);
    const airportBuffer = isInternational ? 180 : 120;
    const airportArrivalMin = flightMin - airportBuffer;
    const transferDuration = 60; // 1 hour airport transfer
    const transferStartMin = airportArrivalMin - transferDuration;

    // Checkout prior to departure transfer
    events.push({
      id: `ev_d${context.dayNumber}_final_checkout`,
      type: "checkout",
      startLocal: formatMinToTime(transferStartMin - 30),
      endLocal: formatMinToTime(transferStartMin),
      title: `Final hotel check-out & baggage retrieval`,
      place: context.hotelPlace,
      notes: "Collect held luggage and prepare for airport transit.",
    });

    // Airport transfer
    events.push({
      id: `ev_d${context.dayNumber}_final_transfer`,
      type: "transfer",
      startLocal: formatMinToTime(transferStartMin),
      endLocal: formatMinToTime(airportArrivalMin),
      title: `Airport express transit to ${context.airportPlace?.name || "Departure Airport"}`,
      place: context.airportPlace,
      notes: "Direct express train / taxi.",
    });

    // Airport departure buffer
    events.push({
      id: `ev_d${context.dayNumber}_flight_departure`,
      type: "departure",
      startLocal: formatMinToTime(airportArrivalMin),
      endLocal: formatMinToTime(flightMin),
      title: `Airport security, tax refund & gate check (${isInternational ? "International 180m buffer" : "Domestic 120m buffer"})`,
      place: context.airportPlace,
      notes: `Boarding starts 45 minutes prior to ${context.flightDepartureLocalTime} departure.`,
    });
  }

  return events;
}
