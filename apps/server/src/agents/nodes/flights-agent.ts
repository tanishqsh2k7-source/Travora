import type { TravelState, TravelStateUpdate } from "../state.js";
import { getProviderRegistry } from "../../providers/index.js";

export async function flightsAgentNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const plan = state.taskPlan;

  // Check if flights capability was skipped by the Supervisor
  if (plan && plan.skippedCapabilities.includes("flights")) {
    return {
      flightsResult: [],
    };
  }

  const providers = getProviderRegistry();
  const warnings: string[] = [];

  try {
    const flightsResult = await providers.flights.searchFlights({
      origin: req.origin,
      destination: req.destination,
      departureDate: req.startDate,
      returnDate: req.endDate,
      adults: req.travellers.adults,
      currency: req.budget.currency,
    });

    return {
      flightsResult,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Flight search unavailable: ${msg}`);
    return {
      flightsResult: [],
      warnings,
    };
  }
}
