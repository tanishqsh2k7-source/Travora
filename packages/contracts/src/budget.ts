import { z } from "zod";
import { MoneySchema } from "./common.js";

export const BudgetCategorySchema = z.enum([
  "flights",
  "accommodation",
  "food",
  "local_transport",
  "activities",
  "contingency",
]);
export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const CategoryBreakdownItemSchema = z.object({
  category: BudgetCategorySchema,
  amount: MoneySchema,
  percentage: z.number().min(0).max(100),
  description: z.string().optional(),
});
export type CategoryBreakdownItem = z.infer<typeof CategoryBreakdownItemSchema>;

export const BudgetAlternativeSchema = z.object({
  description: z.string(),
  potentialSavings: MoneySchema,
  category: BudgetCategorySchema,
});
export type BudgetAlternative = z.infer<typeof BudgetAlternativeSchema>;

export const BudgetBreakdownSchema = z.object({
  userBudget: MoneySchema,
  totalEstimated: MoneySchema,
  remainingBudget: MoneySchema,
  withinBudget: z.boolean(),
  overBudgetAmount: MoneySchema.optional(),
  flexibilityPct: z.number().min(0).max(100).default(5),
  categories: z.record(BudgetCategorySchema, MoneySchema),
  breakdown: z.array(CategoryBreakdownItemSchema),
  contingencyPct: z.number().min(0).max(50).default(10),
  alternatives: z.array(BudgetAlternativeSchema).default([]),
  warnings: z.array(z.string()).default([]),
});
export type BudgetBreakdown = z.infer<typeof BudgetBreakdownSchema>;
