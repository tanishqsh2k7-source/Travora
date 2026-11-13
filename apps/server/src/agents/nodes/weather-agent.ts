import type { TravelState, TravelStateUpdate } from "../state.js";
import { getProviderRegistry } from "../../providers/index.js";

export async function weatherAgentNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const providers = getProviderRegistry();
  const warnings: string[] = [];

  // Default coordinate fallback if places hasn't resolved yet
  const defaultCoord = state.placesResult?.[0]?.coordinates ?? { lat: 35.6762, lng: 139.6503 };

  try {
    const weatherResult = await providers.weather.getForecast({
      coordinates: defaultCoord,
      startDate: req.startDate,
      endDate: req.endDate,
    });

    return {
      weatherResult,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Weather forecast unavailable: ${msg}`);
    return {
      weatherResult: undefined,
      warnings,
    };
  }
}
