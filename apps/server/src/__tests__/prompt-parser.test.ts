import { describe, it, expect } from "vitest";
import { parseTripPrompt } from "../services/prompt-parser.js";

describe("Natural Language Trip Prompt Parser", () => {
  it("parses prompt with destination and headcount", async () => {
    const result = await parseTripPrompt("plan atrip for me to paris with 2people");
    expect(result.tripRequest.destination).toContain("Paris");
    expect(result.tripRequest.travellers.adults).toBe(2);
    expect(result.tripRequest.budget.amount).toBeGreaterThan(0);
    expect(result.tripRequest.startDate).toBeDefined();
    expect(result.tripRequest.endDate).toBeDefined();
  });

  it("parses prompt with Udaipur, 5 days, and 2 travellers", async () => {
    const result = await parseTripPrompt("5 days luxury trip to Udaipur & Jodhpur for 2");
    expect(result.tripRequest.destination).toContain("Udaipur");
    expect(result.tripRequest.travellers.adults).toBe(2);
    expect(result.tripRequest.travelStyle).toBe("luxury");
    expect(result.tripRequest.budget.currency).toBe("INR");
  });

  it("parses budget amount and currency correctly", async () => {
    const result = await parseTripPrompt("Weekend getaway to Lisbon under €1500 for a couple");
    expect(result.tripRequest.destination).toContain("Lisbon");
    expect(result.tripRequest.budget.currency).toBe("EUR");
    expect(result.tripRequest.budget.amount).toBe(150000);
    expect(result.tripRequest.travellers.adults).toBe(2);
  });
});
