import { describe, it, expect } from "vitest";
import {
  MoneySchema,
  DateRangeSchema,
  RegisterRequestSchema,
  LoginRequestSchema,
  CreateTripRequestSchema,
} from "../index.js";

describe("Contracts schemas", () => {
  describe("MoneySchema", () => {
    it("accepts valid integer amount and 3-letter currency", () => {
      const valid = { amount: 150000, currency: "USD" };
      expect(MoneySchema.parse(valid)).toEqual(valid);
    });

    it("rejects non-integer amounts", () => {
      expect(() => MoneySchema.parse({ amount: 12.5, currency: "USD" })).toThrow();
    });

    it("rejects negative amounts", () => {
      expect(() => MoneySchema.parse({ amount: -100, currency: "USD" })).toThrow();
    });

    it("rejects invalid currency codes", () => {
      expect(() => MoneySchema.parse({ amount: 100, currency: "US" })).toThrow();
      expect(() => MoneySchema.parse({ amount: 100, currency: "DOLLARS" })).toThrow();
    });
  });

  describe("DateRangeSchema", () => {
    it("accepts valid date order", () => {
      const valid = { startDate: "2027-04-10", endDate: "2027-04-16" };
      expect(DateRangeSchema.parse(valid)).toEqual(valid);
    });

    it("rejects endDate before startDate", () => {
      const invalid = { startDate: "2027-04-20", endDate: "2027-04-10" };
      expect(() => DateRangeSchema.parse(invalid)).toThrow();
    });
  });

  describe("RegisterRequestSchema", () => {
    it("validates valid registration", () => {
      const valid = { email: "Test@Example.com", password: "securepassword", name: "Alice" };
      const parsed = RegisterRequestSchema.parse(valid);
      expect(parsed.email).toBe("test@example.com");
      expect(parsed.password).toBe("securepassword");
      expect(parsed.name).toBe("Alice");
    });

    it("rejects short password", () => {
      expect(() =>
        RegisterRequestSchema.parse({ email: "test@example.com", password: "123" })
      ).toThrow();
    });
  });

  describe("CreateTripRequestSchema", () => {
    it("parses valid trip request with defaults", () => {
      const input = {
        origin: "Delhi, India",
        destination: "Tokyo, Japan",
        startDate: "2027-04-10",
        endDate: "2027-04-16",
        budget: { amount: 22000000, currency: "INR" },
        interests: ["food", "anime"],
      };

      const parsed = CreateTripRequestSchema.parse(input);
      expect(parsed.travellers).toEqual({ adults: 1, children: 0, infants: 0 });
      expect(parsed.travelStyle).toBe("balanced");
      expect(parsed.budget.flexibilityPct).toBe(5);
    });

    it("rejects invalid dates where start is after end", () => {
      const input = {
        origin: "Delhi, India",
        destination: "Tokyo, Japan",
        startDate: "2027-04-20",
        endDate: "2027-04-10",
        budget: { amount: 22000000, currency: "INR" },
      };
      expect(() => CreateTripRequestSchema.parse(input)).toThrow();
    });
  });
});

