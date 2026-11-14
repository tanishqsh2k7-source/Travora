import { z } from "zod";

export const ITINERARY_PLANNER_PROMPT_VERSION = "2.0.0" as const;

export const NightAssignmentSchema = z.object({
  dayNumber: z.number().int().positive(),
  city: z.string(),
  area: z.string(),
  placeIds: z.array(z.string()).default([]),
});
export type NightAssignment = z.infer<typeof NightAssignmentSchema>;

export const ItinerarySynthesisOutputSchema = z.object({
  cities: z.array(
    z.object({
      city: z.string(),
      nights: z.number().int().positive(),
    })
  ),
  nights: z.array(NightAssignmentSchema),
  rationale: z.string().optional(),
});
export type ItinerarySynthesisOutput = z.infer<typeof ItinerarySynthesisOutputSchema>;

export const ITINERARY_PLANNER_SYSTEM_PROMPT = `
You are the Itinerary Architect for Travora travel planner (Version ${ITINERARY_PLANNER_PROMPT_VERSION}).
Your sole job is to allocate the trip's nights across ordered cities and assign an area label and place IDs for each day.

STRICT CONSTRAINTS:
1. You DO NOT write times, schedules, hotel names, prices, or transit legs. Those are built deterministically.
2. Only select place IDs from the provided candidate list.
3. If the user requested a single destination, do not add a second city unless distinct regional areas are explicitly requested.
4. Return valid JSON conforming exactly to the ItinerarySynthesisOutput schema.
`.trim();
