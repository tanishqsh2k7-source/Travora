import type { TravelState, TravelStateUpdate } from "../state.js";

export async function mergeResultsNode(state: TravelState): Promise<TravelStateUpdate> {
  const plan = state.taskPlan;
  const warnings = [...(state.warnings ?? [])];

  if (plan) {
    // Check partial failures against expected capabilities
    if (plan.requiredCapabilities.includes("flights") && (state.flightsResult?.length ?? 0) === 0) {
      warnings.push("Flight search returned no available offers; continuing with estimated local costs.");
    }

    if (plan.requiredCapabilities.includes("hotels") && (state.hotelsResult?.length ?? 0) === 0) {
      warnings.push("Hotel search returned no available offers; lodging costs may require manual entry.");
    }

    if (plan.requiredCapabilities.includes("destination") && (state.placesResult?.length ?? 0) === 0) {
      warnings.push("No destination attractions were found matching the search criteria.");
    }
  }

  return {
    warnings,
  };
}

