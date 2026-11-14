import { describe, it, expect } from "vitest";
import {
  addMoney,
  subtractMoney,
  multiplyMoney,
  sumMoney,
  percentageOf,
  compareMoney,
  convertCurrency,
  formatMoney,
  calculateBudget,
  optimizeRoutes,
  validateSchedule,
} from "../engines/index.js";
import type { PlaceCandidate, OptimizedDaySchedule, HotelOffer } from "@travora/contracts";

describe("Phase 3: Deterministic Engines", () => {
  describe("Currency & Exact Money Service", () => {
    it("avoids floating-point errors (e.g. 0.1 + 0.2 precision)", () => {
      // 10 cents + 20 cents = 30 cents exact
      const a = { amount: 10, currency: "USD" };
      const b = { amount: 20, currency: "USD" };
      const sum = addMoney(a, b);
      expect(sum.amount).toBe(30);
    });

    it("adds and subtracts money cleanly in smallest unit", () => {
      const a = { amount: 22000000, currency: "INR" };
      const b = { amount: 6500000, currency: "INR" };
      const sum = addMoney(a, b);
      expect(sum.amount).toBe(28500000);

      const diff = subtractMoney(a, b);
      expect(diff.amount).toBe(15500000);
    });

    it("multiplies money by factors and rounds safely", () => {
      const price = { amount: 14500, currency: "USD" };
      const multiplied = multiplyMoney(price, 3);
      expect(multiplied.amount).toBe(43500);
    });

    it("sums an array of money values", () => {
      const items = [
        { amount: 1000, currency: "EUR" },
        { amount: 2500, currency: "EUR" },
        { amount: 500, currency: "EUR" },
      ];
      const total = sumMoney(items);
      expect(total.amount).toBe(4000);
      expect(total.currency).toBe("EUR");
    });

    it("computes exact percentage", () => {
      const base = { amount: 100000, currency: "USD" }; // $1000.00
      const pct = percentageOf(base, 10); // 10%
      expect(pct.amount).toBe(10000);
    });

    it("compares money values correctly", () => {
      const a = { amount: 5000, currency: "USD" };
      const b = { amount: 7000, currency: "USD" };
      expect(compareMoney(a, b)).toBe(-1);
      expect(compareMoney(b, a)).toBe(1);
      expect(compareMoney(a, a)).toBe(0);
    });

    it("converts currency with exact decimal rates", () => {
      const usd = { amount: 10000, currency: "USD" }; // $100.00
      const inr = convertCurrency(usd, "INR", 85);
      expect(inr.amount).toBe(850000);
      expect(inr.currency).toBe("INR");
    });

    it("formats money nicely for human display", () => {
      const m = { amount: 22000000, currency: "INR" };
      expect(formatMoney(m)).toBe("INR 220000.00");
    });

    it("throws on currency mismatch", () => {
      const inr = { amount: 100, currency: "INR" };
      const usd = { amount: 100, currency: "USD" };
      expect(() => addMoney(inr, usd)).toThrow("Cannot add money with different currencies");
      expect(() => subtractMoney(inr, usd)).toThrow("Cannot subtract money with different currencies");
      expect(() => compareMoney(inr, usd)).toThrow("Cannot compare money with different currencies");
    });
  });

  describe("Budget Engine", () => {
    it("calculates realistic budget for a 6-day Tokyo trip within limits", () => {
      // 2 adults, 6 days, budget ₹2,20,000 (22,000,000 paise)
      const breakdown = calculateBudget({
        userBudget: { amount: 22000000, currency: "INR" },
        flexibilityPct: 5,
        flightsTotal: { amount: 11000000, currency: "INR" }, // ₹1,10,000
        accommodationTotal: { amount: 5400000, currency: "INR" }, // ₹54,000
        dailyFoodAllowancePerPerson: { amount: 150000, currency: "INR" }, // ₹1,500/day
        dailyLocalTransportPerPerson: { amount: 50000, currency: "INR" }, // ₹500/day
        activityTickets: [
          { amount: 400000, currency: "INR" },
          { amount: 300000, currency: "INR" },
        ], // ₹7,000
        travellers: { adults: 2, children: 0, infants: 0 },
        daysCount: 6,
        contingencyPct: 5,
      });

      // Food = 1500 * 2 * 6 = 18,000 (1,800,000 paise)
      expect(breakdown.categories.food!.amount).toBe(1800000);
      // Transport = 500 * 2 * 6 = 6,000 (600,000 paise)
      expect(breakdown.categories.local_transport!.amount).toBe(600000);
      // Activities = 7,000 (700,000 paise)
      expect(breakdown.categories.activities!.amount).toBe(700000);

      // Subtotal = 110,000 + 54,000 + 18,000 + 6,000 + 7,000 = 195,000 (19,500,000 paise)
      // Contingency 5% = 9,750 (975,000 paise)
      // Total = 204,750 (20,475,000 paise)
      expect(breakdown.totalEstimated.amount).toBe(20475000);
      expect(breakdown.withinBudget).toBe(true);
      expect(breakdown.remainingBudget.amount).toBe(1525000); // positive remaining

      // Check category breakdown sum ~100%
      const totalPct = breakdown.breakdown.reduce((s, c) => s + c.percentage, 0);
      expect(totalPct).toBeGreaterThanOrEqual(99.5);
      expect(totalPct).toBeLessThanOrEqual(100.5);
    });

    it("detects over-budget scenario and generates actionable alternatives", () => {
      const breakdown = calculateBudget({
        userBudget: { amount: 10000000, currency: "INR" }, // ₹1,00,000
        flexibilityPct: 5,
        flightsTotal: { amount: 8000000, currency: "INR" }, // ₹80,000
        accommodationTotal: { amount: 4500000, currency: "INR" }, // ₹45,000
        dailyFoodAllowancePerPerson: { amount: 150000, currency: "INR" },
        dailyLocalTransportPerPerson: { amount: 50000, currency: "INR" },
        activityTickets: [],
        travellers: { adults: 1, children: 0, infants: 0 },
        daysCount: 5,
        contingencyPct: 10,
        flightAlternatives: [
          {
            description: "Choose 1-stop flight via Malaysia Airlines",
            price: { amount: 5500000, currency: "INR" }, // saves ₹25,000
          },
        ],
        hotelAlternatives: [
          {
            description: "Stay in Smart Pod capsule hotel instead of 4-star",
            price: { amount: 2200000, currency: "INR" }, // saves ₹23,000
          },
        ],
      });

      expect(breakdown.withinBudget).toBe(false);
      expect(breakdown.overBudgetAmount).toBeDefined();
      expect(breakdown.overBudgetAmount!.amount).toBeGreaterThan(0);
      expect(breakdown.warnings.length).toBeGreaterThan(0);

      // Alternatives must contain potential savings
      expect(breakdown.alternatives.length).toBe(2);
      expect(breakdown.alternatives[0].potentialSavings.amount).toBe(2500000); // ₹25,000
      expect(breakdown.alternatives[1].potentialSavings.amount).toBe(2300000); // ₹23,000
    });
  });

  describe("Route Optimizer Engine", () => {
    const samplePlaces: PlaceCandidate[] = [
      {
        id: "place_sensoji",
        name: "Senso-ji Temple",
        address: "Asakusa, Tokyo",
        coordinates: { lat: 35.7148, lng: 139.7967 },
        types: ["historical"],
        estimatedDurationMin: 90,
        fetchedAt: new Date().toISOString(),
        provider: "test",
      },
      {
        id: "place_tokyo_museum",
        name: "Tokyo National Museum",
        address: "Ueno Park, Tokyo",
        coordinates: { lat: 35.7188, lng: 139.7765 }, // Near Senso-ji
        types: ["museum"],
        estimatedDurationMin: 90,
        fetchedAt: new Date().toISOString(),
        provider: "test",
      },
      {
        id: "place_meiji",
        name: "Meiji Jingu Shrine",
        address: "Shibuya, Tokyo",
        coordinates: { lat: 35.6764, lng: 139.6993 }, // Near Shibuya
        types: ["nature"],
        estimatedDurationMin: 75,
        fetchedAt: new Date().toISOString(),
        provider: "test",
      },
      {
        id: "place_shibuya_sky",
        name: "SHIBUYA SKY",
        address: "Shibuya, Tokyo",
        coordinates: { lat: 35.6585, lng: 139.7023 }, // Near Meiji
        types: ["viewpoint"],
        estimatedDurationMin: 60,
        fetchedAt: new Date().toISOString(),
        provider: "test",
      },
    ];

    it("clusters and orders stops geographically into separate days", () => {
      const hotelCoords = { lat: 35.6953, lng: 139.7022 }; // Shinjuku

      const result = optimizeRoutes({
        places: samplePlaces,
        daysCount: 2,
        pace: "moderate",
        travelDates: ["2027-04-10", "2027-04-11"],
        hotelCoordinates: hotelCoords,
      });

      expect(result.days.length).toBe(2);
      expect(result.totalDistanceMeters).toBeGreaterThan(0);
      expect(result.totalTravelTimeMin).toBeGreaterThan(0);

      // Verify each day has stops and times are strictly sequential
      for (const day of result.days) {
        expect(day.stops.length).toBeGreaterThan(0);

        for (let i = 0; i < day.stops.length - 1; i++) {
          const current = day.stops[i];
          const next = day.stops[i + 1];
          // End time of current must be <= start time of next
          expect(current.endLocal <= next.startLocal).toBe(true);
        }
      }
    });

    it("schedules a lunch break when day spans across midday", () => {
      const result = optimizeRoutes({
        places: samplePlaces,
        daysCount: 1, // All 4 stops in 1 day
        pace: "fast",
        travelDates: ["2027-04-10"],
        dayStartTime: "09:00",
        dayEndTime: "19:00",
      });

      const day1 = result.days[0];
      const mealStop = day1.stops.find((s) => s.type === "meal");
      expect(mealStop).toBeDefined();
      expect(mealStop?.name).toContain("Lunch");
    });

    it("schedules dynamic daily accommodation, hotel switch, and lodging stops for multi-city / 5-day trips", () => {
      const mockHotels: HotelOffer[] = [
        {
          id: "hotel_tokyo_shinjuku",
          name: "Park Hyatt Tokyo",
          address: "3-7-1-2 Nishi-Shinjuku, Shinjuku City, Tokyo",
          coordinates: { lat: 35.685, lng: 139.691 },
          pricePerNight: { amount: 35000, currency: "USD" },
          totalPrice: { amount: 105000, currency: "USD" },
          nights: 3,
          amenities: ["WiFi", "Pool"],
          cancellationPolicy: "Free cancellation",
          rating: 4.8,
          hotelStyle: "luxury",
          provider: "booking_com",
          fetchedAt: "2027-04-10T00:00:00Z",
        },
        {
          id: "hotel_tokyo_ginza",
          name: "The Tokyo Edition Ginza",
          address: "2-8-13 Ginza, Chuo City, Tokyo",
          coordinates: { lat: 35.672, lng: 139.768 },
          pricePerNight: { amount: 42000, currency: "USD" },
          totalPrice: { amount: 84000, currency: "USD" },
          nights: 2,
          amenities: ["WiFi", "Spa"],
          cancellationPolicy: "Free cancellation",
          rating: 4.9,
          hotelStyle: "luxury",
          provider: "liteapi",
          fetchedAt: "2027-04-10T00:00:00Z",
        },
      ];

      const result = optimizeRoutes({
        places: samplePlaces,
        daysCount: 5,
        pace: "moderate",
        travelDates: ["2027-04-10", "2027-04-11", "2027-04-12", "2027-04-13", "2027-04-14"],
        hotels: mockHotels,
      });

      expect(result.days.length).toBe(5);

      // Day 1: Check-in at Hotel 1
      const day1 = result.days[0];
      expect(day1.accommodation).toBeDefined();
      expect(day1.accommodation?.status).toBe("check_in");
      expect(day1.accommodation?.name).toBe("Park Hyatt Tokyo");
      const checkinStop = day1.stops.find((s) => s.type === "lodging");
      expect(checkinStop).toBeDefined();
      expect(checkinStop?.name).toContain("Hotel Check-in");

      // Day 2 & 3: Staying at Hotel 1
      expect(result.days[1].accommodation?.status).toBe("staying");
      expect(result.days[1].accommodation?.name).toBe("Park Hyatt Tokyo");
      expect(result.days[2].accommodation?.status).toBe("staying");
      expect(result.days[2].accommodation?.name).toBe("Park Hyatt Tokyo");

      // Day 4: Switch Hotel to Ginza base
      const day4 = result.days[3];
      expect(day4.accommodation?.status).toBe("switch_hotel");
      expect(day4.accommodation?.name).toBe("The Tokyo Edition Ginza");
      const switchStop = day4.stops.find((s) => s.type === "lodging");
      expect(switchStop).toBeDefined();
      expect(switchStop?.name).toContain("Hotel Switch");

      // Day 5: Final Check-out from Ginza base
      const day5 = result.days[4];
      expect(day5.accommodation?.status).toBe("check_out");
      expect(day5.accommodation?.name).toBe("The Tokyo Edition Ginza");
      const checkoutStop = day5.stops.find((s) => s.type === "lodging");
      expect(checkoutStop).toBeDefined();
      expect(checkoutStop?.name).toContain("Hotel Check-out");

      // All stops across all 5 days have startLocal and endLocal in valid HH:MM format
      for (const day of result.days) {
        for (const stop of day.stops) {
          expect(stop.startLocal).toMatch(/^\d{2}:\d{2}$/);
          expect(stop.endLocal).toMatch(/^\d{2}:\d{2}$/);
          expect(stop.durationMin).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Schedule Validator Engine", () => {
    it("validates a healthy itinerary with zero blockers", () => {
      const cleanSchedule: OptimizedDaySchedule[] = [
        {
          dayNumber: 1,
          date: "2027-04-10",
          totalTravelTimeMin: 45,
          totalActivityTimeMin: 180,
          stops: [
            {
              id: "s1",
              placeId: "p1",
              name: "Senso-ji",
              coordinates: { lat: 35.7148, lng: 139.7967 },
              startLocal: "09:30",
              endLocal: "11:00",
              durationMin: 90,
              type: "activity",
              transferFromPrevMin: 30,
              distanceFromPrevMeters: 2000,
            },
            {
              id: "s2",
              placeId: "meal",
              name: "Lunch",
              coordinates: { lat: 35.7148, lng: 139.7967 },
              startLocal: "12:00",
              endLocal: "13:00",
              durationMin: 60,
              type: "meal",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
            {
              id: "s3",
              placeId: "p2",
              name: "Tokyo National Museum",
              coordinates: { lat: 35.7188, lng: 139.7765 },
              startLocal: "13:30",
              endLocal: "15:30",
              durationMin: 120,
              type: "activity",
              transferFromPrevMin: 15,
              distanceFromPrevMeters: 1500,
            },
          ],
        },
      ];

      const report = validateSchedule({
        days: cleanSchedule,
        maxDailyActiveHours: 8,
      });

      expect(report.isValid).toBe(true);
      expect(report.hasBlockers).toBe(false);
      expect(report.passedChecks.length).toBeGreaterThan(0);
    });

    it("flags time overlaps as BLOCKER issues", () => {
      const overlappingSchedule: OptimizedDaySchedule[] = [
        {
          dayNumber: 1,
          date: "2027-04-10",
          totalTravelTimeMin: 0,
          totalActivityTimeMin: 180,
          stops: [
            {
              id: "s1",
              placeId: "p1",
              name: "Activity 1",
              coordinates: { lat: 35.7, lng: 139.7 },
              startLocal: "09:00",
              endLocal: "11:00", // Ends at 11:00
              durationMin: 120,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
            {
              id: "s2",
              placeId: "p2",
              name: "Activity 2",
              coordinates: { lat: 35.7, lng: 139.7 },
              startLocal: "10:30", // Overlaps! Starts before 11:00
              endLocal: "12:00",
              durationMin: 90,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
          ],
        },
      ];

      const report = validateSchedule({ days: overlappingSchedule });

      expect(report.isValid).toBe(false);
      expect(report.hasBlockers).toBe(true);
      const overlapIssue = report.issues.find((i) => i.code === "TIME_OVERLAP");
      expect(overlapIssue).toBeDefined();
      expect(overlapIssue?.severity).toBe("BLOCKER");
    });

    it("flags hard budget overages as BLOCKER", () => {
      const report = validateSchedule({
        days: [],
        budgetBreakdown: {
          userBudget: { amount: 10000000, currency: "INR" },
          totalEstimated: { amount: 15000000, currency: "INR" },
          remainingBudget: { amount: -5000000, currency: "INR" },
          withinBudget: false, // over hard cap
          flexibilityPct: 5,
          categories: {} as any,
          breakdown: [],
          contingencyPct: 10,
          alternatives: [],
          warnings: [],
        },
      });

      expect(report.isValid).toBe(false);
      expect(report.hasBlockers).toBe(true);
      const budgetIssue = report.issues.find((i) => i.code === "BUDGET_OVER_HARD_CAP");
      expect(budgetIssue?.severity).toBe("BLOCKER");
    });

    it("flags missing lunch break on active 6-hour tours as QUALITY issue", () => {
      const scheduleWithoutMeal: OptimizedDaySchedule[] = [
        {
          dayNumber: 1,
          date: "2027-04-10",
          totalTravelTimeMin: 30,
          totalActivityTimeMin: 330,
          stops: [
            {
              id: "s1",
              placeId: "p1",
              name: "Morning Tour",
              coordinates: { lat: 35.7, lng: 139.7 },
              startLocal: "09:00",
              endLocal: "12:00",
              durationMin: 180,
              type: "activity",
              transferFromPrevMin: 0,
              distanceFromPrevMeters: 0,
            },
            {
              id: "s2",
              placeId: "p2",
              name: "Afternoon Tour",
              coordinates: { lat: 35.7, lng: 139.7 },
              startLocal: "12:30",
              endLocal: "15:30",
              durationMin: 180,
              type: "activity",
              transferFromPrevMin: 30,
              distanceFromPrevMeters: 1000,
            },
          ],
        },
      ];

      const report = validateSchedule({ days: scheduleWithoutMeal });
      const mealIssue = report.issues.find((i) => i.code === "MISSING_MEAL_BREAK");
      expect(mealIssue).toBeDefined();
      expect(mealIssue?.severity).toBe("QUALITY");
    });
  });
});
