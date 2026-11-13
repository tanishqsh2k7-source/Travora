import { z } from "zod";
import { CoordinatesSchema } from "./common.js";

export const TravelModeSchema = z.enum(["walking", "transit", "driving", "bicycling"]);
export type TravelMode = z.infer<typeof TravelModeSchema>;

export const RouteLegSchema = z.object({
  origin: CoordinatesSchema,
  destination: CoordinatesSchema,
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  mode: TravelModeSchema,
  polyline: z.string().optional(),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type RouteLeg = z.infer<typeof RouteLegSchema>;

export const RouteMatrixElementSchema = z.object({
  originIndex: z.number().int().nonnegative(),
  destinationIndex: z.number().int().nonnegative(),
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  status: z.enum(["OK", "ZERO_RESULTS", "FAILED"]).default("OK"),
});
export type RouteMatrixElement = z.infer<typeof RouteMatrixElementSchema>;

export const RouteMatrixQuerySchema = z.object({
  origins: z.array(CoordinatesSchema).min(1),
  destinations: z.array(CoordinatesSchema).min(1),
  mode: TravelModeSchema.default("transit"),
});
export type RouteMatrixQuery = z.infer<typeof RouteMatrixQuerySchema>;

export const RouteMatrixResultSchema = z.object({
  elements: z.array(RouteMatrixElementSchema),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type RouteMatrixResult = z.infer<typeof RouteMatrixResultSchema>;
