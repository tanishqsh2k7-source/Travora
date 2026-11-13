import { z } from "zod";

export const AgentEventTypeSchema = z.enum([
  "run.started",
  "agent.status",
  "tool.called",
  "validation.issue",
  "replan.started",
  "run.completed",
  "run.failed",
]);
export type AgentEventType = z.infer<typeof AgentEventTypeSchema>;

export const AgentEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  type: AgentEventTypeSchema,
  stage: z.string(),
  progress: z.number().min(0).max(100),
  message: z.string(),
  timestamp: z.string(),
  payload: z.record(z.any()).optional(),
});
export type AgentEvent = z.infer<typeof AgentEventSchema>;
