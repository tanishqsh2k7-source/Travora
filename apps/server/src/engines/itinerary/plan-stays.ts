import type {
  StaySegment,
  Transition,
  ChangeReason,
  ChangeReasonCode,
  HotelDetails,
  Leg,
  Place,
} from "@travora/contracts";

export interface NightPlanItem {
  date: string; // YYYY-MM-DD
  city: string;
  area: string;
  activityCount?: number;
  areaDistanceMinutesFromPrevious?: number; // Distance in minutes between this area and previous area
}

export interface PlanStaysOptions {
  minNightsPerStay?: number; // default: 2
  maxChangesSingleCity?: number; // default: 2
  areaDistanceMinutes?: number; // default: 45
  standardCheckIn?: string; // default: "15:00"
  standardCheckOut?: string; // default: "11:00"
  varietyPreference?: boolean; // default: false
  departureFlightLocalTime?: string; // e.g. "07:30"
  airportTransferTimeSavedMinutes?: number; // e.g. 70
  hotelResolver?: (city: string, area: string) => Partial<HotelDetails>;
}

export interface PlanStaysInput {
  nights: NightPlanItem[];
  options?: PlanStaysOptions;
  currency?: string;
}

export class StayInvariantsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StayInvariantsError";
  }
}

/**
 * Asserts the four mandatory invariants for stays:
 * 1. Every night belongs to exactly one stay
 * 2. Stays are contiguous (checkOutDate of stay i === checkInDate of stay i+1)
 * 3. Nights add up to total trip nights
 * 4. No stay has zero nights
 */
export function assertStayInvariants(stays: StaySegment[], totalNights: number) {
  if (totalNights === 0 && stays.length === 0) return;

  if (stays.length === 0) {
    throw new StayInvariantsError("No stays generated for trip nights.");
  }

  let nightsSum = 0;
  for (let i = 0; i < stays.length; i++) {
    const s = stays[i];

    // Invariant 4: No stay has zero nights
    if (s.nights <= 0) {
      throw new StayInvariantsError(`Stay ${s.id} in ${s.city} has ${s.nights} nights (must be > 0).`);
    }
    nightsSum += s.nights;

    // Invariant 2: Stays are contiguous
    if (i < stays.length - 1) {
      const nextStay = stays[i + 1];
      if (s.checkOutDate !== nextStay.checkInDate) {
        throw new StayInvariantsError(
          `Stays not contiguous: stay ${s.id} ends on ${s.checkOutDate} but next stay ${nextStay.id} starts on ${nextStay.checkInDate}.`
        );
      }
    }
  }

  // Invariant 3: Nights add up to total trip nights
  if (nightsSum !== totalNights) {
    throw new StayInvariantsError(
      `Nights sum mismatch: total stays nights (${nightsSum}) does not equal trip nights (${totalNights}).`
    );
  }
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function parseTimeMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

interface StayCandidateGroup {
  city: string;
  area: string;
  nightIndices: number[];
  changeReason?: ChangeReason;
}

export function planStays(input: PlanStaysInput): {
  stays: StaySegment[];
  transitions: Transition[];
} {
  const { nights } = input;
  const options = {
    minNightsPerStay: 2,
    maxChangesSingleCity: 2,
    areaDistanceMinutes: 45,
    standardCheckIn: "15:00",
    standardCheckOut: "11:00",
    varietyPreference: false,
    ...input.options,
  };

  const totalNights = nights.length;
  if (totalNights === 0) {
    return { stays: [], transitions: [] };
  }

  const currency = input.currency ?? "USD";

  // ── Step A: Group nights into initial city blocks (Rule 1: One stay per city) ──
  const cityBlocks: Array<{
    city: string;
    startNightIdx: number;
    nightsCount: number;
  }> = [];

  let currentCity = nights[0].city;
  let blockStart = 0;
  let count = 0;

  for (let i = 0; i < totalNights; i++) {
    if (nights[i].city === currentCity) {
      count++;
    } else {
      cityBlocks.push({
        city: currentCity,
        startNightIdx: blockStart,
        nightsCount: count,
      });
      currentCity = nights[i].city;
      blockStart = i;
      count = 1;
    }
  }
  cityBlocks.push({
    city: currentCity,
    startNightIdx: blockStart,
    nightsCount: count,
  });

  // ── Step B: Evaluate intra-city stay splits according to rules 2, 3, 4, 5, 6 ──
  const stayGroups: StayCandidateGroup[] = [];

  for (let blockIdx = 0; blockIdx < cityBlocks.length; blockIdx++) {
    const block = cityBlocks[blockIdx];
    const blockNights = nights.slice(block.startNightIdx, block.startNightIdx + block.nightsCount);
    const isFirstCity = blockIdx === 0;

    // Rule 3: Trips of 3 nights or fewer never split inside one city
    const isShortTrip = totalNights <= 3;

    let splitIndex: number | null = null;
    let splitReason: ChangeReason | null = null;

    // Rule 5: Early flight airport check (applies only to the final night of the trip)
    const isFinalCityBlock = blockIdx === cityBlocks.length - 1;
    let airportSplitApplied = false;

    if (
      isFinalCityBlock &&
      options.departureFlightLocalTime &&
      parseTimeMinutes(options.departureFlightLocalTime) < parseTimeMinutes("08:00") &&
      (options.airportTransferTimeSavedMinutes ?? 0) >= 60 &&
      block.nightsCount >= 2 // needs at least 2 nights to peel off final airport night
    ) {
      splitIndex = block.nightsCount - 1; // split at the last night
      splitReason = {
        code: "EARLY_FLIGHT_AIRPORT",
        text: `Moved final night to an airport-area stay to save ${options.airportTransferTimeSavedMinutes} minutes before your early ${options.departureFlightLocalTime} departure.`,
      };
      airportSplitApplied = true;
    }

    // Rule 2 & 4: Inside one city, evaluate splits if not already split by airport rule
    if (!airportSplitApplied && !isShortTrip) {
      // Rule 4: Long stay > 7 nights with variety preference
      if (block.nightsCount > 7 && options.varietyPreference) {
        // Split halfway
        const half = Math.floor(block.nightsCount / 2);
        if (half >= options.minNightsPerStay && block.nightsCount - half >= options.minNightsPerStay) {
          splitIndex = half;
          splitReason = {
            code: "LONG_STAY_SPLIT",
            text: `Stay divided into two neighborhoods to provide geographic variety across a ${block.nightsCount}-night stay.`,
          };
        }
      }

      // Rule 2: Distant area split
      if (splitIndex === null) {
        // Find if there's an area boundary where both sides have >= minNightsPerStay
        // AND area distance >= areaDistanceMinutes
        for (let i = options.minNightsPerStay; i <= block.nightsCount - options.minNightsPerStay; i++) {
          const areaBefore = blockNights[i - 1].area;
          const areaAfter = blockNights[i].area;
          const distanceMin = blockNights[i].areaDistanceMinutesFromPrevious ?? 0;

          if (areaBefore !== areaAfter && distanceMin >= options.areaDistanceMinutes) {
            splitIndex = i;
            splitReason = {
              code: "DISTANT_AREA",
              text: `Shifted base to ${areaAfter} (${distanceMin} minutes away) to minimize daily commuting to regional highlights.`,
            };
            break;
          }
        }
      }
    }

    // Construct the stay groups for this city block
    if (splitIndex !== null && splitReason !== null) {
      // Part 1
      stayGroups.push({
        city: block.city,
        area: blockNights[0].area,
        nightIndices: Array.from({ length: splitIndex }, (_, k) => block.startNightIdx + k),
        changeReason: isFirstCity && stayGroups.length === 0
          ? { code: "FIRST_STAY", text: `Initial lodging base in ${block.city}.` }
          : { code: "NEW_CITY", text: `Base stay in ${block.city}.` },
      });

      // Part 2
      stayGroups.push({
        city: block.city,
        area: airportSplitApplied ? "Airport Area" : blockNights[splitIndex].area,
        nightIndices: Array.from(
          { length: block.nightsCount - splitIndex },
          (_, k) => block.startNightIdx + splitIndex + k
        ),
        changeReason: splitReason,
      });
    } else {
      // Single stay for this city block
      stayGroups.push({
        city: block.city,
        area: blockNights[0].area,
        nightIndices: Array.from({ length: block.nightsCount }, (_, k) => block.startNightIdx + k),
        changeReason: isFirstCity
          ? { code: "FIRST_STAY", text: `Initial lodging base in ${block.city}.` }
          : { code: "NEW_CITY", text: `Moving to ${block.city} for regional exploration.` },
      });
    }
  }

  // ── Step C: Build StaySegment and Transition objects ──
  const stays: StaySegment[] = [];
  const transitions: Transition[] = [];

  for (let i = 0; i < stayGroups.length; i++) {
    const grp = stayGroups[i];
    const stayId = `stay_${grp.city.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${i + 1}`;
    const checkInDate = nights[grp.nightIndices[0]].date;
    const checkOutDate = addDays(nights[grp.nightIndices[grp.nightIndices.length - 1]].date, 1);
    const nightsCount = grp.nightIndices.length;

    // Resolve hotel details from options or canned fallback
    const resolvedHotel = options.hotelResolver?.(grp.city, grp.area) ?? {};
    const hotelName = resolvedHotel.name ?? `${grp.city} Central Hotel`;
    const nightlyAmount = resolvedHotel.nightlyPrice?.amount ?? 15000; // in minor units
    const totalAmount = nightlyAmount * nightsCount;

    const hotel: HotelDetails = {
      name: hotelName,
      address: resolvedHotel.address ?? `${grp.area}, ${grp.city}`,
      stars: resolvedHotel.stars ?? 4,
      lat: resolvedHotel.lat ?? 35.6895,
      lng: resolvedHotel.lng ?? 139.6917,
      nightlyPrice: {
        amount: nightlyAmount,
        currency,
        kind: resolvedHotel.nightlyPrice?.kind ?? "demo_offer",
        source: resolvedHotel.nightlyPrice?.source ?? "travora_engine",
        fetchedAt: new Date().toISOString(),
      },
      total: {
        amount: totalAmount,
        currency,
        kind: resolvedHotel.total?.kind ?? "demo_offer",
        source: resolvedHotel.total?.source ?? "travora_engine",
        fetchedAt: new Date().toISOString(),
      },
      cancellation: resolvedHotel.cancellation ?? "Free cancellation up to 48 hours before check-in",
      link: resolvedHotel.link,
    };

    const staySegment: StaySegment = {
      id: stayId,
      city: grp.city,
      area: grp.area,
      checkInDate,
      checkOutDate,
      nights: nightsCount,
      hotel,
      changeReason: grp.changeReason,
      previousStayId: i > 0 ? stays[i - 1].id : undefined,
    };

    stays.push(staySegment);

    // Create Transition between stay i-1 and stay i
    if (i > 0) {
      const prevStay = stays[i - 1];
      const isIntercity = prevStay.city !== grp.city;

      const fromPlace: Place = {
        name: prevStay.hotel.name,
        city: prevStay.city,
        country: "Japan",
        lat: prevStay.hotel.lat,
        lng: prevStay.hotel.lng,
        timezone: "Asia/Tokyo",
      };

      const toPlace: Place = {
        name: hotel.name,
        city: grp.city,
        country: "Japan",
        lat: hotel.lat,
        lng: hotel.lng,
        timezone: "Asia/Tokyo",
      };

      const transferLeg: Leg = {
        id: `leg_transfer_${prevStay.id}_to_${stayId}`,
        kind: isIntercity ? "intercity" : "local_transfer",
        mode: isIntercity ? "train" : "car",
        from: fromPlace,
        to: toPlace,
        departLocal: `${checkInDate}T11:30:00`,
        arriveLocal: `${checkInDate}T13:45:00`,
        durationMin: isIntercity ? 135 : 45,
        carrier: isIntercity ? "JR Intercity Express" : "Local Taxi / Ride",
        cost: {
          amount: isIntercity ? 4500 : 2500,
          currency,
          kind: "estimate",
          source: "travora_engine",
          fetchedAt: new Date().toISOString(),
        },
        source: "travora_engine",
      };

      const transition: Transition = {
        date: checkInDate,
        fromStayId: prevStay.id,
        toStayId: stayId,
        checkOutBy: options.standardCheckOut,
        legs: [transferLeg],
        checkInFrom: options.standardCheckIn,
        luggageTip: "Leave bags at the front desk if you arrive before 15:00 check-in.",
        tip: grp.changeReason?.text,
      };

      transitions.push(transition);
    }
  }

  // Assert all 4 invariants
  assertStayInvariants(stays, totalNights);

  return {
    stays,
    transitions,
  };
}
