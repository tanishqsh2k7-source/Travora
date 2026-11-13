import type { TravelState, TravelStateUpdate } from "../state.js";
import type { TaskPlan, AgentCapability } from "@travora/contracts";

export function determineTaskPlan(state: TravelState): TaskPlan {
  const req = state.request;
  const originLower = req.origin.trim().toLowerCase();
  const destLower = req.destination.trim().toLowerCase();

  // Check if this is a local discovery / sights only request:
  // e.g. Origin is same as destination, or origin starts with destination city, or explicitly flagged
  const isSameCity =
    originLower === destLower ||
    destLower.includes(originLower) ||
    originLower.includes(destLower);

  const queryIsDiscoveryOnly =
    isSameCity ||
    req.interests.some((i) => i.toLowerCase().includes("discovery")) ||
    req.origin === "" ||
    req.origin === req.destination;

  if (queryIsDiscoveryOnly) {
    const required: AgentCapability[] = ["destination", "weather", "routes"];
    const skipped: AgentCapability[] = ["flights", "hotels", "budget"];

    return {
      requiredCapabilities: required,
      skippedCapabilities: skipped,
      isDiscoveryOnly: true,
      rationale: `Local discovery request for ${req.destination}; searching attractions and weather while skipping flight and hotel searches.`,
      missingFields: [],
    };
  }

  // Full trip planning flow
  const required: AgentCapability[] = [
    "destination",
    "flights",
    "hotels",
    "weather",
    "budget",
    "routes",
    "itinerary",
  ];

  return {
    requiredCapabilities: required,
    skippedCapabilities: [],
    isDiscoveryOnly: false,
    rationale: `Full multi-day itinerary requested from ${req.origin} to ${req.destination}; coordinating destination research, flights, accommodation, and weather in parallel.`,
    missingFields: [],
  };
}

export async function supervisorNode(state: TravelState): Promise<TravelStateUpdate> {
  const taskPlan = determineTaskPlan(state);

  return {
    taskPlan,
    warnings: state.warnings,
  };
}
