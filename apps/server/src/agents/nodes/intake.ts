import type { TravelState, TravelStateUpdate } from "../state.js";

export async function intakeNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const warnings: string[] = [];

  const start = new Date(req.startDate);
  const end = new Date(req.endDate);

  if (start > end) {
    throw new Error("Invalid trip dates: startDate must be on or before endDate");
  }

  const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  if (daysCount > 14) {
    warnings.push("Trips longer than 14 days may have simplified routing");
  }

  return {
    status: "running",
    warnings,
  };
}

