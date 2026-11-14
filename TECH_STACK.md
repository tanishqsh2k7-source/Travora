# Travora — Complete Tech Stack Specification

> Comprehensive reference of all technologies, frameworks, libraries, architectural patterns, and external services used across the Travora monorepo.

---

## 1. Monorepo & Core Runtime

| Technology | Version / Specification | Purpose |
|---|---|---|
| **Node.js** | `>= 20.0.0` (LTS) | Server and tooling runtime environment |
| **TypeScript** | `^5.7.0` | Strict-mode type safety across all packages and apps with Project References |
| **npm Workspaces** | Native npm v10+ | Multi-package monorepo orchestration (`packages/contracts`, `apps/server`, `apps/client`) |
| **Module System** | ECMAScript Modules (ESM) | Native `"type": "module"` with explicit `.js` import specifiers in TypeScript |
| **TSX** | `^4.19.0` | Zero-build TypeScript runner for watch-mode development and CLI scripts |

---

## 2. Shared Contracts & Validation Layer (`packages/contracts`)

| Technology | Purpose |
|---|---|
| **Zod** (`^3.23.0`) | **Single source of truth** for all data schemas, runtime request/response validation, domain models, and inferred TypeScript types (`z.infer<>`) |
| **Shared Schemas** | User models, trip constraints, places, routes, weather, flights, hotels, budget breakdown, optimization results, task plans, replan patches, and SSE event payloads |

---

## 3. Backend API & Web Server (`apps/server`)

| Technology | Version | Purpose |
|---|---|---|
| **Express** | `^4.21.0` | HTTP application server for REST endpoints and Server-Sent Events (SSE) |
| **Helmet** | `^8.1.0` | Security headers (CSP, HSTS, frameguard, XSS filter) |
| **CORS** | `^2.8.5` | Cross-Origin Resource Sharing handling between client and server |
| **jsonwebtoken** | `^9.0.3` | Stateless JWT token issuance and verification (Bearer header + query-param SSE auth) |
| **bcryptjs** | `^3.0.3` | Salted credential password hashing |
| **dotenv** | `^16.5.0` | Environment variable management and loading |

---

## 4. Multi-Agent Orchestration & AI Engine (`apps/server/src/agents`)

| Component | Technology | Role |
|---|---|---|
| **Orchestrator** | **LangGraph.js** (`@langchain/langgraph` `^1.7.4`) | Cyclic state machine graph (`StateGraph`), state channels (`Annotation`), and graph compilation |
| **LLM Adapter** | **@langchain/google-genai** (`^2.3.6`) | Google Gemini model integration (`gemini-2.5-flash` / `gemini-1.5-pro`) |
| **Core Primitives** | **@langchain/core** (`^1.4.0`) | Messages, prompts, runnables, and tracing hooks |
| **Multi-Agent Architecture** | **Level 3 Supervisor Pattern** | Supervisor routes tasks dynamically; specialists run in parallel fan-out; deterministic engines execute math; two-stage critic audits; bounded replanner ($\le 2$ passes) repairs |
| **State Checkpointing** | `MemorySaver` / MongoDB persistence | Thread checkpointing and resumption per planning run |

---

## 5. Deterministic Pure Engines (`apps/server/src/engines`)

> **Architectural Rule:** Math, distance geometry, and schedule validation are strictly handled by pure deterministic algorithms — **zero floating-point math and zero LLM arithmetic**.

| Engine | Core Library / Algorithm | Responsibility |
|---|---|---|
| **Budget Engine** | **decimal.js** (`^10.6.0`) | Exact integer arithmetic in currency smallest units (cents/pence/paise). Calculates category breakdowns, contingency buffers, and variances with zero floating-point drift |
| **Route Optimizer** | **Nearest-Neighbor TSP Heuristic** | Solves Traveling Salesperson problem for daily stops to minimize cumulative transit time and eliminate backtracking |
| **Schedule Validator** | **Deterministic Time Arithmetic** | Enforces chronological stop sequencing ($Start_B \ge End_A + Transit$) and daily maximum pace caps |
| **Critic Engine** | **Two-Stage Auditor** | Stage A audits quantitative schedule constraints; Stage B audits qualitative weather coherence (flags outdoor attractions on rainy forecast days) |
| **Replanner Engine** | **Bounded State Machine ($\le 2$)** | Computes surgical localized itinerary patches for disrupted days while preserving unaffected days |

---

## 6. Database & Persistence Layer (`apps/server/src/models`)

| Technology | Version | Purpose |
|---|---|---|
| **MongoDB** | `v7.0+` / `v8.0+` | Primary document database storing Users, Trips, TripVersions, and PlanningRuns |
| **Mongoose** | `^8.14.0` | Object Data Modeling (ODM) with strict TypeScript document interfaces, indexes, and timestamps |
| **mongodb-memory-server** | `^11.3.0` | Embedded in-memory MongoDB engine for 100% offline automated testing and standalone zero-dependency CLI demo |
| **Docker Compose** | `docker-compose.yml` | Containerized persistent local MongoDB instance for development |

---

## 7. Real-Time Event Streaming & SSE

| Technology | Purpose |
|---|---|
| **Server-Sent Events (SSE)** | Unidirectional real-time progress streaming (`text/event-stream`) over HTTP from server to browser |
| **Node.js `EventEmitter`** | In-memory pub-sub event broker (`RunEventService`) with circular history buffer for replaying past events to late-connecting clients |
| **Native `EventSource`** | Browser-native event consumer supporting connection keep-alives and event-type listeners |

---

## 8. External Provider & Adapter Layer (`apps/server/src/providers`)

> Implemented using the **Adapter Pattern** with interchangeable interfaces (`IPlacesProvider`, `IRoutesProvider`, `IWeatherProvider`, `IFlightsProvider`, `IHotelsProvider`).

| Domain | Live Engine | Fixture Fallback |
|---|---|---|
| **Places / Attractions** | **Google Places API (New)** (`places.googleapis.com/v1`) | `PlacesFixtureAdapter` (Canned attractions, ratings, lat/lng) |
| **Routes & Matrix** | **Google Routes API** (`routes.googleapis.com/directions/v2`) | `RoutesFixtureAdapter` (Haversine & canned transit matrices) |
| **Weather Forecast** | **OpenWeatherMap 5-Day API** (`api.openweathermap.org/data/2.5/forecast`) | `WeatherFixtureAdapter` (Canned rain & sunshine profiles) |
| **Flight Offers** | *Plug-in ready:* Duffel API / Amadeus | `FlightsFixtureAdapter` (Direct & layover flight offers) |
| **Hotel Accommodations** | *Plug-in ready:* Booking.com (RapidAPI) / LiteAPI | `HotelsFixtureAdapter` (Central stays, ratings, nightly rates) |

---

## 9. Observability & Telemetry

| Technology | Purpose |
|---|---|
| **LangSmith** | Visual execution graph traces, node latency metrics, token consumption tracking, and metadata tagging |
| **Structured Run Logs** | Stage progress tracking (10% $\rightarrow$ 25% $\rightarrow$ 45% $\rightarrow$ 65% $\rightarrow$ 80% $\rightarrow$ 100%) stored in `PlanningRunModel` |

---

## 10. Frontend Client (`apps/client`)

| Technology | Version | Purpose |
|---|---|---|
| **React** | `^19.1.0` | Component architecture, state management, and Concurrent React primitives |
| **React DOM** | `^19.1.0` | DOM rendering and reconciliation |
| **Vite** | `^6.3.0` | Development server, HMR, and optimized production bundler |
| **@vitejs/plugin-react** | `^4.5.0` | Fast Refresh and JSX transformation |
| **Custom Design System** | Modern Vanilla CSS (`app.css`) | High-end dark theme (Linear/Claude aesthetic), responsive flex/grid layouts, animated progress bars, SVG route map, zero external CSS dependency bloat |
| **Component Hierarchy** | Clean modular design | `Navbar`, `TripBuilder`, `PlanningProgress`, `ItineraryView`, `BudgetView`, `MapStopList`, `VersionHistoryView`, `PreferencesModal`, `ReplanModal` |

---

## 11. Testing & Verification Suite

| Tool | Version | Scope |
|---|---|---|
| **Vitest** | `^3.2.0` | Fast ESM unit & integration test runner |
| **Supertest** | `^7.1.0` | End-to-end HTTP endpoint assertion library |
| **Test Coverage** | **101 Tests Passing** | Contracts validation, Engines math, Provider adapters, Supervisor routing, Critic/Replanner, Auth JWT, Trips CRUD, SSE events, and Evals |
| **Evaluation Suite** | `evals.test.ts` | Multi-currency budget invariants, chronological non-overlap, weather disruption detection, replan pass bounds, and tenant isolation |

---

## 12. Complete Architecture Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
│               React 19 + Vite + TypeScript + Native SSE                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / SSE Stream
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           API & MIDDLEWARE                             │
│       Express 4 • Helmet • CORS • JWT Auth • Zod Validation            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│      MULTI-AGENT PIPELINE       │   │      DETERMINISTIC ENGINES       │
│         LangGraph.js            │   │                                  │
│  • Supervisor (Task Routing)    │   │  • Budget Engine (decimal.js)    │
│  • Parallel Specialist Fan-Out  │──▶│  • Route Optimizer (TSP Heuristic│
│  • Two-Stage Critic Audit       │   │  • Schedule Validator            │
│  • Bounded Replanner (<= 2)     │   │  • Version Diff Comparator       │
└────────────────┬────────────────┘   └──────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA & STORAGE LAYER                            │
│    MongoDB 7/8 (Mongoose ODM) • InMemory Mongo • LangSmith Tracing     │
│       Live Adapters: Google Places (New), Google Routes, OpenWeather   │
└────────────────────────────────────────────────────────────────────────┘
```
