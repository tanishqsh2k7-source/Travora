import { describe, it, expect } from "vitest";
import { synthesizeItinerary } from "../engines/itinerary/index.js";
import { ItinerarySchema, type CreateTripRequest } from "@travora/contracts";
import { PlacesFixtureAdapter } from "../providers/fixtures/places.fixture.js";
import { FlightsFixtureAdapter } from "../providers/fixtures/flights.fixture.js";
import { HotelsFixtureAdapter } from "../providers/fixtures/hotels.fixture.js";

describe("End-to-End Itinerary API on Demo Data", () => {
  it("synthesizes a valid multi-city itinerary whose stays cover every night", async () => {
    const placesProvider = new PlacesFixtureAdapter();
    const flightsProvider = new FlightsFixtureAdapter();
    const hotelsProvider = new HotelsFixtureAdapter();

    const request: CreateTripRequest = {
      origin: "Delhi, India",
      destination: "Tokyo & Kyoto, Japan",
      startDate: "2027-04-10",
      endDate: "2027-04-19",
      timezone: "Asia/Tokyo",
      travellers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: 50000000, currency: "INR", flexibilityPct: 10 },
      interests: ["culture", "food", "history"],
      travelStyle: "balanced",
      transportPreferences: ["public_transit", "walking"],
      constraints: { accessibility: [], dietary: [], pace: "moderate" },
    };

    const places = await placesProvider.searchPlaces({
      query: "attractions in Tokyo",
      destination: "Tokyo, Japan",
      types: ["tourist_attraction"],
      radiusMeters: 10000,
      limit: 10,
    });

    const flights = await flightsProvider.searchFlights({
      origin: request.origin,
      destination: request.destination,
      departureDate: request.startDate,
      returnDate: request.endDate,
      adults: 2,
      currency: "INR",
    });

    const hotels = await hotelsProvider.searchHotels({
      destination: request.destination,
      checkInDate: request.startDate,
      checkOutDate: request.endDate,
      adults: 2,
      rooms: 1,
      currency: "INR",
    });

    const itinerary = synthesizeItinerary({
      tripId: "6735e5d1e89b3f0012a4b512",
      request,
      placesResult: places,
      flightsResult: flights,
      hotelsResult: hotels,
      dataMode: "demo",
    });

    // 1. Conforms to ItinerarySchema
    const parseResult = ItinerarySchema.safeParse(itinerary);
    expect(parseResult.success).toBe(true);

    // 2. Nights add up to total nights
    const totalStayNights = itinerary.stays.reduce((sum, s) => sum + s.nights, 0);
    expect(totalStayNights).toBe(itinerary.nights);
    expect(itinerary.nights).toBe(9);

    // 3. Stays are contiguous
    for (let i = 0; i < itinerary.stays.length - 1; i++) {
      expect(itinerary.stays[i].checkOutDate).toBe(itinerary.stays[i + 1].checkInDate);
    }

    // 4. Moving day appears when multi-city is planned
    const movingDays = itinerary.days.filter((d) => d.isMovingDay);
    expect(movingDays.length).toBeGreaterThan(0);
    expect(itinerary.transitions.length).toBeGreaterThan(0);
  });
});
