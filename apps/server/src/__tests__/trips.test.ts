import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";

const app = createApp();

describe("Trips API (/api/v1/trips)", () => {
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Register User 1
    const res1 = await request(app).post("/api/v1/auth/register").send({
      email: "user1@example.com",
      password: "password123",
      name: "User One",
    });
    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Register User 2
    const res2 = await request(app).post("/api/v1/auth/register").send({
      email: "user2@example.com",
      password: "password123",
      name: "User Two",
    });
    user2Token = res2.body.token;
    user2Id = res2.body.user.id;
  });

  const validTripPayload = {
    origin: "Delhi, India",
    destination: "Tokyo, Japan",
    startDate: "2027-04-10",
    endDate: "2027-04-16",
    timezone: "Asia/Tokyo",
    travellers: { adults: 2, children: 0, infants: 0 },
    budget: { amount: 22000000, currency: "INR", flexibilityPct: 5 },
    interests: ["food", "anime", "museums"],
    travelStyle: "balanced",
    transportPreferences: ["public_transit"],
    constraints: { accessibility: [], dietary: ["vegetarian"], pace: "moderate" },
  };

  describe("POST /api/v1/trips", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app)
        .post("/api/v1/trips")
        .send(validTripPayload);

      expect(res.status).toBe(401);
    });

    it("rejects invalid dates where start > end with 400", async () => {
      const res = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          ...validTripPayload,
          startDate: "2027-04-20",
          endDate: "2027-04-10",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("creates a trip and returns 201 with populated trip response", async () => {
      const res = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(validTripPayload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.userId).toBe(user1Id);
      expect(res.body.origin).toBe("Delhi, India");
      expect(res.body.destination).toBe("Tokyo, Japan");
      expect(res.body.status).toBe("draft");
      expect(res.body.currentVersionNo).toBe(1);
      expect(res.body.budget).toEqual(validTripPayload.budget);
    });
  });

  describe("GET /api/v1/trips", () => {
    it("returns only the trips owned by the authenticated user", async () => {
      // User 1 creates a trip
      await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(validTripPayload);

      // User 2 creates a trip
      await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          ...validTripPayload,
          destination: "Paris, France",
        });

      // User 1 requests their trips
      const res1 = await request(app)
        .get("/api/v1/trips")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res1.status).toBe(200);
      expect(Array.isArray(res1.body)).toBe(true);
      expect(res1.body.length).toBe(1);
      expect(res1.body[0].destination).toBe("Tokyo, Japan");

      // User 2 requests their trips
      const res2 = await request(app)
        .get("/api/v1/trips")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res2.status).toBe(200);
      expect(res2.body.length).toBe(1);
      expect(res2.body[0].destination).toBe("Paris, France");
    });
  });

  describe("GET /api/v1/trips/:tripId (Ownership checks)", () => {
    let tripIdUser1: string;

    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(validTripPayload);
      tripIdUser1 = res.body.id;
    });

    it("allows the owner to view their trip", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripIdUser1}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tripIdUser1);
      expect(res.body.userId).toBe(user1Id);
    });

    it("denies another user access with 403 Forbidden", async () => {
      const res = await request(app)
        .get(`/api/v1/trips/${tripIdUser1}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Access denied");
    });

    it("returns 404 for a non-existent trip ID", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .get(`/api/v1/trips/${fakeId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Trip not found");
    });

    it("returns 400 for a malformed trip ID", async () => {
      const res = await request(app)
        .get("/api/v1/trips/not-an-id")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid trip ID format");
    });
  });

  describe("GET /api/v1/trips/:tripId/versions", () => {
    it("returns version history for the trip", async () => {
      const createRes = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(validTripPayload);

      const tripId = createRes.body.id;

      const res = await request(app)
        .get(`/api/v1/trips/${tripId}/versions`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].versionNo).toBe(1);
      expect(res.body[0].changeReason).toContain("Initial trip request");
    });
  });

  describe("Preferences API (/api/v1/me/preferences)", () => {
    it("reads and updates user preferences", async () => {
      // Read initial
      const getRes = await request(app)
        .get("/api/v1/me/preferences")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.travelStyle).toBe("balanced");

      // Update
      const patchRes = await request(app)
        .patch("/api/v1/me/preferences")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          travelStyle: "luxury",
          interests: ["fine dining", "art galleries"],
          preferredCurrency: "EUR",
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.travelStyle).toBe("luxury");
      expect(patchRes.body.interests).toEqual(["fine dining", "art galleries"]);
      expect(patchRes.body.preferredCurrency).toBe("EUR");
    });
  });
});

