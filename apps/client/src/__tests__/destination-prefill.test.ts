import { describe, it, expect } from "vitest";
import { DESTINATIONS } from "../content/destinations.js";

describe("Destination prefill catalog", () => {
  it("contains 8 curated destinations with valid metadata", () => {
    expect(DESTINATIONS).toHaveLength(8);

    for (const dest of DESTINATIONS) {
      expect(dest.slug).toBeTruthy();
      expect(dest.name).toBeTruthy();
      expect(dest.country).toBeTruthy();
      expect(dest.tagline).toBeTruthy();
      expect(dest.suggestedDays).toMatch(/\d+\s*(?:to|-)\s*\d+\s*days/i);
      expect(dest.heroImage).toMatch(/^\/images\/destinations\/.*hero\.jpg$/);
      expect(dest.cardImage).toMatch(/^\/images\/destinations\/.*card\.jpg$/);
      expect(dest.alt.length).toBeGreaterThan(10);
      expect(dest.credit).toBeTruthy();
    }
  });

  it("includes both international and regional destinations", () => {
    const names = DESTINATIONS.map((d) => d.name);
    expect(names).toContain("Lisbon");
    expect(names).toContain("Tokyo");
    expect(names).toContain("Paris");
    expect(names).toContain("Udaipur");
    expect(names).toContain("Jodhpur");
  });
});
