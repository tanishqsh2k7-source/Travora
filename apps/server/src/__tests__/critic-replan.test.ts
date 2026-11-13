import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { criticNode } from "../agents/nodes/critic.js";
import { replanNode } from "../agents/nodes/replan.js";
import { createPlanningGraph } from "../agents/graph.js";
import { TripModel, TripVersionModel } from "../models/index.js";
import type { CreateTripRequest, OptimizedDaySchedule } from "@travora/contracts";
import type { TravelState } from "../agents/state.js";

const app = createApp();

describe("Phase 6: Critic, Replanner, and Version History", () => {
  let userToken: string;
  let userId: string;
  let tripId: string;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  const tripPayload: CreateTripRequest = {
    origin: "Delhi, India",
    destination: "Tokyo, Japan",
    startDate: "2027-04-10",
    endDate: "2027-04-14", // 5 days
    timezone: "Asia/Tokyo",
    travellers: { adults: 2, children: 0, infants: 0 },
    budget: { amount: 30000000, currency: "INR", flexibilityPct: 5 },
    interests: ["food", "anime", "museums"],
    travelStyle: "balanced",
    transportPreferences: ["public_transit"],
    constraints: { accessibility: [], dietary: ["vegetarian"], pace: "moderate" },
  };

  beforeEach(async () => {
    await clearTestDB();

    const res = await request(app).post("/api/v1/auth/register").send({
      email: "traveler6@example.com",
      password: "password123",
      name: "Phase 6 Traveler",
    });
    userToken = res.body.token;
    userId = res.body.user.id;

    // Create baseline trip
    const tripRes = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${userToken}`)
      .send(tripPayload);

    tripId = tripRes.body.id;
  });

  describe("Two-Stage Critic", () => {
    it("detects outdoor activities scheduled on a rainy day and flags BLOCKER", async () => {
      // Day 2 (2027-04-11) is rainy from WeatherFixtureAdapter
      const sampleDays: OptimizedDaySchedule[] = [
        {
          dayNumber: 1,
          date: "2027-04-10",
          totalTravelTimeMin: 30,
          totalActivityTimeMin: 180,
          stops: [
            {
              id: "s1",
              placeId: "tokyo_national_museum",
              name: "Tokyo National Museum",
              coordinates: { lat: 35.7188, lng: 139.7765 },
              startLocal: "10:00",
              endLocal: "12:00",
              durationMin: 120,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
          ],
        },
        {
          dayNumber: 2,
          date: "2027-04-11", // Rainy day!
          totalTravelTimeMin: 30,
          totalActivityTimeMin: 180,
          stops: [
            {
              id: "s2",
              placeId: "tokyo_shibuya_sky",
              name: "SHIBUYA SKY (Open-air observation deck)",
              coordinates: { lat: 35.6585, lng: 139.7023 },
              startLocal: "10:00",
              endLocal: "11:30",
              durationMin: 90,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
          ],
        },
      ];

      const mockWeather = {
        coordinates: { lat: 35.6, lng: 139.7 },
        daily: [
          {
            date: "2027-04-10",
            tempMinC: 14,
            tempMaxC: 20,
            condition: "Clear",
            description: "Clear sky",
            precipitationProb: 10,
            isRainy: false,
          },
          {
            date: "2027-04-11",
            tempMinC: 13,
            tempMaxC: 16,
            condition: "Rain",
            description: "Heavy rain",
            precipitationProb: 85,
            isRainy: true, // RAIN!
          },
        ],
        isForecast: true,
        alerts: [],
        fetchedAt: new Date().toISOString(),
        provider: "test",
      };

      const mockPlaces = [
        {
          id: "tokyo_shibuya_sky",
          name: "SHIBUYA SKY",
          address: "Shibuya",
          coordinates: { lat: 35.6585, lng: 139.7023 },
          types: ["viewpoint", "outdoor"],
          estimatedDurationMin: 90,
          fetchedAt: new Date().toISOString(),
          provider: "test",
        },
      ];

      const result = await criticNode({
        routeResult: {
          days: sampleDays,
          unplacedPlaces: [],
          totalDistanceMeters: 5000,
          totalTravelTimeMin: 60,
        },
        weatherResult: mockWeather,
        placesResult: mockPlaces,
        replanCount: 0,
        warnings: [],
      } as any);

      const report = (result as any).validationReport;
      expect(report?.hasBlockers).toBe(true);
      const rainIssue = report?.issues?.find(
        (i: any) => i.code === "WEATHER_RAIN_CONFLICT"
      );
      expect(rainIssue).toBeDefined();
      expect(rainIssue?.severity).toBe("BLOCKER");
      expect(rainIssue?.dayNumber).toBe(2);
      expect(rainIssue?.message).toContain("SHIBUYA SKY");
    });
  });

  describe("Replanner Node (Preserving Unaffected Days)", () => {
    it("adapts only the rainy day to indoor attractions while preserving Day 1 and Day 3", async () => {
      const initialDays: OptimizedDaySchedule[] = [
        {
          dayNumber: 1,
          date: "2027-04-10",
          totalTravelTimeMin: 20,
          totalActivityTimeMin: 90,
          stops: [
            {
              id: "d1_stop1",
              placeId: "tokyo_sensoji",
              name: "Senso-ji Temple",
              coordinates: { lat: 35.7148, lng: 139.7967 },
              startLocal: "09:30",
              endLocal: "11:00",
              durationMin: 90,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
          ],
        },
        {
          dayNumber: 2,
          date: "2027-04-11", // Rainy day
          totalTravelTimeMin: 30,
          totalActivityTimeMin: 90,
          stops: [
            {
              id: "d2_stop1",
              placeId: "tokyo_shibuya_sky",
              name: "SHIBUYA SKY",
              coordinates: { lat: 35.6585, lng: 139.7023 },
              startLocal: "10:00",
              endLocal: "11:30",
              durationMin: 90,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
          ],
        },
        {
          dayNumber: 3,
          date: "2027-04-12",
          totalTravelTimeMin: 25,
          totalActivityTimeMin: 75,
          stops: [
            {
              id: "d3_stop1",
              placeId: "tokyo_meiji",
              name: "Meiji Jingu Shrine",
              coordinates: { lat: 35.6764, lng: 139.6993 },
              startLocal: "09:30",
              endLocal: "11:00",
              durationMin: 75,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
          ],
        },
      ];

      const allPlaces = [
        {
          id: "tokyo_national_museum",
          name: "Tokyo National Museum",
          description: "Indoor art and history exhibits",
          address: "Ueno",
          coordinates: { lat: 35.7188, lng: 139.7765 },
          types: ["museum", "art_gallery"],
          estimatedDurationMin: 120,
          fetchedAt: new Date().toISOString(),
          provider: "test",
        },
        {
          id: "tokyo_teamlab",
          name: "teamLab Planets",
          description: "Immersive indoor digital art museum",
          address: "Toyosu",
          coordinates: { lat: 35.6491, lng: 139.7898 },
          types: ["museum"],
          estimatedDurationMin: 90,
          fetchedAt: new Date().toISOString(),
          provider: "test",
        },
      ];

      const state: Partial<TravelState> = {
        routeResult: {
          days: initialDays,
          unplacedPlaces: [],
          totalDistanceMeters: 10000,
          totalTravelTimeMin: 75,
        },
        placesResult: allPlaces,
        validationReport: {
          isValid: false,
          hasBlockers: true,
          issues: [
            {
              code: "WEATHER_RAIN_CONFLICT",
              severity: "BLOCKER",
              dayNumber: 2,
              message: "Day 2 has rain conflict",
            },
          ],
          warnings: [],
          passedChecks: [],
        },
        replanCount: 0,
        request: tripPayload,
        warnings: [],
      };

      const replanResult: any = await replanNode(state as TravelState);

      expect(replanResult.replanCount).toBe(1);
      expect(replanResult.replanPatch?.affectedDayNumbers).toEqual([2]);
      expect(replanResult.replanPatch?.preservedDayNumbers).toEqual([1, 3]);

      // Verify Day 1 and Day 3 were preserved exactly
      const days = replanResult.routeResult!.days;
      expect(days[0].stops[0].name).toBe("Senso-ji Temple");
      expect(days[2].stops[0].name).toBe("Meiji Jingu Shrine");

      // Verify Day 2 was replaced with indoor museum/art
      expect(days[1].theme).toContain("Rain-Adapted");
      const hasIndoor = days[1].stops.some(
        (s: any) => s.name.includes("Museum") || s.name.includes("teamLab")
      );
      expect(hasIndoor).toBe(true);
    });
  });

  describe("Bounded Replanning Loop (Max 2 Passes)", () => {
    it("halts replanning loop after 2 passes and outputs final plan", async () => {
      const graph = createPlanningGraph();

      // Trigger run with a persistent replan instruction
      const finalState = await graph.invoke(
        {
          runId: "run_bounded_loop",
          tripId: tripId,
          userId: userId,
          request: tripPayload,
          replanRequest: {
            instruction: "Simulated disruption",
            disruptionType: "weather_rain",
            affectedDayNumber: 2,
          },
          status: "running",
          warnings: [],
        },
        {
          configurable: { thread_id: "thread_bounded_loop" },
        }
      );

      // Replan count must be bounded at <= 2
      expect(finalState.replanCount).toBeLessThanOrEqual(2);
      expect(finalState.status).toBe("completed");
      expect(finalState.finalResponse).toBeDefined();
    });
  });

  describe("Phase 6 Exit Condition: 'Rain tomorrow' creates a new version", () => {
    it("revises itinerary upon 'Rain tomorrow' request and creates Version 3 with audit lineage", async () => {
      // 1. Initial Plan (Creates Version 2)
      await request(app)
        .post(`/api/v1/trips/${tripId}/plan?sync=true`)
        .set("Authorization", `Bearer ${userToken}`);

      const tripAfterV2 = await TripModel.findById(tripId);
      expect(tripAfterV2?.currentVersionNo).toBe(2);

      // 2. User requests replan: "Rain tomorrow; make it indoor-friendly"
      const replanRes = await request(app)
        .post(`/api/v1/trips/${tripId}/replan?sync=true`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          instruction: "Rain tomorrow; make it indoor-friendly",
          disruptionType: "weather_rain",
          affectedDayNumber: 2,
        });

      expect(replanRes.status).toBe(202);

      // 3. Verify Trip currentVersionNo incremented to 3
      const tripAfterV3 = await TripModel.findById(tripId);
      expect(tripAfterV3?.currentVersionNo).toBe(3);

      // 4. Verify TripVersion history has versions 1, 2, and 3
      const versions = await TripVersionModel.find({ tripId }).sort({ versionNo: 1 });
      expect(versions.length).toBe(3);

      expect(versions[0].versionNo).toBe(1);
      expect(versions[0].changeReason).toContain("Initial trip request");

      expect(versions[1].versionNo).toBe(2);
      expect(versions[1].changeReason).toContain("Planning run generated");

      expect(versions[2].versionNo).toBe(3);
      expect(versions[2].changeReason).toContain("adapted for rain");

      // Verify Day 2 of Version 3 has rain adaptation
      const v3Data: any = versions[2].itineraryData;
      expect(v3Data.itinerary[1].theme).toContain("Rain-Adapted");
    });
  });
});
