import { z } from "zod";
import { CoordinatesSchema } from "./common.js";

export const OpeningHoursSchema = z.object({
  openNow: z.boolean().optional(),
  weekdayText: z.array(z.string()).default([]),
});
export type OpeningHours = z.infer<typeof OpeningHoursSchema>;

export const PlaceCandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  address: z.string(),
  coordinates: CoordinatesSchema,
  rating: z.number().min(0).max(5).optional(),
  userRatingsTotal: z.number().int().nonnegative().optional(),
  types: z.array(z.string()).default([]),
  openingHours: OpeningHoursSchema.optional(),
  priceLevel: z.number().int().min(0).max(4).optional(),
  estimatedDurationMin: z.number().int().positive().default(90),
  photoUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type PlaceCandidate = z.infer<typeof PlaceCandidateSchema>;

export const PlaceSearchQuerySchema = z.object({
  query: z.string().min(1),
  destination: z.string().optional(),
  coordinates: CoordinatesSchema.optional(),
  radiusMeters: z.number().positive().default(10000),
  types: z.array(z.string()).default([]),
  limit: z.number().int().positive().default(10),
});
export type PlaceSearchQuery = z.infer<typeof PlaceSearchQuerySchema>;
