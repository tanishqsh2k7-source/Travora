import { describe, it, expect, vi, beforeEach } from "vitest";
import { determineTaskPlan } from "../agents/nodes/supervisor.js";
import { createPlanningGraph } from "../agents/graph.js";
import * as providersModule from "../providers/index.js";
import type { CreateTripRequest, UserPreferences } from "@travora/contracts";

describe("Phase 5: Supervisor and Parallel Agents", () => {
  describe("Supervisor TaskPlan logic", () => {
    it("classifies a 'museums in Lisbon' discovery request to skip flights and hotels", () => {
      const lisbonRequest: CreateTripRequest = {
        origin: "Lisbon, Portugal",
        destination: "Lisbon, Portugal",
        startDate: "2027-05-10",
        endDate: "2027-05-12",
        timezone: "Europe/Lisbon",
        travellers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 50000, currency: "EUR", flexibilityPct: 5 },
        interests: ["museums", "art", "historical"],
        travelStyle: "relaxed",
        transportPreferences: ["public_transit", "walking"],
        constraints: { accessibility: [], dietary: [], pace: "relaxed" },
      };

      const taskPlan = determineTaskPlan({
        runId: "run_test_lisbon",
        tripId: "trip_lisbon",
        userId: "user_test",
        request: lisbonRequest,
        status: "running",
      } as any);

      expect(taskPlan.isDiscoveryOnly).toBe(true);
      expect(taskPlan.skippedCapabilities).toContain("flights");
      expect(taskPlan.skippedCapabilities).toContain("hotels");
      expect(taskPlan.requiredCapabilities).toContain("destination");
      expect(taskPlan.requiredCapabilities).toContain("weather");
      expect(taskPlan.rationale).toContain("Local discovery request for Lisbon");
    });

    it("classifies an international multi-day trip to require all capabilities", () => {
      const fullTripRequest: CreateTripRequest = {
        origin: "Delhi, India",
        destination: "Tokyo, Japan",
        startDate: "2027-04-10",
        endDate: "2027-04-16",
        timezone: "Asia/Tokyo",
        travellers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 30000000, currency: "INR", flexibilityPct: 5 },
        interests: ["food", "anime"],
        travelStyle: "balanced",
        transportPreferences: ["public_transit"],
        constraints: { accessibility: [], dietary: [], pace: "moderate" },
      };

      const taskPlan = determineTaskPlan({
        runId: "run_test_tokyo",
        tripId: "trip_tokyo",
        userId: "user_test",
        request: fullTripRequest,
        status: "running",
      } as any);

      expect(taskPlan.isDiscoveryOnly).toBe(false);
      expect(taskPlan.skippedCapabilities.length).toBe(0);
      expect(taskPlan.requiredCapabilities).toEqual([
        "destination",
        "flights",
        "hotels",
        "weather",
        "budget",
        "routes",
        "itinerary",
      ]);
    });
  });

  describe("End-to-End Parallel Execution with Supervisor", () => {
    it("executes 'museums in Lisbon' request and verifies flights and hotels are skipped", async () => {
      const graph = createPlanningGraph();

      const lisbonRequest: CreateTripRequest = {
        origin: "Lisbon, Portugal",
        destination: "Lisbon, Portugal",
        startDate: "2027-05-10",
        endDate: "2027-05-12",
        timezone: "Europe/Lisbon",
        travellers: { adults: 1, children: 0, infants: 0 },
        budget: { amount: 50000, currency: "EUR", flexibilityPct: 5 },
        interests: ["museums", "art"],
        travelStyle: "relaxed",
        transportPreferences: ["walking"],
        constraints: { accessibility: [], dietary: [], pace: "relaxed" },
      };

      const preferences: UserPreferences = {
        interests: ["museums", "art"],
        travelStyle: "relaxed",
        pace: "relaxed",
        dietaryRestrictions: [],
        accessibilityRequirements: [],
        preferredCurrency: "EUR",
        transportPreferences: ["walking"],
      };

      const finalState = await graph.invoke(
        {
          runId: "run_lisbon_001",
          tripId: "trip_lisbon_001",
          userId: "user_lisbon",
          request: lisbonRequest,
          preferences,
          status: "running",
          warnings: [],
        },
        {
          configurable: { thread_id: "thread_lisbon_001" },
        }
      );

      // Verify Supervisor TaskPlan
      expect(finalState.taskPlan).toBeDefined();
      expect(finalState.taskPlan?.isDiscoveryOnly).toBe(true);

      // Verify flights and hotels were skipped
      expect(finalState.flightsResult).toEqual([]);
      expect(finalState.hotelsResult).toEqual([]);
      expect(finalState.finalResponse?.flightOptions).toEqual([]);
      expect(finalState.finalResponse?.hotelOptions).toEqual([]);

      // Verify destination places research ran and found Lisbon sights
      expect(finalState.placesResult?.length).toBeGreaterThan(0);
      const hasLisbonPlace = finalState.placesResult?.some(
        (p) => p.name.includes("Gulbenkian") || p.name.includes("Jerónimos") || p.address.includes("Lisboa")
      );
      expect(hasLisbonPlace).toBe(true);

      // Verify itinerary and completion
      expect(finalState.status).toBe("completed");
      expect(finalState.finalResponse?.itinerary.length).toBe(3);
    });

    it("executes full trip request and verifies all parallel branches run and merge", async () => {
      const graph = createPlanningGraph();

      const tokyoRequest: CreateTripRequest = {
        origin: "Delhi, India",
        destination: "Tokyo, Japan",
        startDate: "2027-04-10",
        endDate: "2027-04-14",
        timezone: "Asia/Tokyo",
        travellers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 30000000, currency: "INR", flexibilityPct: 5 },
        interests: ["food", "anime", "museums"],
        travelStyle: "balanced",
        transportPreferences: ["public_transit"],
        constraints: { accessibility: [], dietary: ["vegetarian"], pace: "moderate" },
      };

      const preferences: UserPreferences = {
        interests: ["food", "anime"],
        travelStyle: "balanced",
        pace: "moderate",
        dietaryRestrictions: ["vegetarian"],
        accessibilityRequirements: [],
        preferredCurrency: "INR",
        transportPreferences: ["public_transit"],
      };

      const finalState = await graph.invoke(
        {
          runId: "run_tokyo_parallel",
          tripId: "trip_tokyo_parallel",
          userId: "user_tokyo",
          request: tokyoRequest,
          preferences,
          status: "running",
          warnings: [],
        },
        {
          configurable: { thread_id: "thread_tokyo_parallel" },
        }
      );

      expect(finalState.status).toBe("completed");
      // All 4 parallel branches populated
      expect(finalState.placesResult?.length).toBeGreaterThan(0);
      expect(finalState.flightsResult?.length).toBeGreaterThan(0);
      expect(finalState.hotelsResult?.length).toBeGreaterThan(0);
      expect(finalState.weatherResult?.daily.length).toBe(5);

      // Synthesis & Itinerary populated
      expect(finalState.finalResponse?.flightOptions.length).toBeGreaterThan(0);
      expect(finalState.finalResponse?.hotelOptions.length).toBeGreaterThan(0);
      expect(finalState.finalResponse?.itinerary.length).toBe(5);
    });
  });

  describe("Partial Failure Handling", () => {
    it("retains destination research and gracefully completes when flight search fails", async () => {
      // Mock flight search failure
      const mockFlightProvider = {
        name: "failing_flights",
        searchFlights: vi.fn().mockRejectedValue(new Error("Flight API 503 Service Unavailable")),
      };

      vi.spyOn(providersModule, "getProviderRegistry").mockReturnValue({
        ...providersModule.getProviderRegistry(),
        flights: mockFlightProvider,
      });

      const graph = createPlanningGraph();

      const tokyoRequest: CreateTripRequest = {
        origin: "Delhi, India",
        destination: "Tokyo, Japan",
        startDate: "2027-04-10",
        endDate: "2027-04-12",
        timezone: "Asia/Tokyo",
        travellers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 30000000, currency: "INR", flexibilityPct: 5 },
        interests: ["food"],
        travelStyle: "balanced",
        transportPreferences: ["public_transit"],
        constraints: { accessibility: [], dietary: [], pace: "moderate" },
      };

      const finalState = await graph.invoke(
        {
          runId: "run_partial_fail",
          tripId: "trip_partial_fail",
          userId: "user_partial",
          request: tokyoRequest,
          status: "running",
          warnings: [],
        },
        {
          configurable: { thread_id: "thread_partial_fail" },
        }
      );

      // Graph should complete, NOT crash
      expect(finalState.status).toBe("completed");

      // Flights should be empty due to failure
      expect(finalState.flightsResult).toEqual([]);

      // Destination research and hotels must be intact!
      expect(finalState.placesResult?.length).toBeGreaterThan(0);
      expect(finalState.hotelsResult?.length).toBeGreaterThan(0);

      // Warning should be recorded in state and final response
      const hasFlightWarning = finalState.warnings?.some(
        (w) => w.includes("Flight") || w.includes("unavailable")
      );
      expect(hasFlightWarning).toBe(true);

      vi.restoreAllMocks();
    });
  });
});

