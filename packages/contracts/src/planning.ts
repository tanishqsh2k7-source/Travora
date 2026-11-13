import { z } from "zod";
import { OptimizedDayScheduleSchema } from "./optimization.js";
import { BudgetBreakdownSchema } from "./budget.js";
import { FlightOfferSchema } from "./flights.js";
import { HotelOfferSchema } from "./hotels.js";
import { WeatherForecastSchema } from "./weather.js";

export const PlanningRunStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "partial",
  "failed",
]);
export type PlanningRunStatus = z.infer<typeof PlanningRunStatusSchema>;

export const FinalPlanResponseSchema = z.object({
  tripId: z.string(),
  runId: z.string(),
  destination: z.string(),
  dates: z.object({
    startDate: z.string(),
    endDate: z.string(),
    totalDays: z.number().int().positive(),
  }),
  summary: z.string(),
  itinerary: z.array(OptimizedDayScheduleSchema),
  budgetBreakdown: BudgetBreakdownSchema,
  flightOptions: z.array(FlightOfferSchema).default([]),
  hotelOptions: z.array(HotelOfferSchema).default([]),
  weatherForecast: WeatherForecastSchema.optional(),
  sources: z.array(
    z.object({
      provider: z.string(),
      fetchedAt: z.string(),
    })
  ).default([]),
  warnings: z.array(z.string()).default([]),
});
export type FinalPlanResponse = z.infer<typeof FinalPlanResponseSchema>;

export const PlanningRunResponseSchema = z.object({
  runId: z.string(),
  tripId: z.string(),
  status: PlanningRunStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  currentStage: z.string().optional(),
  progressPct: z.number().min(0).max(100).default(0),
  error: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  result: FinalPlanResponseSchema.optional(),
});
export type PlanningRunResponse = z.infer<typeof PlanningRunResponseSchema>;

