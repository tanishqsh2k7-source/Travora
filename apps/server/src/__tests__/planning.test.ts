import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { createPlanningGraph } from "../agents/graph.js";
import { TripModel, TripVersionModel } from "../models/index.js";
import type { CreateTripRequest, UserPreferences } from "@travora/contracts";

const app = createApp();

describe("Phase 4: First LangGraph Slice", () => {
  let userToken: string;
  let userId: string;
  let intruderToken: string;
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
    endDate: "2027-04-15", // 6 days
    timezone: "Asia/Tokyo",
    travellers: { adults: 2, children: 0, infants: 0 },
    budget: { amount: 22000000, currency: "INR", flexibilityPct: 5 },
    interests: ["food", "anime", "museums"],
    travelStyle: "balanced",
    transportPreferences: ["public_transit"],
    constraints: { accessibility: [], dietary: ["vegetarian"], pace: "moderate" },
  };

  beforeEach(async () => {
    await clearTestDB();

    // Register primary user
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "traveler@example.com",
      password: "password123",
      name: "Traveler",
    });
    userToken = res.body.token;
    userId = res.body.user.id;

    // Register intruder user
    const intruderRes = await request(app).post("/api/v1/auth/register").send({
      email: "intruder@example.com",
      password: "password123",
      name: "Intruder",
    });
    intruderToken = intruderRes.body.token;

    // Create a trip for primary user
    const tripRes = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${userToken}`)
      .send(tripPayload);

    tripId = tripRes.body.id;
  });

  describe("LangGraph StateGraph Unit Test", () => {
    it("executes the planning graph end-to-end on fixtures", async () => {
      const graph = createPlanningGraph();

      const preferences: UserPreferences = {
        interests: ["food", "anime", "museums"],
        travelStyle: "balanced",
        pace: "moderate",
        dietaryRestrictions: ["vegetarian"],
        accessibilityRequirements: [],
        preferredCurrency: "INR",
        transportPreferences: ["public_transit"],
      };

      const finalState = await graph.invoke(
        {
          runId: "run_test_001",
          tripId: tripId,
          userId: userId,
          request: tripPayload,
          preferences,
          status: "running",
          warnings: [],
        },
        {
          configurable: { thread_id: "thread_test_001" },
        }
      );

      expect(finalState.status).toBe("completed");
      expect(finalState.placesResult?.length).toBeGreaterThan(0);
      expect(finalState.flightsResult?.length).toBeGreaterThan(0);
      expect(finalState.hotelsResult?.length).toBeGreaterThan(0);
      expect(finalState.weatherResult?.daily.length).toBe(6);
      expect(finalState.routeResult?.days.length).toBe(6);
      expect(finalState.budgetResult).toBeDefined();
      expect(finalState.budgetResult?.totalEstimated.amount).toBeGreaterThan(0);

      const final = finalState.finalResponse;
      expect(final).toBeDefined();
      expect(final?.destination).toBe("Tokyo, Japan");
      expect(final?.dates.totalDays).toBe(6);
      expect(final?.itinerary.length).toBe(6);
      expect(final?.sources.length).toBe(5);
    });
  });

  describe("Planning API endpoints", () => {
    it("enforces authentication and ownership on POST /trips/:tripId/plan", async () => {
      // 1. Unauthenticated
      const unauth = await request(app).post(`/api/v1/trips/${tripId}/plan`);
      expect(unauth.status).toBe(401);

      // 2. Intruder user
      const forbidden = await request(app)
        .post(`/api/v1/trips/${tripId}/plan`)
        .set("Authorization", `Bearer ${intruderToken}`);
      expect(forbidden.status).toBe(403);

      // 3. Invalid trip ID
      const badId = await request(app)
        .post("/api/v1/trips/invalid-id/plan")
        .set("Authorization", `Bearer ${userToken}`);
      expect(badId.status).toBe(400);
    });

    it("starts a run, executes the graph, and saves trip version 2", async () => {
      // Start planning run
      const postRes = await request(app)
        .post(`/api/v1/trips/${tripId}/plan`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(postRes.status).toBe(202);
      expect(postRes.body.runId).toBeDefined();
      expect(postRes.body.status).toBe("queued");
      expect(postRes.body.eventsUrl).toContain(postRes.body.runId);

      const runId = postRes.body.runId;

      // Poll until the async background run completes (runs fast on fixtures)
      let completedRun: any = null;
      for (let i = 0; i < 20; i++) {
        const getRes = await request(app)
          .get(`/api/v1/runs/${runId}`)
          .set("Authorization", `Bearer ${userToken}`);

        expect(getRes.status).toBe(200);

        if (getRes.body.status === "completed") {
          completedRun = getRes.body;
          break;
        }

        await new Promise((r) => setTimeout(r, 200));
      }

      expect(completedRun).not.toBeNull();
      expect(completedRun.status).toBe("completed");
      expect(completedRun.progressPct).toBe(100);
      expect(completedRun.result).toBeDefined();
      expect(completedRun.result.destination).toBe("Tokyo, Japan");
      expect(completedRun.result.itinerary.length).toBe(6);
      expect(completedRun.result.budgetBreakdown.withinBudget).toBe(true);

      // Verify that Trip status was updated to 'planned' and version incremented to 2
      const updatedTrip = await TripModel.findById(tripId);
      expect(updatedTrip?.status).toBe("planned");
      expect(updatedTrip?.currentVersionNo).toBe(2);

      // Verify TripVersionModel has version 2
      const version2 = await TripVersionModel.findOne({ tripId, versionNo: 2 });
      expect(version2).not.toBeNull();
      expect(version2?.changeReason).toContain("Planning run generated");
    });

    it("lists historical planning runs on GET /trips/:tripId/runs", async () => {
      // Start a run
      const postRes = await request(app)
        .post(`/api/v1/trips/${tripId}/plan`)
        .set("Authorization", `Bearer ${userToken}`);

      const listRes = await request(app)
        .get(`/api/v1/trips/${tripId}/runs`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body[0].tripId).toBe(tripId);
    });
  });
});
