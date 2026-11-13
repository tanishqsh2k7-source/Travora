import { z } from "zod";
import { CoordinatesSchema, MoneySchema } from "./common.js";
import { TravelStyleSchema } from "./preferences.js";

export const HotelOfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  address: z.string(),
  coordinates: CoordinatesSchema,
  rating: z.number().min(0).max(5).optional(),
  stars: z.number().int().min(1).max(5).optional(),
  pricePerNight: MoneySchema,
  totalPrice: MoneySchema,
  nights: z.number().int().positive(),
  amenities: z.array(z.string()).default([]),
  cancellationPolicy: z.string().default("Free cancellation up to 48 hours before check-in"),
  hotelStyle: TravelStyleSchema.default("balanced"),
  bookingUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
  fetchedAt: z.string(),
  provider: z.string(),
});
export type HotelOffer = z.infer<typeof HotelOfferSchema>;

export const HotelSearchQuerySchema = z.object({
  destination: z.string().min(1),
  coordinates: CoordinatesSchema.optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().positive().default(1),
  rooms: z.number().int().positive().default(1),
  travelStyle: TravelStyleSchema.optional(),
  currency: z.string().length(3).toUpperCase().default("USD"),
});
export type HotelSearchQuery = z.infer<typeof HotelSearchQuerySchema>;
