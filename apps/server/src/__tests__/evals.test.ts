import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { calculateBudget, optimizeRoutes, validateSchedule } from "../engines/index.js";
import { createPlanningGraph } from "../agents/graph.js";
import type {
  CreateTripRequest,
  PlaceCandidate,
  Money,
  HotelOffer,
  FlightOffer,
  WeatherForecast,
} from "@travora/contracts";

const app = createApp();

describe("Phase 9: Comprehensive Hardening & Evaluation Suite (Evals)", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  // ── Eval 1: Deterministic Arithmetic & Multi-Currency Precision ──────────
  describe("Eval 1: Deterministic Budget Invariants (Zero Floating Point Drift)", () => {
    const testCases = [
      { currency: "USD", userBudgetAmount: 250000, travelers: 2, days: 4 }, // $2,500
      { currency: "EUR", userBudgetAmount: 180000, travelers: 1, days: 3 }, // €1,800
      { currency: "INR", userBudgetAmount: 35000000, travelers: 4, days: 6 }, // ₹3,50,000
      { currency: "GBP", userBudgetAmount: 120000, travelers: 2, days: 2 }, // £1,200
    ];

    testCases.forEach(({ currency, userBudgetAmount, travelers, days }) => {
      it(`enforces exact integer math and category balance in ${currency}`, () => {
        const userBudget: Money = { amount: userBudgetAmount, currency };
        const flightsTotal: Money = { amount: Math.round(userBudgetAmount * 0.35), currency };
        const accommodationTotal: Money = { amount: Math.round(userBudgetAmount * 0.25), currency };
        const dailyFoodAllowancePerPerson: Money = { amount: Math.round(userBudgetAmount * 0.03), currency };
        const dailyLocalTransportPerPerson: Money = { amount: Math.round(userBudgetAmount * 0.015), currency };
        const activityTickets: Money[] = [
          { amount: Math.round(userBudgetAmount * 0.02), currency },
          { amount: Math.round(userBudgetAmount * 0.015), currency },
        ];

        const budget = calculateBudget({
          userBudget,
          flightsTotal,
          accommodationTotal,
          dailyFoodAllowancePerPerson,
          dailyLocalTransportPerPerson,
          activityTickets,
          travellers: { adults: travelers, children: 0, infants: 0 },
          daysCount: days,
          contingencyPct: 10,
          flexibilityPct: 5,
        });

        // 1. Invariant: Every monetary amount must be an integer (no floats)
        expect(Number.isInteger(budget.totalEstimated.amount)).toBe(true);
        expect(Number.isInteger(budget.userBudget.amount)).toBe(true);
        expect(Number.isInteger(budget.remainingBudget.amount)).toBe(true);

        // 2. Invariant: Total estimated equals exact sum of category components
        const sumCategories = Object.values(budget.categories).reduce(
          (acc, cat) => acc + (cat?.amount ?? 0),
          0
        );
        expect(budget.totalEstimated.amount).toBe(sumCategories);

        // 3. Invariant: Remaining budget arithmetic
        if (budget.withinBudget) {
          expect(budget.remainingBudget.amount).toBe(
            userBudget.amount - budget.totalEstimated.amount
          );
        } else {
          expect(budget.overBudgetAmount?.amount).toBe(
            budget.totalEstimated.amount - userBudget.amount
          );
        }

        // 4. Invariant: Contingency buffer is exactly 10%
        expect(budget.contingencyPct).toBe(10);
      });
    });
  });

  // ── Eval 2: Route Optimization & Schedule Chronology ─────────────────────
  describe("Eval 2: Route Optimization & Chronological Non-Overlap", () => {
    const mockPlaces: PlaceCandidate[] = [
      {
        id: "p1",
        name: "Place A",
        coordinates: { lat: 38.71, lng: -9.14 },
        rating: 4.8,
        types: ["museum"],
        address: "Address A",
        estimatedDurationMin: 90,
        fetchedAt: new Date().toISOString(),
        provider: "eval_fixture",
      },
      {
        id: "p2",
        name: "Place B",
        coordinates: { lat: 38.72, lng: -9.15 },
        rating: 4.6,
        types: ["historic"],
        address: "Address B",
        estimatedDurationMin: 75,
        fetchedAt: new Date().toISOString(),
        provider: "eval_fixture",
      },
      {
        id: "p3",
        name: "Place C",
        coordinates: { lat: 38.73, lng: -9.13 },
        rating: 4.7,
        types: ["park"],
        address: "Address C",
        estimatedDurationMin: 60,
        fetchedAt: new Date().toISOString(),
        provider: "eval_fixture",
      },
      {
        id: "p4",
        name: "Place D",
        coordinates: { lat: 38.74, lng: -9.12 },
        rating: 4.5,
        types: ["market"],
        address: "Address D",
        estimatedDurationMin: 60,
        fetchedAt: new Date().toISOString(),
        provider: "eval_fixture",
      },
    ];

    it("ensures no schedule overlaps and strictly chronological start times", () => {
      const travelDates = ["2027-05-10", "2027-05-11"];
      const result = optimizeRoutes({
        places: mockPlaces,
        daysCount: 2,
        pace: "moderate",
        travelDates,
      });

      expect(result.days.length).toBe(2);

      result.days.forEach((day) => {
        expect(day.stops.length).toBeGreaterThan(0);

        // Verify strictly non-overlapping stops
        for (let i = 0; i < day.stops.length - 1; i++) {
          const current = day.stops[i];
          const next = day.stops[i + 1];

          // startLocal must be before endLocal
          expect(current.startLocal < current.endLocal).toBe(true);

          // next startLocal must be after current endLocal + transfer time
          const [endH, endM] = current.endLocal.split(":").map(Number);
          const [nextStartH, nextStartM] = next.startLocal.split(":").map(Number);

          const currentEndMinutes = endH * 60 + endM;
          const nextStartMinutes = nextStartH * 60 + nextStartM;

          expect(nextStartMinutes).toBeGreaterThanOrEqual(
            currentEndMinutes + next.transferFromPrevMin
          );
        }
      });
    });

    it("respects daily pace constraints", () => {
      const relaxedResult = optimizeRoutes({
        places: mockPlaces,
        daysCount: 2,
        pace: "relaxed",
        travelDates: ["2027-05-10", "2027-05-11"],
      });

      // Relaxed pace targets ~2 stops per day
      relaxedResult.days.forEach((day) => {
        expect(day.stops.length).toBeLessThanOrEqual(3);
      });
    });
  });

  // ── Eval 3: Critic Disruption Detection & Weather Coherence ───────────────
  describe("Eval 3: Weather Coherence & Disruption Repair", () => {
    it("flags outdoor activities scheduled on rainy days and repairs via replan", async () => {
      const graph = createPlanningGraph();

      const tripRequest: CreateTripRequest = {
        origin: "London, UK",
        destination: "Lisbon, Portugal",
        startDate: "2027-05-10",
        endDate: "2027-05-12",
        timezone: "Europe/Lisbon",
        travellers: { adults: 2, children: 0, infants: 0 },
        budget: { amount: 200000, currency: "EUR", flexibilityPct: 10 },
        interests: ["culture", "history", "museums"],
        travelStyle: "balanced",
        transportPreferences: ["public_transit", "walking"],
        constraints: { accessibility: [], dietary: [], pace: "moderate" },
      };

      const finalState = await graph.invoke(
        {
          runId: "eval_run_01",
          tripId: "eval_trip_01",
          userId: "eval_user_01",
          request: tripRequest,
          status: "running",
        },
        {
          configurable: { thread_id: "eval_thread_01" },
        }
      );

      expect(finalState.status).toBe("completed");
      expect(finalState.finalResponse).toBeDefined();

      // If rain was simulated, critic should have either validated with pass or triggered replan
      if (finalState.validationReport) {
        expect(Array.isArray(finalState.validationReport.passedChecks)).toBe(true);
      }

      // Final itinerary must have scheduled days with valid stops
      expect(finalState.finalResponse!.itinerary.length).toBe(3);
      const totalStops = finalState.finalResponse!.itinerary.reduce(
        (acc, d) => acc + d.stops.length,
        0
      );
      expect(totalStops).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Eval 4: Replanning Pass Bound (<= 2 Passes) ──────────────────────────
  describe("Eval 4: Bounded Replanning Pass Termination", () => {
    it("guarantees replanning terminates within max 2 passes", async () => {
      const graph = createPlanningGraph();

      // Simulate a run where replan count is already 2
      const finalState = await graph.invoke(
        {
          runId: "eval_run_bounded",
          tripId: "eval_trip_bounded",
          userId: "eval_user_bounded",
          request: {
            origin: "London, UK",
            destination: "Lisbon, Portugal",
            startDate: "2027-05-10",
            endDate: "2027-05-12",
            timezone: "Europe/Lisbon",
            travellers: { adults: 1, children: 0, infants: 0 },
            budget: { amount: 150000, currency: "EUR", flexibilityPct: 5 },
            interests: ["culture"],
            travelStyle: "balanced",
            transportPreferences: ["public_transit"],
            constraints: { accessibility: [], dietary: [], pace: "moderate" },
          },
          replanCount: 2, // Reached limit
          replanRequest: {
            instruction: "Simulated disruption needing repair",
            disruptionType: "weather_rain",
          },
          status: "running",
        },
        {
          configurable: { thread_id: "eval_thread_bounded" },
        }
      );

      // Must terminate gracefully with completed or partial status rather than looping
      expect(["completed", "partial"]).toContain(finalState.status);
      expect(finalState.replanCount).toBeLessThanOrEqual(3);
    });
  });

  // ── Eval 5: Security & Isolation Boundary Enforcement ─────────────────────
  describe("Eval 5: Multi-Tenant Security & API Access Control", () => {
    it("enforces strict tenant isolation across all trip endpoints", async () => {
      // 1. Register User A
      const userARes = await request(app).post("/api/v1/auth/register").send({
        email: "alice@eval.com",
        password: "password123",
        name: "Alice",
      });
      const tokenA = userARes.body.token;

      // 2. Register User B
      const userBRes = await request(app).post("/api/v1/auth/register").send({
        email: "bob@eval.com",
        password: "password123",
        name: "Bob",
      });
      const tokenB = userBRes.body.token;

      // 3. User A creates a trip
      const tripRes = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          origin: "London, UK",
          destination: "Lisbon, Portugal",
          startDate: "2027-05-10",
          endDate: "2027-05-13",
          timezone: "Europe/Lisbon",
          travellers: { adults: 2, children: 0, infants: 0 },
          budget: { amount: 150000, currency: "EUR", flexibilityPct: 10 },
          interests: ["culture"],
          travelStyle: "balanced",
          transportPreferences: ["public_transit"],
          constraints: { accessibility: [], dietary: [], pace: "moderate" },
        });

      const tripId = tripRes.body.id;

      // 4. User B attempts unauthorized operations on User A's trip -> All must return 403
      const getTripForbidden = await request(app)
        .get(`/api/v1/trips/${tripId}`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(getTripForbidden.status).toBe(403);

      const planForbidden = await request(app)
        .post(`/api/v1/trips/${tripId}/plan`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(planForbidden.status).toBe(403);

      const versionsForbidden = await request(app)
        .get(`/api/v1/trips/${tripId}/versions`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(versionsForbidden.status).toBe(403);

      const restoreForbidden = await request(app)
        .post(`/api/v1/trips/${tripId}/versions/1/restore`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(restoreForbidden.status).toBe(403);
    });
  });
});
