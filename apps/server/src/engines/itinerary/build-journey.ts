import type { Place, Leg, LegKind, LegMode, ItineraryMoney } from "@travora/contracts";

export class ChronologyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChronologyError";
  }
}

export interface CityVisit {
  city: string;
  country: string;
  place: Place;
  arrivalDate: string; // YYYY-MM-DD
  departureDate: string; // YYYY-MM-DD
  nights: number;
}

export interface BuildJourneyInput {
  originPlace: Place;
  destinationCities: CityVisit[];
  outboundFlight?: {
    departLocal: string;
    arriveLocal: string;
    durationMin: number;
    carrier?: string;
    number?: string;
    cost: ItineraryMoney | null;
  };
  returnFlight?: {
    departLocal: string;
    arriveLocal: string;
    durationMin: number;
    carrier?: string;
    number?: string;
    cost: ItineraryMoney | null;
  };
  intercityLegs?: Array<{
    fromCity: string;
    toCity: string;
    mode: LegMode;
    departLocal: string;
    arriveLocal: string;
    durationMin: number;
    carrier?: string;
    number?: string;
    cost: ItineraryMoney | null;
    note?: string;
  }>;
}

/**
 * Validates that an arrival datetime (with optional timezone offset)
 * is chronologically before the subsequent departure datetime.
 */
function assertChronology(prevArriveLocal: string, nextDepartLocal: string, contextMsg: string) {
  const tArrive = new Date(prevArriveLocal).getTime();
  const tDepart = new Date(nextDepartLocal).getTime();

  if (tDepart < tArrive) {
    throw new ChronologyError(
      `Chronology violation: arrival at ${prevArriveLocal} is after departure at ${nextDepartLocal} (${contextMsg})`
    );
  }
}

export function buildJourney(input: BuildJourneyInput): Leg[] {
  const legs: Leg[] = [];
  const { originPlace, destinationCities } = input;

  if (destinationCities.length === 0) {
    throw new Error("Cannot build journey with zero destination cities");
  }

  const firstDest = destinationCities[0];
  const lastDest = destinationCities[destinationCities.length - 1];

  // 1. Outbound leg from origin to first destination
  const outboundDepart = input.outboundFlight?.departLocal ?? `${firstDest.arrivalDate}T08:00:00`;
  const outboundArrive = input.outboundFlight?.arriveLocal ?? `${firstDest.arrivalDate}T14:30:00`;
  const outboundDuration = input.outboundFlight?.durationMin ?? 390;

  const outboundLeg: Leg = {
    id: "leg_outbound",
    kind: "outbound",
    mode: "flight",
    from: originPlace,
    to: firstDest.place,
    departLocal: outboundDepart,
    arriveLocal: outboundArrive,
    durationMin: outboundDuration,
    carrier: input.outboundFlight?.carrier,
    number: input.outboundFlight?.number,
    cost: input.outboundFlight?.cost ?? null,
    source: input.outboundFlight?.cost?.source ?? "travora_engine",
  };
  legs.push(outboundLeg);

  let lastArrival = outboundArrive;

  // 2. Intercity legs between destination cities in visiting order
  for (let i = 0; i < destinationCities.length - 1; i++) {
    const fromCity = destinationCities[i];
    const toCity = destinationCities[i + 1];

    // Check if customized intercity leg passed
    const providedLeg = input.intercityLegs?.find(
      (l) => l.fromCity === fromCity.city && l.toCity === toCity.city
    );

    const depart = providedLeg?.departLocal ?? `${toCity.arrivalDate}T10:00:00`;
    const arrive = providedLeg?.arriveLocal ?? `${toCity.arrivalDate}T12:30:00`;
    const duration = providedLeg?.durationMin ?? 150;

    assertChronology(
      lastArrival,
      depart,
      `from ${fromCity.city} to ${toCity.city}`
    );

    const intercityLeg: Leg = {
      id: `leg_intercity_${i + 1}`,
      kind: "intercity",
      mode: providedLeg?.mode ?? "train",
      from: fromCity.place,
      to: toCity.place,
      departLocal: depart,
      arriveLocal: arrive,
      durationMin: duration,
      carrier: providedLeg?.carrier,
      number: providedLeg?.number,
      cost: providedLeg?.cost ?? null,
      note: providedLeg?.note,
      source: providedLeg?.cost?.source ?? "travora_engine",
    };
    legs.push(intercityLeg);
    lastArrival = arrive;
  }

  // 3. Return leg from last destination back to origin
  const returnDepart = input.returnFlight?.departLocal ?? `${lastDest.departureDate}T16:00:00`;
  const returnArrive = input.returnFlight?.arriveLocal ?? `${lastDest.departureDate}T22:30:00`;
  const returnDuration = input.returnFlight?.durationMin ?? 390;

  assertChronology(
    lastArrival,
    returnDepart,
    `return from ${lastDest.city} to origin ${originPlace.city}`
  );

  const returnLeg: Leg = {
    id: "leg_return",
    kind: "return",
    mode: "flight",
    from: lastDest.place,
    to: originPlace,
    departLocal: returnDepart,
    arriveLocal: returnArrive,
    durationMin: returnDuration,
    carrier: input.returnFlight?.carrier,
    number: input.returnFlight?.number,
    cost: input.returnFlight?.cost ?? null,
    source: input.returnFlight?.cost?.source ?? "travora_engine",
  };
  legs.push(returnLeg);

  return legs;
}
