/**
 * @travora/contracts – Shared Zod schemas and inferred types.
 *
 * Phase 0: Stub exports so the package builds.
 * Phase 1 fills in Trip, User, Budget, etc.
 */

export const CONTRACTS_VERSION = "0.1.0" as const;

// Re-export zod for convenience so consumers don't need a direct dependency
export { z } from "zod";

