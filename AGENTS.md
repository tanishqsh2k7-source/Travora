# AGENTS.md — Travora

> Canonical reference for any AI agent (or human) working on this codebase.

## What Travora is

An AI-powered travel planner that uses a multi-agent architecture (Level 3:
Supervisor pattern) to plan trips. A Supervisor routes tasks to specialist
agents; deterministic engines handle arithmetic (budget, routes, scheduling);
a Critic agent reviews and a Replanner can revise.

## Tech stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| Runtime       | Node.js 20+ / TypeScript (ES modules)          |
| API           | Express 4                                       |
| Database      | MongoDB 7 (Mongoose ODM)                        |
| Validation    | Zod (shared via `@travora/contracts`)           |
| Auth          | JWT (jsonwebtoken)                              |
| Graph engine  | LangGraph.js                                    |
| Checkpointer  | MongoDBSaver (LangGraph ↔ Mongo)                |
| LLM           | Gemini (via @langchain/google-genai)            |
| Observability | LangSmith                                       |
| Frontend      | React 19, Vite, TypeScript                      |
| Testing       | Vitest, Supertest                               |
| Monorepo      | npm workspaces                                  |

## Repo layout

```
travora/
├── packages/
│   └── contracts/        # @travora/contracts – Zod schemas, shared types
├── apps/
│   ├── server/           # @travora/server   – Express API + LangGraph agents
│   │   └── src/
│   │       ├── config.ts
│   │       ├── db.ts
│   │       ├── app.ts    # Express app factory
│   │       ├── index.ts  # Entry point
│   │       ├── routes/   # Express routers (Phase 1+)
│   │       ├── models/   # Mongoose models (Phase 1+)
│   │       ├── agents/   # LangGraph graphs (Phase 4+)
│   │       ├── engines/  # Deterministic: budget, route, schedule (Phase 3)
│   │       ├── providers/# External API adapters (Phase 2)
│   │       └── __tests__/
│   └── client/           # @travora/client   – React UI
│       └── src/
├── docker-compose.yml
├── .env.example
├── AGENTS.md             # ← You are here
└── package.json          # Workspace root
```

## Coding rules

1. **TypeScript strict mode everywhere.** No `any` unless it is explicitly
   narrowed within three lines.
2. **Zod is the source of truth.** Every API request/response body, DB
   document interface, and agent state schema is defined in
   `@travora/contracts` as a Zod schema. Infer types with `z.infer<>`.
3. **Pure functions for math.** Budget totals, route ordering, schedule
   validation — never ask an LLM to do arithmetic. These live in `engines/`.
4. **Money is exact.** Store monetary values as `{ amount: number, currency:
   string }` where amount is in the currency's smallest unit (cents/pence).
   Use `decimal.js` for any arithmetic, never floating-point multiplication.
5. **Provider adapters are behind interfaces.** Each external API (Google
   Places, weather, flights, hotels) has a TypeScript interface in
   `providers/`. A fixture adapter returns canned data; a live adapter calls
   the real API. Selected by env var or DI.
6. **No secrets in code.** All keys come from `process.env`. The `.env` file
   is git-ignored. `.env.example` documents every variable.
7. **Tests run without network.** Unit tests and most integration tests must
   pass with no external calls. Use fixture adapters and in-memory Mongo
   (mongodb-memory-server) for DB tests.
8. **ES modules only.** `"type": "module"` in every `package.json`. Use
   `.js` extensions in relative imports even in `.ts` files.
9. **Commit messages follow Conventional Commits.** `feat:`, `fix:`,
   `test:`, `chore:`, `docs:`.
10. **Each phase is a buildable, testable checkpoint.** Never leave the repo
    in a broken state between phases.

## Agent architecture (Phase 4+)

```
User request
    │
    ▼
┌──────────┐
│ Supervisor│ ──→ task plan (which specialists, what order)
└────┬─────┘
     │ fan-out (parallel where possible)
     ▼
┌────────────┐  ┌───────────┐  ┌──────────────┐
│ Destination │  │  Activity  │  │ Accommodation │
│  Research   │  │  Research  │  │   Research    │
└─────┬──────┘  └─────┬─────┘  └──────┬───────┘
      └───────┬───────┘               │
              ▼                       ▼
        ┌───────────┐          ┌────────────┐
        │  Budget   │          │   Route    │
        │  Engine   │          │  Optimizer │
        └─────┬─────┘          └─────┬──────┘
              └──────────┬───────────┘
                         ▼
                  ┌────────────┐
                  │  Itinerary │
                  │ Assembler  │
                  └─────┬──────┘
                        ▼
                  ┌────────────┐
                  │   Critic   │ ──→ pass / revise
                  └─────┬──────┘
                        ▼
                  ┌────────────┐
                  │ Replanner  │ (max 2 passes)
                  └────────────┘
```

Budget Engine and Route Optimizer are **not** LLM agents. They are
deterministic pure-function engines that receive structured data and return
structured results.

## Key decisions log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | MERN over Python/FastAPI | One language across stack; shared Zod contracts prevent drift |
| 2 | Budget + Route as engines, not agents | LLMs shouldn't do arithmetic or distance math |
| 3 | Fixture-first providers | Amadeus Self-Service shut down; Google Maps needs billing; mock first |
| 4 | Replanner kept, heavy auth deferred | Replanner is core L3; OAuth/social auth is Phase 1 thin JWT only |
| 5 | Phase 3 (engines) before Phase 4 (graph) | Engines have no LLM dependency and are easier to test first |

