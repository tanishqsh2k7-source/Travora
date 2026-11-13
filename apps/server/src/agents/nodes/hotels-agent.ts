import type { TravelState, TravelStateUpdate } from "../state.js";
import { getProviderRegistry } from "../../providers/index.js";

export async function hotelsAgentNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const plan = state.taskPlan;

  // Check if hotels capability was skipped by the Supervisor
  if (plan && plan.skippedCapabilities.includes("hotels")) {
    return {
      hotelsResult: [],
    };
  }

  const providers = getProviderRegistry();
  const warnings: string[] = [];

  try {
    const hotelsResult = await providers.hotels.searchHotels({
      destination: req.destination,
      checkInDate: req.startDate,
      checkOutDate: req.endDate,
      adults: req.travellers.adults,
      rooms: 1,
      travelStyle: req.travelStyle,
      currency: req.budget.currency,
    });

    return {
      hotelsResult,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Hotel search unavailable: ${msg}`);
    return {
      hotelsResult: [],
      warnings,
    };
  }
}
