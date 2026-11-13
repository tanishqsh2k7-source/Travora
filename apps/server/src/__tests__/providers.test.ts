import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PlacesFixtureAdapter,
  RoutesFixtureAdapter,
  WeatherFixtureAdapter,
  FlightsFixtureAdapter,
  HotelsFixtureAdapter,
  GooglePlacesLiveAdapter,
  GoogleRoutesLiveAdapter,
  OpenWeatherLiveAdapter,
  getProviderRegistry,
  ProviderError,
} from "../providers/index.js";

describe("Phase 2: Provider Layer", () => {
  describe("PlacesFixtureAdapter", () => {
    const provider = new PlacesFixtureAdapter();

    it("searches places matching Tokyo query and returns typed candidates", async () => {
      const places = await provider.searchPlaces({
        query: "museum",
        destination: "Tokyo",
        limit: 5,
        types: [],
        radiusMeters: 10000,
      });

      expect(places.length).toBeGreaterThan(0);
      expect(places.length).toBeLessThanOrEqual(5);
      const museum = places.find((p) => p.name.includes("Museum"));
      expect(museum).toBeDefined();
      expect(museum?.coordinates.lat).toBeDefined();
      expect(museum?.provider).toBe("places_fixture");
    });

    it("retrieves details for an existing place ID", async () => {
      const place = await provider.getPlaceDetails("tokyo_sensoji");
      expect(place).not.toBeNull();
      expect(place?.name).toBe("Senso-ji Temple");
      expect(place?.openingHours?.weekdayText.length).toBeGreaterThan(0);
    });

    it("returns null for a non-existent place ID", async () => {
      const place = await provider.getPlaceDetails("unknown_place_123");
      expect(place).toBeNull();
    });
  });

  describe("RoutesFixtureAdapter", () => {
    const provider = new RoutesFixtureAdapter();
    const sensoji = { lat: 35.7148, lng: 139.7967 };
    const meiji = { lat: 35.6764, lng: 139.6993 };

    it("computes route with realistic distance and duration", async () => {
      const leg = await provider.computeRoute(sensoji, meiji, "transit");
      expect(leg.distanceMeters).toBeGreaterThan(8000); // ~9-10km
      expect(leg.distanceMeters).toBeLessThan(15000);
      expect(leg.durationSeconds).toBeGreaterThan(600); // >10 mins
      expect(leg.mode).toBe("transit");
      expect(leg.provider).toBe("routes_fixture");
    });

    it("computes pairwise route matrix between multiple points", async () => {
      const matrix = await provider.computeRouteMatrix({
        origins: [sensoji, meiji],
        destinations: [sensoji, meiji],
        mode: "transit",
      });

      expect(matrix.elements.length).toBe(4);
      // Diagonal distance should be 0
      const originToSelf = matrix.elements.find(
        (e) => e.originIndex === 0 && e.destinationIndex === 0
      );
      expect(originToSelf?.distanceMeters).toBe(0);
      expect(originToSelf?.durationSeconds).toBe(0);

      const crossRoute = matrix.elements.find(
        (e) => e.originIndex === 0 && e.destinationIndex === 1
      );
      expect(crossRoute?.distanceMeters).toBeGreaterThan(0);
    });
  });

  describe("WeatherFixtureAdapter", () => {
    const provider = new WeatherFixtureAdapter();

    it("generates daily weather across trip dates", async () => {
      const forecast = await provider.getForecast({
        coordinates: { lat: 35.6762, lng: 139.6503 },
        startDate: "2027-04-10",
        endDate: "2027-04-14",
      });

      expect(forecast.daily.length).toBe(5);
      expect(forecast.daily[0].date).toBe("2027-04-10");
      expect(forecast.daily[4].date).toBe("2027-04-14");

      // Verify rainy day scenario for Day 2 (index 1) for replanning/disruption
      expect(forecast.daily[1].isRainy).toBe(true);
      expect(forecast.daily[1].condition).toBe("Rain");
      expect(forecast.daily[1].precipitationProb).toBeGreaterThanOrEqual(70);

      // Other days should be clear
      expect(forecast.daily[0].isRainy).toBe(false);
    });
  });

  describe("FlightsFixtureAdapter", () => {
    const provider = new FlightsFixtureAdapter();

    it("returns direct and 1-stop offers with integer money units", async () => {
      const offers = await provider.searchFlights({
        origin: "DEL",
        destination: "HND",
        departureDate: "2027-04-10",
        returnDate: "2027-04-16",
        adults: 2,
        currency: "INR",
      });

      expect(offers.length).toBe(2);
      const direct = offers.find((o) => o.stops === 0);
      const oneStop = offers.find((o) => o.stops === 1);

      expect(direct).toBeDefined();
      expect(oneStop).toBeDefined();
      expect(direct?.price.currency).toBe("INR");
      expect(Number.isInteger(direct?.price.amount)).toBe(true);
      expect(direct?.price.amount).toBeGreaterThan(oneStop!.price.amount);
      expect(direct?.segments[0].carrier).toBe("AI");
    });
  });

  describe("HotelsFixtureAdapter", () => {
    const provider = new HotelsFixtureAdapter();

    it("returns hotel offers with exact total prices based on nights", async () => {
      const hotels = await provider.searchHotels({
        destination: "Tokyo",
        checkInDate: "2027-04-10",
        checkOutDate: "2027-04-16", // 6 nights
        adults: 2,
        rooms: 1,
        currency: "USD",
      });

      expect(hotels.length).toBe(3);
      for (const hotel of hotels) {
        expect(hotel.nights).toBe(6);
        expect(hotel.totalPrice.amount).toBe(hotel.pricePerNight.amount * 6);
        expect(hotel.pricePerNight.currency).toBe("USD");
      }
    });

    it("filters hotels by travel style", async () => {
      const luxuryHotels = await provider.searchHotels({
        destination: "Tokyo",
        checkInDate: "2027-04-10",
        checkOutDate: "2027-04-12",
        adults: 2,
        rooms: 1,
        travelStyle: "luxury",
        currency: "USD",
      });

      expect(luxuryHotels.length).toBe(1);
      expect(luxuryHotels[0].name).toBe("HOSHINOYA Tokyo");
      expect(luxuryHotels[0].hotelStyle).toBe("luxury");
    });
  });

  describe("Live Adapters with Mocked HTTP", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    describe("GooglePlacesLiveAdapter", () => {
      it("throws ProviderError if API key is not configured", async () => {
        const live = new GooglePlacesLiveAdapter("");
        await expect(
          live.searchPlaces({ query: "cafe", destination: "Tokyo", limit: 5, types: [], radiusMeters: 1000 })
        ).rejects.toThrow(ProviderError);
      });

      it("fetches and normalizes places from Google Places API", async () => {
        const live = new GooglePlacesLiveAdapter("fake-api-key");

        const fakeResponse = {
          places: [
            {
              id: "places/ChIJN1t_tDeuEmsRUsoyG83frY4",
              displayName: { text: "Tokyo Tower Observation Deck", languageCode: "en" },
              formattedAddress: "4 Chome Shibakoen, Minato City, Tokyo",
              location: { latitude: 35.6586, longitude: 139.7454 },
              rating: 4.6,
              userRatingCount: 52000,
              types: ["tourist_attraction", "point_of_interest"],
              regularOpeningHours: {
                openNow: true,
                weekdayDescriptions: ["Monday: 9:00 AM – 11:00 PM"],
              },
              priceLevel: "PRICE_LEVEL_MODERATE",
              editorialSummary: { text: "Famous red and white lattice tower" },
              websiteUri: "https://www.tokyotower.co.jp/",
            },
          ],
        };

        const mockFetch = vi.spyOn(global, "fetch").mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => fakeResponse,
        } as unknown as Response);

        const results = await live.searchPlaces({
          query: "Tokyo Tower",
          destination: "Tokyo",
          limit: 1,
          types: [],
          radiusMeters: 5000,
        });

        expect(mockFetch).toHaveBeenCalledOnce();
        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[0]).toContain("https://places.googleapis.com/v1/places:searchText");
        const headers = (callArgs[1]?.headers as Record<string, string>) ?? {};
        expect(headers["X-Goog-Api-Key"]).toBe("fake-api-key");

        expect(results.length).toBe(1);
        expect(results[0].name).toBe("Tokyo Tower Observation Deck");
        expect(results[0].coordinates.lat).toBe(35.6586);
        expect(results[0].priceLevel).toBe(2);
        expect(results[0].provider).toBe("google_places");
      });

      it("handles HTTP error from Google Places API gracefully", async () => {
        const live = new GooglePlacesLiveAdapter("fake-api-key");

        vi.spyOn(global, "fetch").mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: async () => "API key not authorized for Places API (New)",
        } as unknown as Response);

        await expect(
          live.searchPlaces({ query: "cafe", destination: "Tokyo", limit: 5, types: [], radiusMeters: 1000 })
        ).rejects.toThrow("Places searchText failed: 403 Forbidden");
      });
    });

    describe("GoogleRoutesLiveAdapter", () => {
      it("throws ProviderError if API key is missing", async () => {
        const live = new GoogleRoutesLiveAdapter("");
        await expect(
          live.computeRoute({ lat: 35.6, lng: 139.7 }, { lat: 35.7, lng: 139.8 })
        ).rejects.toThrow(ProviderError);
      });

      it("fetches and normalizes route leg from Google Routes API", async () => {
        const live = new GoogleRoutesLiveAdapter("fake-api-key");

        const fakeRoute = {
          routes: [
            {
              distanceMeters: 10450,
              duration: "1800s",
              polyline: { encodedPolyline: "abcd_polyline" },
            },
          ],
        };

        const mockFetch = vi.spyOn(global, "fetch").mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => fakeRoute,
        } as unknown as Response);

        const leg = await live.computeRoute(
          { lat: 35.6586, lng: 139.7454 },
          { lat: 35.7148, lng: 139.7967 },
          "transit"
        );

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(leg.distanceMeters).toBe(10450);
        expect(leg.durationSeconds).toBe(1800);
        expect(leg.polyline).toBe("abcd_polyline");
        expect(leg.provider).toBe("google_routes");
      });

      it("fetches and normalizes route matrix", async () => {
        const live = new GoogleRoutesLiveAdapter("fake-api-key");

        const fakeMatrix = [
          { originIndex: 0, destinationIndex: 0, distanceMeters: 0, duration: "0s", status: { code: 0 } },
          { originIndex: 0, destinationIndex: 1, distanceMeters: 8500, duration: "1200s", status: { code: 0 } },
        ];

        vi.spyOn(global, "fetch").mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => fakeMatrix,
        } as unknown as Response);

        const matrix = await live.computeRouteMatrix({
          origins: [{ lat: 35.6, lng: 139.7 }],
          destinations: [{ lat: 35.6, lng: 139.7 }, { lat: 35.7, lng: 139.8 }],
          mode: "transit",
        });

        expect(matrix.elements.length).toBe(2);
        expect(matrix.elements[1].durationSeconds).toBe(1200);
      });
    });

    describe("OpenWeatherLiveAdapter", () => {
      it("throws ProviderError if API key is missing", async () => {
        const live = new OpenWeatherLiveAdapter("");
        await expect(
          live.getForecast({
            coordinates: { lat: 35.6, lng: 139.7 },
            startDate: "2027-04-10",
            endDate: "2027-04-12",
          })
        ).rejects.toThrow(ProviderError);
      });

      it("groups 3-hour forecasts into daily summaries and marks rainy days", async () => {
        const live = new OpenWeatherLiveAdapter("fake-weather-key");

        const fakeForecast = {
          cod: "200",
          list: [
            {
              dt: 1712739600,
              dt_txt: "2027-04-10 09:00:00",
              main: { temp: 16.5, temp_min: 15.0, temp_max: 18.0, humidity: 60 },
              weather: [{ main: "Clear", description: "clear sky" }],
              wind: { speed: 3.5 },
              pop: 0.1,
            },
            {
              dt: 1712750400,
              dt_txt: "2027-04-10 12:00:00",
              main: { temp: 19.5, temp_min: 18.0, temp_max: 20.0, humidity: 55 },
              weather: [{ main: "Clear", description: "clear sky" }],
              wind: { speed: 4.0 },
              pop: 0.1,
            },
            {
              dt: 1712826000,
              dt_txt: "2027-04-11 12:00:00",
              main: { temp: 14.0, temp_min: 12.0, temp_max: 15.0, humidity: 88 },
              weather: [{ main: "Rain", description: "moderate rain" }],
              wind: { speed: 6.5 },
              pop: 0.85,
            },
          ],
        };

        vi.spyOn(global, "fetch").mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => fakeForecast,
        } as unknown as Response);

        const forecast = await live.getForecast({
          coordinates: { lat: 35.6762, lng: 139.6503 },
          startDate: "2027-04-10",
          endDate: "2027-04-11",
        });

        expect(forecast.daily.length).toBe(2);
        // Day 1: Clear
        expect(forecast.daily[0].date).toBe("2027-04-10");
        expect(forecast.daily[0].isRainy).toBe(false);
        expect(forecast.daily[0].tempMaxC).toBe(20);

        // Day 2: Rain
        expect(forecast.daily[1].date).toBe("2027-04-11");
        expect(forecast.daily[1].isRainy).toBe(true);
        expect(forecast.daily[1].precipitationProb).toBe(85);
        expect(forecast.alerts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getProviderRegistry", () => {
    it("returns all 5 providers with default fixture adapters when keys are absent", () => {
      const reg = getProviderRegistry();
      expect(reg.places.name).toBe("places_fixture");
      expect(reg.routes.name).toBe("routes_fixture");
      expect(reg.weather.name).toBe("weather_fixture");
      expect(reg.flights.name).toBe("flights_fixture");
      expect(reg.hotels.name).toBe("hotels_fixture");
    });

    it("accepts injected overrides", () => {
      const customPlaces = new PlacesFixtureAdapter();
      const reg = getProviderRegistry({ places: customPlaces });
      expect(reg.places).toBe(customPlaces);
    });
  });
});

