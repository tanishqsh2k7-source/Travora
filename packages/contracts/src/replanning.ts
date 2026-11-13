import { z } from "zod";

export const DisruptionTypeSchema = z.enum([
  "weather_rain",
  "hotel_cancelled",
  "flight_delayed",
  "budget_reduced",
  "user_custom",
]);
export type DisruptionType = z.infer<typeof DisruptionTypeSchema>;

export const ReplanRequestSchema = z.object({
  instruction: z.string().min(1, { message: "Instruction is required" }),
  disruptionType: DisruptionTypeSchema.default("user_custom"),
  affectedDayNumber: z.number().int().positive().optional(),
  affectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type ReplanRequest = z.infer<typeof ReplanRequestSchema>;

export const ReplanPatchSchema = z.object({
  affectedDayNumbers: z.array(z.number().int().positive()),
  preservedDayNumbers: z.array(z.number().int().positive()),
  changeSummary: z.string(),
  replanCount: z.number().int().nonnegative().default(1),
});
export type ReplanPatch = z.infer<typeof ReplanPatchSchema>;
