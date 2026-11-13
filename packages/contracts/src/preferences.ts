import { z } from "zod";

export const TravelStyleSchema = z.enum(["budget", "balanced", "luxury", "fast-paced", "relaxed"]);
export type TravelStyle = z.infer<typeof TravelStyleSchema>;

export const TransportPreferenceSchema = z.enum([
  "flight",
  "train",
  "public_transit",
  "car_rental",
  "rideshare",
  "walking",
]);
export type TransportPreference = z.infer<typeof TransportPreferenceSchema>;

export const PacePreferenceSchema = z.enum(["relaxed", "moderate", "fast"]);
export type PacePreference = z.infer<typeof PacePreferenceSchema>;

export const UserPreferencesSchema = z.object({
  interests: z.array(z.string()).default([]),
  travelStyle: TravelStyleSchema.default("balanced"),
  pace: PacePreferenceSchema.default("moderate"),
  dietaryRestrictions: z.array(z.string()).default([]),
  accessibilityRequirements: z.array(z.string()).default([]),
  preferredCurrency: z.string().length(3).toUpperCase().default("USD"),
  transportPreferences: z.array(TransportPreferenceSchema).default(["public_transit"]),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const UpdatePreferencesRequestSchema = UserPreferencesSchema.partial();
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;

