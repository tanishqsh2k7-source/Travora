import { z } from "zod";
import { CoordinatesSchema } from "./common.js";

export const WeatherDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  tempMinC: z.number(),
  tempMaxC: z.number(),
  condition: z.string(),
  description: z.string(),
  precipitationProb: z.number().min(0).max(100),
  isRainy: z.boolean(),
  humidityPct: z.number().min(0).max(100).optional(),
  windSpeedKmh: z.number().nonnegative().optional(),
});
export type WeatherDay = z.infer<typeof WeatherDaySchema>;

export const WeatherQuerySchema = z.object({
  coordinates: CoordinatesSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type WeatherQuery = z.infer<typeof WeatherQuerySchema>;

export const WeatherForecastSchema = z.object({
  coordinates: CoordinatesSchema,
  daily: z.array(WeatherDaySchema),
  isForecast: z.boolean().default(true), // false indicates seasonal / historical climate guidance
  alerts: z.array(z.string()).default([]),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

