import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";

const app = createApp();

describe("Auth API (/api/v1/auth)", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe("POST /register", () => {
    it("registers a new user and returns JWT + user info", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: "alice@example.com",
          password: "password123",
          name: "Alice",
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        email: "alice@example.com",
        name: "Alice",
      });
      expect(res.body.user.id).toBeDefined();
    });

    it("rejects duplicate email with 409 Conflict", async () => {
      await request(app).post("/api/v1/auth/register").send({
        email: "alice@example.com",
        password: "password123",
      });

      const res = await request(app).post("/api/v1/auth/register").send({
        email: "alice@example.com",
        password: "anotherpassword",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("already registered");
    });

    it("rejects invalid payload with 400 and validation details", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "not-an-email",
        password: "123", // too short (<6)
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
      expect(res.body.details).toBeInstanceOf(Array);
      expect(res.body.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("POST /login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send({
        email: "bob@example.com",
        password: "secretpassword",
        name: "Bob",
      });
    });

    it("logs in successfully with valid credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "bob@example.com",
        password: "secretpassword",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("bob@example.com");
    });

    it("rejects incorrect password with 401", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "bob@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Invalid email or password");
    });

    it("rejects non-existent email with 401", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "unknown@example.com",
        password: "secretpassword",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /me", () => {
    it("returns 401 when token is missing", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    it("returns current user profile and preferences when authenticated", async () => {
      const regRes = await request(app).post("/api/v1/auth/register").send({
        email: "charlie@example.com",
        password: "mypassword",
        name: "Charlie",
      });

      const token = regRes.body.token;

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("charlie@example.com");
      expect(res.body.preferences).toBeDefined();
      expect(res.body.preferences.travelStyle).toBe("balanced");
    });
  });
});

