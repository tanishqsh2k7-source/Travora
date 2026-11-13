import type { TravelState, TravelStateUpdate } from "../state.js";
import { optimizeRoutes, calculateBudget, validateSchedule } from "../../engines/index.js";

export async function itineraryNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const places = state.placesResult ?? [];
  const selectedHotel = state.hotelsResult?.[0];
  const selectedFlight = state.flightsResult?.[0];

  // 1. Calculate travel dates
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  const travelDates: string[] = [];
  const curr = new Date(start);

  while (curr <= end) {
    travelDates.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }

  const daysCount = travelDates.length;

  // 2. Optimize Routes
  const routeResult = optimizeRoutes({
    places,
    daysCount,
    pace: req.constraints.pace ?? "moderate",
    travelDates,
    hotelCoordinates: selectedHotel?.coordinates,
  });

  // 3. Compute Budget
  const isINR = req.budget.currency.toUpperCase() === "INR";
  const multiplier = isINR ? 85 : 1;

  // Food and transport daily allowances per person
  const dailyFoodPerPerson = {
    amount: Math.round(25 * multiplier * 100),
    currency: req.budget.currency,
  };
  const dailyTransportPerPerson = {
    amount: Math.round(10 * multiplier * 100),
    currency: req.budget.currency,
  };

  // Activity tickets (sample fees for included places)
  const activityTickets = places.slice(0, 4).map(() => ({
    amount: Math.round(15 * multiplier * 100),
    currency: req.budget.currency,
  }));

  const flightAlternatives = (state.flightsResult ?? []).slice(1).map((f) => ({
    description: `Switch to ${f.carrierName} (${f.stops} stops)`,
    price: f.price,
  }));

  const hotelAlternatives = (state.hotelsResult ?? []).slice(1).map((h) => ({
    description: `Stay at ${h.name} (${h.hotelStyle})`,
    price: h.totalPrice,
  }));

  const budgetResult = calculateBudget({
    userBudget: req.budget,
    flexibilityPct: req.budget.flexibilityPct ?? 5,
    flightsTotal: selectedFlight?.price ?? { amount: 0, currency: req.budget.currency },
    accommodationTotal: selectedHotel?.totalPrice ?? { amount: 0, currency: req.budget.currency },
    dailyFoodAllowancePerPerson: dailyFoodPerPerson,
    dailyLocalTransportPerPerson: dailyTransportPerPerson,
    activityTickets,
    travellers: req.travellers,
    daysCount,
    contingencyPct: 10,
    flightAlternatives,
    hotelAlternatives,
  });

  // 4. Validate Schedule
  const validationReport = validateSchedule({
    days: routeResult.days,
    budgetBreakdown: budgetResult,
    placesMap: new Map(places.map((p) => [p.id, p])),
  });

  return {
    routeResult,
    budgetResult,
    validationReport,
  };
}
