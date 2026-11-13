# Travora

> **AI-powered travel planning platform powered by a Level 3 Multi-Agent Architecture (Supervisor Pattern), deterministic math engines, two-stage critic auditing, and immutable version lineage.**

[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![LangGraph.js](https://img.shields.io/badge/Orchestration-LangGraph.js-black.svg)](https://langchain-ai.github.io/langgraphjs/)
[![Vitest Passing](https://img.shields.io/badge/Tests-101%20Passing-brightgreen.svg)](https://vitest.dev/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg)](https://react.dev/)

---

## 🏗️ Architecture Overview

Travora enforces a strict **separation between probabilistic LLM reasoning and deterministic operations**:
1. **Supervisor Agent**: Formulates dynamic task plans, decomposes user requirements, and activates capability allowlists.
2. **Specialist Research Agents**: Execute parallel fan-out branches (Places, Flights, Accommodations, Weather) with isolated failure boundaries.
3. **Deterministic Pure Engines**:
   - **Budget Engine**: Calculates exact totals, category distributions, and currency conversions using `Decimal.js` integer arithmetic (cents/pence/paise). **Never delegates math to an LLM.**
   - **Route Optimizer**: Uses nearest-neighbor TSP heuristics and distance matrices to order stops and prevent zig-zag travel.
   - **Schedule Validator**: Mathematically validates non-overlapping time windows and transit buffers.
4. **Two-Stage Critic**:
   - *Stage A (Deterministic Constraints)*: Audits schedule feasibility, travel times, and hard budget caps.
   - *Stage B (Qualitative Disruption Review)*: Cross-references weather forecasts with venue types (flags outdoor parks on rainy days).
5. **Adaptive Replanner**: Bounded state machine ($\le 2$ passes) that computes localized surgical repairs while preserving unaffected days.
6. **Immutable Version Lineage**: Every replan or refinement generates a new `TripVersion` with comparative diffing.

```
                    User Request / Preferences
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Supervisor Node   │ ──→ Dynamic TaskPlan & Allowlists
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┬─────────────────┐
             ▼                 ▼                 ▼                 ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │ Destination │   │   Flights   │   │    Hotel    │   │   Weather   │
      │  Research   │   │  Research   │   │  Research   │   │  Forecast   │
      └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
             └─────────────────┼─────────────────┴─────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Itinerary Assembly │
                    │   & Route Engine    │ ──→ Nearest-Neighbor TSP Heuristics
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Budget Engine    │ ──→ Decimal.js Pure Arithmetic
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Two-Stage Critic   │ ──→ Schedule Checks + Rain Coherence
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
       [Pass / Valid]                  [Disruption / Blocker]
                │                                     │
                ▼                                     ▼
     ┌─────────────────────┐               ┌─────────────────────┐
     │ Final Plan Response │               │  Adaptive Replanner │ (Max 2 passes)
     │   & Trip Version    │ ◀─────────────│   (Surgical Patch)  │
     └─────────────────────┘               └─────────────────────┘
```

---

## 📦 Monorepo Structure

```
travora/
├── packages/
│   └── contracts/          # Shared Zod schemas, types & validation contracts
├── apps/
│   ├── server/             # Express 4 API + LangGraph.js StateGraph + MongoDB
│   │   └── src/
│   │       ├── agents/     # LangGraph nodes, state, supervisor, runner
│   │       ├── engines/    # Deterministic budget, route TSP, schedule validator
│   │       ├── providers/  # Provider interfaces, canned fixtures, live adapters
│   │       ├── routes/     # Auth, trips, planning, versions, preferences
│   │       ├── services/   # Real-time SSE event broker (RunEventService)
│   │       ├── models/     # Mongoose schemas (User, Trip, TripVersion, Run)
│   │       ├── demo.ts     # Standalone end-to-end interactive CLI demo
│   │       └── __tests__/  # Vitest integration suites & evals (101 tests)
│   └── client/             # React 19 + Vite frontend
│       └── src/
│           ├── api/        # Type-safe API client & EventSource subscriber
│           ├── components/ # TripBuilder, PlanningProgress, Itinerary, Budget, Map
│           └── styles/     # Modern dark-mode styling
├── docker-compose.yml      # Local MongoDB service definition
├── .env.example            # Canonical environment variable specification
├── AGENTS.md               # Architecture and agent coding rules
└── package.json            # Workspace root scripts
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: `v20.0.0` or newer
- **npm**: `v10+`
- **Docker** (Optional, for persistent local MongoDB; tests and demo run offline with in-memory Mongo)

### 2. Installation
```bash
git clone https://github.com/travora/travora.git
cd travora
npm install
```

### 3. Run the Interactive Multi-Agent Demo
Run the complete end-to-end multi-agent pipeline in the terminal without needing any external database or API keys:
```bash
npm run demo
```

### 4. Run the Dev Servers
```bash
# 1. Start MongoDB (if using Docker)
npm run docker:up

# 2. Copy environment variables
cp .env.example .env

# 3. Start API backend (runs on http://localhost:3001)
npm run dev

# 4. In a separate terminal, start React 19 frontend (runs on http://localhost:5173)
npm run dev:client
```
Open **http://localhost:5173** in your browser to plan trips, view real-time SSE progress, explore itineraries, inspect budget breakdowns, and trigger adaptive replanning.

---

## 🧪 Testing & Evaluation Suite (Evals)

All tests execute **100% offline with zero external network dependencies** using fixture adapters and in-memory MongoDB:

```bash
# Run all tests across the monorepo (Contracts + Server + Evals)
npm test

# Run the dedicated hardening evaluation suite
npm run test:server -- src/__tests__/evals.test.ts

# Run contracts validation tests
npm run test:contracts
```

### Key Evaluated Invariants:
- **Budget Invariant**: `totalEstimated == sum(categories)` with zero floating point discrepancies down to 1 cent/penny/paise.
- **Schedule Non-Overlap**: For any two consecutive stops, $Start_B \ge End_A + Transit$.
- **Weather Coherence**: Outdoor attractions scheduled on rainy forecast days are automatically detected and surgically substituted.
- **Replanning Convergence**: The replan loop is provably bounded to at most 2 passes.
- **Multi-Tenant Security**: 100% isolation of user trips, versions, runs, and SSE event channels.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user account |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT |
| `GET` | `/api/v1/auth/me` | Retrieve authenticated profile |
| `GET` | `/api/v1/me/preferences` | Retrieve traveler global preferences |
| `PATCH`| `/api/v1/me/preferences` | Update default currency, pace, dietary, accessibility |
| `POST` | `/api/v1/trips` | Create a new trip request |
| `GET` | `/api/v1/trips` | List all trips owned by user |
| `GET` | `/api/v1/trips/:tripId` | Fetch trip details |
| `POST` | `/api/v1/trips/:tripId/plan` | Start multi-agent planning run |
| `POST` | `/api/v1/trips/:tripId/replan` | Trigger adaptive replan for disruption |
| `GET` | `/api/v1/runs/:runId` | Get status and result of planning run |
| `GET` | `/api/v1/runs/:runId/events` | **SSE live stream** of agent progress events |
| `GET` | `/api/v1/trips/:tripId/versions` | List all historical versions of trip |
| `GET` | `/api/v1/trips/:tripId/versions/:versionNo` | Fetch specific immutable trip version |
| `POST` | `/api/v1/trips/:tripId/versions/:versionNo/restore` | Restore historical version as active |

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server listen port | `3001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/travora` |
| `JWT_SECRET` | Signing secret for session tokens | `dev-secret-change-me` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `CORS_ORIGINS` | Permitted browser origins | `http://localhost:5173` |
| `PROVIDER_MODE` | Provider mode (`fixture` or `live`) | `fixture` |
| `GEMINI_API_KEY` | Optional Google Gemini API Key | *(Uses canned fixtures if empty)* |
| `LANGSMITH_TRACING` | Enable LangSmith observability | `false` |
| `LANGSMITH_API_KEY` | LangSmith API Key | *(Optional)* |
| `LANGSMITH_PROJECT` | LangSmith project name | `travora` |

---

## 📜 Development Guidelines

1. **Strict TypeScript Mode Everywhere**: No unchecked `any` types.
2. **Zod as Single Source of Truth**: All shared models, API schemas, and states derive from `@travora/contracts`.
3. **Zero Floating Point Math**: All money is represented in smallest integer units using `Decimal.js`.
4. **Conventional Commits**: Commits follow `feat:`, `fix:`, `test:`, `chore:`, `docs:`.
