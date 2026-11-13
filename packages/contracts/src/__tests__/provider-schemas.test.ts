import { describe, it, expect } from "vitest";
import {
  PlaceCandidateSchema,
  RouteLegSchema,
  RouteMatrixResultSchema,
  WeatherForecastSchema,
  FlightOfferSchema,
  HotelOfferSchema,
} from "../index.js";

describe("Provider schemas", () => {
  it("validates a valid PlaceCandidate", () => {
    const candidate = {
      id: "place_tokyo_tower",
      name: "Tokyo Tower",
      description: "Iconic communications and observation tower",
      address: "4-2-8 Shibakoen, Minato City, Tokyo",
      coordinates: { lat: 35.6586, lng: 139.7454 },
      rating: 4.5,
      userRatingsTotal: 65000,
      types: ["tourist_attraction", "point_of_interest"],
      openingHours: { openNow: true, weekdayText: ["Monday: 9:00 AM – 11:00 PM"] },
      estimatedDurationMin: 90,
      fetchedAt: new Date().toISOString(),
      provider: "google_places",
    };

    const parsed = PlaceCandidateSchema.parse(candidate);
    expect(parsed.name).toBe("Tokyo Tower");
    expect(parsed.coordinates.lat).toBe(35.6586);
  });

  it("validates a RouteLeg", () => {
    const leg = {
      origin: { lat: 35.6586, lng: 139.7454 },
      destination: { lat: 35.6762, lng: 139.6503 },
      distanceMeters: 9200,
      durationSeconds: 1500,
      mode: "transit",
      fetchedAt: new Date().toISOString(),
      provider: "google_routes",
    };

    const parsed = RouteLegSchema.parse(leg);
    expect(parsed.distanceMeters).toBe(9200);
    expect(parsed.mode).toBe("transit");
  });

  it("validates RouteMatrixResult", () => {
    const matrix = {
      elements: [
        { originIndex: 0, destinationIndex: 0, distanceMeters: 0, durationSeconds: 0, status: "OK" },
        { originIndex: 0, destinationIndex: 1, distanceMeters: 5000, durationSeconds: 1200, status: "OK" },
      ],
      fetchedAt: new Date().toISOString(),
      provider: "google_routes",
    };

    const parsed = RouteMatrixResultSchema.parse(matrix);
    expect(parsed.elements.length).toBe(2);
  });

  it("validates WeatherForecast", () => {
    const forecast = {
      coordinates: { lat: 35.6762, lng: 139.6503 },
      daily: [
        {
          date: "2027-04-10",
          tempMinC: 12,
          tempMaxC: 19,
          condition: "Clear",
          description: "Clear sky with gentle breeze",
          precipitationProb: 10,
          isRainy: false,
        },
      ],
      isForecast: true,
      alerts: [],
      fetchedAt: new Date().toISOString(),
      provider: "openweather",
    };

    const parsed = WeatherForecastSchema.parse(forecast);
    expect(parsed.daily[0].isRainy).toBe(false);
  });

  it("validates FlightOffer", () => {
    const offer = {
      id: "flt_001",
      carrier: "AI",
      carrierName: "Air India",
      origin: "DEL",
      destination: "HND",
      departureDate: "2027-04-10",
      segments: [
        {
          departureAirport: "DEL",
          arrivalAirport: "HND",
          departureTime: "2027-04-10T23:15:00Z",
          arrivalTime: "2027-04-11T11:20:00Z",
          carrier: "AI",
          carrierName: "Air India",
          flightNumber: "AI306",
          durationMinutes: 455,
        },
      ],
      totalDurationMinutes: 455,
      stops: 0,
      price: { amount: 6500000, currency: "INR" },
      baggageIncluded: true,
      fetchedAt: new Date().toISOString(),
      provider: "amadeus_mock",
    };

    const parsed = FlightOfferSchema.parse(offer);
    expect(parsed.price.amount).toBe(6500000);
  });

  it("validates HotelOffer", () => {
    const hotel = {
      id: "htl_001",
      name: "Hotel Gracery Shinjuku",
      address: "1-19-1 Kabukicho, Shinjuku City, Tokyo",
      coordinates: { lat: 35.6953, lng: 139.7022 },
      rating: 4.4,
      stars: 4,
      pricePerNight: { amount: 1400000, currency: "INR" },
      totalPrice: { amount: 8400000, currency: "INR" },
      nights: 6,
      amenities: ["Free WiFi", "Godzilla terrace", "Restaurant"],
      hotelStyle: "balanced",
      fetchedAt: new Date().toISOString(),
      provider: "hotel_mock",
    };

    const parsed = HotelOfferSchema.parse(hotel);
    expect(parsed.nights).toBe(6);
    expect(parsed.totalPrice.amount).toBe(8400000);
  });
});

