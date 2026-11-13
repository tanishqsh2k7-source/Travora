import { z } from "zod";

export const ValidationSeveritySchema = z.enum(["BLOCKER", "WARNING", "QUALITY"]);
export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;

export const ValidationIssueSchema = z.object({
  code: z.string(),
  severity: ValidationSeveritySchema,
  message: z.string(),
  dayNumber: z.number().int().positive().optional(),
  itemId: z.string().optional(),
  repairSuggestion: z.string().optional(),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

export const ValidationReportSchema = z.object({
  isValid: z.boolean(),
  hasBlockers: z.boolean(),
  issues: z.array(ValidationIssueSchema).default([]),
  warnings: z.array(z.string()).default([]),
  passedChecks: z.array(z.string()).default([]),
});
export type ValidationReport = z.infer<typeof ValidationReportSchema>;

