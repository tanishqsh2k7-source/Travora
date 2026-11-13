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

// Provider Schemas (Phase 2)
export * from "./places.js";
export * from "./routes.js";
export * from "./weather.js";
export * from "./flights.js";
export * from "./hotels.js";

// Deterministic Engine Schemas (Phase 3)
export * from "./budget.js";
export * from "./optimization.js";
export * from "./validation.js";

// Planning & Run Schemas (Phase 4)
export * from "./planning.js";

// Supervisor & Task Plan Schemas (Phase 5)
export * from "./task-plan.js";

// Critic & Replanning Schemas (Phase 6)
export * from "./replanning.js";

// Events & SSE Schemas (Phase 7)
export * from "./events.js";
