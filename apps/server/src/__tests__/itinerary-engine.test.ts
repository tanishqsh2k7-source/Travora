import { describe, it, expect } from "vitest";
import {
  buildJourney,
  ChronologyError,
  planStays,
  assertStayInvariants,
  scheduleDay,
  priceItinerary,
  validateItinerary,
  synthesizeItinerary,
  type NightPlanItem,
} from "../engines/itinerary/index.js";
import { ItinerarySchema, type Place } from "@travora/contracts";
import { SAMPLE_MULTICITY_ITINERARY } from "../fixtures/sample-multicity.js";
import { SAMPLE_SINGLE_CITY_ITINERARY } from "../fixtures/sample-single-city.js";

const ORIGIN_DELHI: Place = {
  name: "Indira Gandhi International Airport",
  city: "Delhi",
  country: "India",
  lat: 28.5562,
  lng: 77.1000,
  timezone: "Asia/Kolkata",
  code: "DEL",
};

const DEST_TOKYO: Place = {
  name: "Tokyo Station",
  city: "Tokyo",
  country: "Japan",
  lat: 35.6812,
  lng: 139.7671,
  timezone: "Asia/Tokyo",
};

const DEST_KYOTO: Place = {
  name: "Kyoto Station",
  city: "Kyoto",
  country: "Japan",
  lat: 34.9858,
  lng: 135.7588,
  timezone: "Asia/Tokyo",
};

describe("Itinerary Engine — buildJourney", () => {
  it("starts at origin, passes destination cities in order, and returns to origin", () => {
    const legs = buildJourney({
      originPlace: ORIGIN_DELHI,
      destinationCities: [
        {
          city: "Tokyo",
          country: "Japan",
          place: DEST_TOKYO,
          arrivalDate: "2027-04-10",
          departureDate: "2027-04-14",
          nights: 4,
        },
        {
          city: "Kyoto",
          country: "Japan",
          place: DEST_KYOTO,
          arrivalDate: "2027-04-14",
          departureDate: "2027-04-19",
          nights: 5,
        },
      ],
      outboundFlight: {
        departLocal: "2027-04-10T10:00:00",
        arriveLocal: "2027-04-10T21:30:00",
        durationMin: 480,
        carrier: "ANA",
        cost: null,
      },
      intercityLegs: [
        {
          fromCity: "Tokyo",
          toCity: "Kyoto",
          mode: "train",
          departLocal: "2027-04-14T11:00:00",
          arriveLocal: "2027-04-14T13:15:00",
          durationMin: 135,
          cost: null,
        },
      ],
      returnFlight: {
        departLocal: "2027-04-19T14:00:00",
        arriveLocal: "2027-04-19T19:30:00",
        durationMin: 540,
        carrier: "Air India",
        cost: null,
      },
    });

    expect(legs).toHaveLength(3);
    // Starts at origin
    expect(legs[0].from.city).toBe("Delhi");
    expect(legs[0].to.city).toBe("Tokyo");
    expect(legs[0].kind).toBe("outbound");

    // Intercity leg
    expect(legs[1].from.city).toBe("Tokyo");
    expect(legs[1].to.city).toBe("Kyoto");
    expect(legs[1].kind).toBe("intercity");
    expect(legs[1].mode).toBe("train");

    // Ends at origin
    expect(legs[2].from.city).toBe("Kyoto");
    expect(legs[2].to.city).toBe("Delhi");
    expect(legs[2].kind).toBe("return");
  });

  it("throws ChronologyError on overlapping or backwards arrival/departure sequence", () => {
    expect(() =>
      buildJourney({
        originPlace: ORIGIN_DELHI,
        destinationCities: [
          {
            city: "Tokyo",
            country: "Japan",
            place: DEST_TOKYO,
            arrivalDate: "2027-04-10",
            departureDate: "2027-04-14",
            nights: 4,
          },
        ],
        outboundFlight: {
          departLocal: "2027-04-10T10:00:00",
          arriveLocal: "2027-04-10T22:00:00",
          durationMin: 480,
          cost: null,
        },
        returnFlight: {
          // Return departs BEFORE outbound arrives!
          departLocal: "2027-04-10T18:00:00",
          arriveLocal: "2027-04-10T23:30:00",
          durationMin: 540,
          cost: null,
        },
      })
    ).toThrow(ChronologyError);
  });
});

describe("Itinerary Engine — planStays (8 Required Cases)", () => {
  // Case 1: 3-night single city
  it("Case 1: 3-night single city never splits into two stays", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-05-10", city: "Lisbon", area: "Baixa" },
      { date: "2027-05-11", city: "Lisbon", area: "Alfama", areaDistanceMinutesFromPrevious: 50 },
      { date: "2027-05-12", city: "Lisbon", area: "Belém", areaDistanceMinutesFromPrevious: 60 },
    ];
    const { stays, transitions } = planStays({ nights });
    expect(stays).toHaveLength(1);
    expect(stays[0].nights).toBe(3);
    expect(stays[0].changeReason?.code).toBe("FIRST_STAY");
    expect(transitions).toHaveLength(0);
  });

  // Case 2: 4-night single city
  it("Case 2: 4-night single city with no distant clusters stays in 1 hotel", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-05-10", city: "Lisbon", area: "Baixa" },
      { date: "2027-05-11", city: "Lisbon", area: "Baixa" },
      { date: "2027-05-12", city: "Lisbon", area: "Baixa" },
      { date: "2027-05-13", city: "Lisbon", area: "Baixa" },
    ];
    const { stays } = planStays({ nights });
    expect(stays).toHaveLength(1);
    expect(stays[0].nights).toBe(4);
  });

  // Case 3: two cities
  it("Case 3: two cities creates 2 stays with NEW_CITY changeReason", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-04-10", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-11", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-12", city: "Kyoto", area: "Gion" },
      { date: "2027-04-13", city: "Kyoto", area: "Gion" },
    ];
    const { stays, transitions } = planStays({ nights });
    expect(stays).toHaveLength(2);
    expect(stays[0].city).toBe("Tokyo");
    expect(stays[0].changeReason?.code).toBe("FIRST_STAY");
    expect(stays[1].city).toBe("Kyoto");
    expect(stays[1].changeReason?.code).toBe("NEW_CITY");
    expect(transitions).toHaveLength(1);
    expect(transitions[0].date).toBe("2027-04-12");
  });

  // Case 4: two cities plus return to the first
  it("Case 4: two cities plus return to first creates 3 contiguous stays", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-04-10", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-11", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-12", city: "Hakone", area: "Onsen" },
      { date: "2027-04-13", city: "Hakone", area: "Onsen" },
      { date: "2027-04-14", city: "Tokyo", area: "Ginza" },
      { date: "2027-04-15", city: "Tokyo", area: "Ginza" },
    ];
    const { stays } = planStays({ nights });
    expect(stays).toHaveLength(3);
    expect(stays[0].city).toBe("Tokyo");
    expect(stays[1].city).toBe("Hakone");
    expect(stays[2].city).toBe("Tokyo");
    expect(stays[2].changeReason?.code).toBe("NEW_CITY");
  });

  // Case 5: one city with two distant clusters (split)
  it("Case 5: one city with two distant clusters (>= minNights and >= 45m distance) splits with DISTANT_AREA", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-04-10", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-11", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-12", city: "Tokyo", area: "Odaiba", areaDistanceMinutesFromPrevious: 55 },
      { date: "2027-04-13", city: "Tokyo", area: "Odaiba" },
    ];
    const { stays } = planStays({ nights, options: { areaDistanceMinutes: 45, minNightsPerStay: 2 } });
    expect(stays).toHaveLength(2);
    expect(stays[0].area).toBe("Shinjuku");
    expect(stays[0].nights).toBe(2);
    expect(stays[1].area).toBe("Odaiba");
    expect(stays[1].nights).toBe(2);
    expect(stays[1].changeReason?.code).toBe("DISTANT_AREA");
  });

  // Case 6: the same with too few nights (no split)
  it("Case 6: distant clusters with too few nights (< minNightsPerStay) does NOT split", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-04-10", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-11", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-12", city: "Tokyo", area: "Shinjuku" },
      // Only 1 night in Odaiba -> violates minNightsPerStay (2)
      { date: "2027-04-13", city: "Tokyo", area: "Odaiba", areaDistanceMinutesFromPrevious: 60 },
    ];
    const { stays } = planStays({ nights, options: { minNightsPerStay: 2, areaDistanceMinutes: 45 } });
    expect(stays).toHaveLength(1);
    expect(stays[0].nights).toBe(4);
  });

  // Case 7: early-flight rule on
  it("Case 7: early-flight rule on (<08:00 departure and saves >= 60 min) splits last night with EARLY_FLIGHT_AIRPORT", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-04-10", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-11", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-12", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-13", city: "Tokyo", area: "Shinjuku" },
    ];
    const { stays } = planStays({
      nights,
      options: {
        departureFlightLocalTime: "07:15",
        airportTransferTimeSavedMinutes: 75,
      },
    });
    expect(stays).toHaveLength(2);
    expect(stays[0].nights).toBe(3);
    expect(stays[1].nights).toBe(1);
    expect(stays[1].changeReason?.code).toBe("EARLY_FLIGHT_AIRPORT");
  });

  // Case 8: early-flight rule off
  it("Case 8: early-flight rule off (flight at 10:30 or saves < 60 min) does NOT split to airport", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-04-10", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-11", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-12", city: "Tokyo", area: "Shinjuku" },
      { date: "2027-04-13", city: "Tokyo", area: "Shinjuku" },
    ];
    const { stays } = planStays({
      nights,
      options: {
        departureFlightLocalTime: "10:30",
        airportTransferTimeSavedMinutes: 20,
      },
    });
    expect(stays).toHaveLength(1);
    expect(stays[0].nights).toBe(4);
  });
});

describe("Itinerary Engine — Property Test for Invariants", () => {
  it("maintains all four invariants across arbitrary night configurations", () => {
    const testCases: NightPlanItem[][] = [
      // 1 night
      [{ date: "2027-05-01", city: "Paris", area: "Marais" }],
      // 5 nights single city
      Array.from({ length: 5 }, (_, i) => ({
        date: `2027-05-0${i + 1}`,
        city: "Paris",
        area: "Marais",
      })),
      // 9 nights 3 cities
      [
        { date: "2027-06-01", city: "Delhi", area: "Connaught" },
        { date: "2027-06-02", city: "Delhi", area: "Connaught" },
        { date: "2027-06-03", city: "Agra", area: "Taj" },
        { date: "2027-06-04", city: "Agra", area: "Taj" },
        { date: "2027-06-05", city: "Jaipur", area: "Pink City" },
        { date: "2027-06-06", city: "Jaipur", area: "Pink City" },
        { date: "2027-06-07", city: "Jaipur", area: "Pink City" },
        { date: "2027-06-08", city: "Jaipur", area: "Pink City" },
        { date: "2027-06-09", city: "Jaipur", area: "Pink City" },
      ],
    ];

    for (const nights of testCases) {
      const { stays } = planStays({ nights });
      // Invariant checks
      expect(() => assertStayInvariants(stays, nights.length)).not.toThrow();
    }
  });
});

describe("Itinerary Engine — scheduleDay", () => {
  it("schedules an arrival day with buffers, airport transfer, and checkin", () => {
    const events = scheduleDay(
      [
        { id: "act_1", name: "Evening Shinjuku Stroll", durationMin: 60 },
      ],
      {
        dayNumber: 1,
        date: "2027-04-10",
        isArrivalDay: true,
        flightLandingLocalTime: "14:30",
        isInternational: true,
      }
    );

    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0].type).toBe("arrival");
    expect(events[0].startLocal).toBe("14:30");
    expect(events[0].endLocal).toBe("16:00"); // 90 min international buffer

    expect(events[1].type).toBe("transfer");
    expect(events[1].startLocal).toBe("16:00");

    expect(events[2].type).toBe("checkin");
  });

  it("schedules a moving day starting with checkout, transfer, and checkin", () => {
    const events = scheduleDay(
      [
        { id: "act_afternoon", name: "Higashiyama Sunset", durationMin: 90 },
      ],
      {
        dayNumber: 5,
        date: "2027-04-14",
        isMovingDay: true,
        standardCheckOutTime: "11:00",
        movingTransferDurationMin: 120,
      }
    );

    expect(events[0].type).toBe("checkout");
    expect(events[0].endLocal).toBe("11:00");

    expect(events[1].type).toBe("transfer");
    expect(events[1].startLocal).toBe("11:00");
    expect(events[1].endLocal).toBe("13:00"); // 120 min

    expect(events[2].type).toBe("checkin");
  });

  it("schedules a departure day with checkout, transfer, and international buffer before flight", () => {
    const events = scheduleDay(
      [],
      {
        dayNumber: 9,
        date: "2027-04-19",
        isDepartureDay: true,
        flightDepartureLocalTime: "16:00",
        isInternational: true,
      }
    );

    const departureEvent = events.find((e) => e.type === "departure");
    expect(departureEvent).toBeDefined();
    expect(departureEvent?.startLocal).toBe("13:00"); // 180 min before 16:00
    expect(departureEvent?.endLocal).toBe("16:00");
  });
});

describe("Itinerary Engine — priceItinerary & validateItinerary", () => {
  it("prices stays, legs, and activities with exact decimal math", () => {
    const nights: NightPlanItem[] = [
      { date: "2027-05-10", city: "Lisbon", area: "Baixa" },
      { date: "2027-05-11", city: "Lisbon", area: "Baixa" },
    ];
    const { stays } = planStays({ nights, currency: "EUR" });
    const priced = priceItinerary({
      targetCurrency: "EUR",
      userBudget: { amount: 100000, currency: "EUR" }, // €1,000
      stays,
      days: [],
      journey: [],
      cities: ["Lisbon"],
    });

    expect(priced.summary.withinBudget).toBe(true);
    expect(priced.summary.estimatedTotal.amount).toBe(30000); // 15000 * 2 nights
    expect(priced.summary.remaining.amount).toBe(70000); // 100000 - 30000
  });

  it("validateItinerary flags blockers on budget overrun, gaps, and missing sleep stays", () => {
    const badItinerary = {
      ...SAMPLE_SINGLE_CITY_ITINERARY,
      summary: {
        ...SAMPLE_SINGLE_CITY_ITINERARY.summary,
        estimatedTotal: {
          amount: 250000, // Exceeds budget of 180000
          currency: "EUR",
          kind: "demo_offer" as const,
          source: "engine",
          fetchedAt: new Date().toISOString(),
        },
      },
      days: [
        {
          ...SAMPLE_SINGLE_CITY_ITINERARY.days[0],
          sleepStayId: null, // Day 1 missing sleepStayId!
        },
        ...SAMPLE_SINGLE_CITY_ITINERARY.days.slice(1),
      ],
    };

    const issues = validateItinerary(badItinerary);
    const blockerCodes = issues.filter((i) => i.severity === "blocker").map((i) => i.code);

    expect(blockerCodes).toContain("OVER_BUDGET_CAP");
    expect(blockerCodes).toContain("MISSING_SLEEP_STAY");
  });
});

describe("Contract validation of fixtures", () => {
  it("SAMPLE_MULTICITY_ITINERARY parses successfully against ItinerarySchema", () => {
    const parsed = ItinerarySchema.safeParse(SAMPLE_MULTICITY_ITINERARY);
    expect(parsed.success).toBe(true);
  });

  it("SAMPLE_SINGLE_CITY_ITINERARY parses successfully against ItinerarySchema", () => {
    const parsed = ItinerarySchema.safeParse(SAMPLE_SINGLE_CITY_ITINERARY);
    expect(parsed.success).toBe(true);
  });
});
