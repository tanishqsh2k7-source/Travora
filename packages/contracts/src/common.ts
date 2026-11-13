import { z } from "zod";

/**
 * Money representation as an exact integer in smallest currency unit (cents, pence).
 * Math must always use decimal.js, never floating-point multiplication.
 */
export const MoneySchema = z.object({
  amount: z.number().int().nonnegative({ message: "Amount must be a non-negative integer in smallest currency units" }),
  currency: z.string().length(3, { message: "Currency must be a 3-letter ISO code" }).toUpperCase(),
});

export type Money = z.infer<typeof MoneySchema>;

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const DateRangeSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "startDate cannot be after endDate",
    path: ["endDate"],
  });

export type DateRange = z.infer<typeof DateRangeSchema>;
