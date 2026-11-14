import { z } from "zod";
import { CoordinatesSchema, MoneySchema } from "./common.js";
import { PlaceCandidateSchema } from "./places.js";

export const ScheduledStopTypeSchema = z.enum(["activity", "meal", "transfer", "buffer", "lodging"]);
export type ScheduledStopType = z.infer<typeof ScheduledStopTypeSchema>;

export const DayAccommodationInfoSchema = z.object({
  hotelId: z.string().optional(),
  name: z.string(),
  address: z.string(),
  rating: z.number().optional(),
  pricePerNight: MoneySchema.optional(),
  status: z.enum(["check_in", "staying", "switch_hotel", "check_out"]).default("staying"),
  notes: z.string().optional(),
});
export type DayAccommodationInfo = z.infer<typeof DayAccommodationInfoSchema>;

export const ScheduledStopSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  name: z.string(),
  coordinates: CoordinatesSchema,
  startLocal: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
  endLocal: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
  durationMin: z.number().int().positive(),
  type: ScheduledStopTypeSchema.default("activity"),
  transferFromPrevMin: z.number().int().nonnegative().default(0),
  distanceFromPrevMeters: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});
export type ScheduledStop = z.infer<typeof ScheduledStopSchema>;

export const OptimizedDayScheduleSchema = z.object({
  dayNumber: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  theme: z.string().optional(),
  stops: z.array(ScheduledStopSchema),
  totalTravelTimeMin: z.number().int().nonnegative(),
  totalActivityTimeMin: z.number().int().nonnegative(),
  accommodation: DayAccommodationInfoSchema.optional(),
});
export type OptimizedDaySchedule = z.infer<typeof OptimizedDayScheduleSchema>;

export const RouteOptimizerResultSchema = z.object({
  days: z.array(OptimizedDayScheduleSchema),
  unplacedPlaces: z.array(PlaceCandidateSchema).default([]),
  totalDistanceMeters: z.number().nonnegative(),
  totalTravelTimeMin: z.number().int().nonnegative(),
});
export type RouteOptimizerResult = z.infer<typeof RouteOptimizerResultSchema>;

