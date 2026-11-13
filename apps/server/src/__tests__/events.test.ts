import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { PlanningRunModel } from "../models/index.js";
import { eventService } from "../services/event-service.js";
import type { CreateTripRequest } from "@travora/contracts";

const app = createApp();

describe("Phase 7: Real-Time SSE Progress Stream", () => {
  let userToken: string;
  let userId: string;
  let intruderToken: string;
  let tripId: string;
  let runId: string;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  const tripPayload: CreateTripRequest = {
    origin: "London, UK",
    destination: "Lisbon, Portugal",
    startDate: "2027-05-10",
    endDate: "2027-05-13",
    timezone: "Europe/Lisbon",
    travellers: { adults: 2, children: 0, infants: 0 },
    budget: { amount: 150000, currency: "EUR", flexibilityPct: 10 },
    interests: ["history", "culture", "food"],
    travelStyle: "balanced",
    transportPreferences: ["public_transit"],
    constraints: { accessibility: [], dietary: [], pace: "moderate" },
  };

  beforeEach(async () => {
    await clearTestDB();

    // Register user
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "sse.user@example.com",
      password: "password123",
      name: "SSE User",
    });
    userToken = res.body.token;
    userId = res.body.user.id;

    // Register intruder
    const intruderRes = await request(app).post("/api/v1/auth/register").send({
      email: "intruder.sse@example.com",
      password: "password123",
      name: "Intruder",
    });
    intruderToken = intruderRes.body.token;

    // Create trip
    const tripRes = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${userToken}`)
      .send(tripPayload);
    tripId = tripRes.body.id;

    // Create planning run with ?sync=true so it completes cleanly
    const planRes = await request(app)
      .post(`/api/v1/trips/${tripId}/plan?sync=true`)
      .set("Authorization", `Bearer ${userToken}`);
    runId = planRes.body.runId;
  });

  it("rejects SSE requests without authentication", async () => {
    const res = await request(app).get(`/api/v1/runs/${runId}/events`);
    expect(res.status).toBe(401);
  });

  it("authenticates via query parameter ?token=... (for EventSource compatibility)", async () => {
    eventService.emitEvent(runId, {
      type: "agent.status",
      stage: "intake",
      progress: 10,
      message: "Testing token query param auth",
    });

    const server = app.listen(0);
    const port = (server.address() as import("net").AddressInfo).port;

    const receivedData = await new Promise<string>((resolve, reject) => {
      const http = require("http");
      const req = http.get(
        `http://127.0.0.1:${port}/api/v1/runs/${runId}/events?token=${userToken}`,
        (res: import("http").IncomingMessage) => {
          expect(res.headers["content-type"]).toContain("text/event-stream");
          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("Testing token query param auth")) {
              req.destroy();
              server.close(() => resolve(data));
            }
          });
        }
      );
      req.on("error", (err: unknown) => {
        server.close();
        reject(err);
      });
    });

    expect(receivedData).toContain("event: agent.status");
    expect(receivedData).toContain("Testing token query param auth");
  });

  it("rejects access if user is not the owner of the run", async () => {
    const res = await request(app)
      .get(`/api/v1/runs/${runId}/events`)
      .set("Authorization", `Bearer ${intruderToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/access denied/i);
  });

  it("replays past event history to newly connected clients", async () => {
    eventService.emitEvent(runId, {
      type: "run.started",
      stage: "intake",
      progress: 10,
      message: "First historical event",
    });
    eventService.emitEvent(runId, {
      type: "agent.status",
      stage: "supervisor",
      progress: 25,
      message: "Second historical event",
    });

    const server = app.listen(0);
    const port = (server.address() as import("net").AddressInfo).port;

    const receivedData = await new Promise<string>((resolve, reject) => {
      const http = require("http");
      const req = http.get(
        `http://127.0.0.1:${port}/api/v1/runs/${runId}/events`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        (res: import("http").IncomingMessage) => {
          expect(res.headers["content-type"]).toContain("text/event-stream");
          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
            if (data.includes("Second historical event")) {
              req.destroy();
              server.close(() => resolve(data));
            }
          });
        }
      );
      req.on("error", (err: unknown) => {
        server.close();
        reject(err);
      });
    });

    expect(receivedData).toContain("event: run.started");
    expect(receivedData).toContain("First historical event");
    expect(receivedData).toContain("event: agent.status");
    expect(receivedData).toContain("Second historical event");
  });
});
