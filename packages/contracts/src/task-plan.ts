import { z } from "zod";

export const AgentCapabilitySchema = z.enum([
  "destination",
  "flights",
  "hotels",
  "weather",
  "budget",
  "routes",
  "itinerary",
]);
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

export const TaskPlanSchema = z.object({
  requiredCapabilities: z.array(AgentCapabilitySchema),
  skippedCapabilities: z.array(AgentCapabilitySchema),
  isDiscoveryOnly: z.boolean().default(false),
  rationale: z.string(),
  missingFields: z.array(z.string()).default([]),
});
export type TaskPlan = z.infer<typeof TaskPlanSchema>;

