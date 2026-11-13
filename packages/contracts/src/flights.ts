import { z } from "zod";
import { MoneySchema } from "./common.js";

export const FlightSegmentSchema = z.object({
  departureAirport: z.string().length(3).toUpperCase(),
  arrivalAirport: z.string().length(3).toUpperCase(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  carrier: z.string(),
  carrierName: z.string(),
  flightNumber: z.string(),
  durationMinutes: z.number().positive(),
});
export type FlightSegment = z.infer<typeof FlightSegmentSchema>;

export const FlightOfferSchema = z.object({
  id: z.string(),
  carrier: z.string(),
  carrierName: z.string(),
  origin: z.string(),
  destination: z.string(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  segments: z.array(FlightSegmentSchema).min(1),
  totalDurationMinutes: z.number().positive(),
  stops: z.number().int().nonnegative().default(0),
  price: MoneySchema,
  baggageIncluded: z.boolean().default(true),
  bookingUrl: z.string().url().optional(),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type FlightOffer = z.infer<typeof FlightOfferSchema>;

export const FlightSearchQuerySchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  adults: z.number().int().positive().default(1),
  currency: z.string().length(3).toUpperCase().default("USD"),
});
export type FlightSearchQuery = z.infer<typeof FlightSearchQuerySchema>;

