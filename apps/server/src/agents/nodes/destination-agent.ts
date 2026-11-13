import type { TravelState, TravelStateUpdate } from "../state.js";
import { getProviderRegistry } from "../../providers/index.js";

export async function destinationAgentNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const providers = getProviderRegistry();
  const warnings: string[] = [];

  const queryInterests = req.interests.length > 0 ? req.interests.join(" ") : "top attractions";

  try {
    const placesResult = await providers.places.searchPlaces({
      query: `${queryInterests} in ${req.destination}`,
      destination: req.destination,
      limit: 10,
      types: req.interests,
      radiusMeters: 15000,
    });

    return {
      placesResult,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Destination research partial failure: ${msg}`);
    return {
      placesResult: [],
      warnings,
    };
  }
}

