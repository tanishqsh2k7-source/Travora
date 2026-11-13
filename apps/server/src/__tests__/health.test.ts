import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("GET /api/health", () => {
  it("responds with JSON containing status and service name", async () => {
    const res = await request(app).get("/api/health");

    // Without a real Mongo connection the status should be degraded
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: "degraded",
      service: "travora-api",
      version: "0.1.0",
      checks: {
        mongo: "disconnected",
      },
    });
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("GET /", () => {
  it("returns a welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Travora API");
  });
});
