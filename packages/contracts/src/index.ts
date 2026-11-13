/**
 * @travora/contracts – Shared Zod schemas and inferred TypeScript types.
 */

export const CONTRACTS_VERSION = "0.1.0" as const;

// Re-export Zod
export { z } from "zod";

// Common
export * from "./common.js";

// User & Auth
export * from "./user.js";

// Preferences
export * from "./preferences.js";

// Trip
export * from "./trip.js";
