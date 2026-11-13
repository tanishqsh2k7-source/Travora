import { z } from "zod";
import { TravelStyleSchema, TransportPreferenceSchema, PacePreferenceSchema } from "./preferences.js";

export const TravellersSchema = z.object({
  adults: z.number().int().min(1, { message: "At least 1 adult required" }).default(1),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
});
export type Travellers = z.infer<typeof TravellersSchema>;

export const BudgetInputSchema = z.object({
  amount: z.number().int().positive({ message: "Budget amount must be a positive integer in smallest currency units" }),
  currency: z.string().length(3, { message: "Currency must be a 3-letter ISO code" }).toUpperCase().default("USD"),
  flexibilityPct: z.number().min(0).max(100).default(5),
});
export type BudgetInput = z.infer<typeof BudgetInputSchema>;

export const TripConstraintsSchema = z.object({
  accessibility: z.array(z.string()).default([]),
  dietary: z.array(z.string()).default([]),
  pace: PacePreferenceSchema.default("moderate"),
});
export type TripConstraints = z.infer<typeof TripConstraintsSchema>;

export const TripStatusSchema = z.enum(["draft", "planning", "planned", "failed", "cancelled"]);
export type TripStatus = z.infer<typeof TripStatusSchema>;

export const CreateTripRequestSchema = z
  .object({
    origin: z.string().min(1, { message: "Origin is required" }).trim(),
    destination: z.string().min(1, { message: "Destination is required" }).trim(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
    timezone: z.string().trim().default("UTC"),
    travellers: TravellersSchema.default({ adults: 1, children: 0, infants: 0 }),
    budget: BudgetInputSchema,
    interests: z.array(z.string()).default([]),
    travelStyle: TravelStyleSchema.default("balanced"),
    transportPreferences: z.array(TransportPreferenceSchema).default(["public_transit"]),
    constraints: TripConstraintsSchema.default({}),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate cannot be after endDate",
    path: ["endDate"],
  });

export type CreateTripRequest = z.infer<typeof CreateTripRequestSchema>;

export const TripResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  origin: z.string(),
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  timezone: z.string(),
  travellers: TravellersSchema,
  budget: BudgetInputSchema,
  interests: z.array(z.string()),
  travelStyle: TravelStyleSchema,
  transportPreferences: z.array(TransportPreferenceSchema),
  constraints: TripConstraintsSchema,
  status: TripStatusSchema,
  currentVersionNo: z.number().int().nonnegative().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TripResponse = z.infer<typeof TripResponseSchema>;

