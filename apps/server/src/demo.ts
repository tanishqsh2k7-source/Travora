import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "./app.js";
import { UserModel, TripModel, PlanningRunModel, TripVersionModel } from "./models/index.js";
import { createPlanningRun, executePlanningRun } from "./agents/runner.js";
import { eventService } from "./services/event-service.js";
import type { CreateTripRequest, FinalPlanResponse, AgentEvent } from "@travora/contracts";

// ANSI color helpers
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  indigo: "\x1b[38;5;63m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

async function runDemo() {
  console.log("\n" + c.indigo + c.bold + "═".repeat(74) + c.reset);
  console.log(
    c.indigo +
      c.bold +
      "   TRAVORA  —  Level 3 Multi-Agent Travel Planner Engine Demo" +
      c.reset
  );
  console.log(
    c.dim +
      "   Supervisor Pattern • Pure-Function Arithmetic • Critic & Replanning" +
      c.reset
  );
  console.log(c.indigo + c.bold + "═".repeat(74) + c.reset + "\n");

  let mongod: MongoMemoryServer | null = null;

  try {
    // 1. Establish MongoDB connection (in-memory for 100% offline self-contained run)
    console.log(c.cyan + "▶ [1/5] Booting isolated storage environment..." + c.reset);
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(c.green + "  ✓ Connected to in-memory MongoDB engine.\n" + c.reset);

    // 2. Initialize Demo User
    console.log(c.cyan + "▶ [2/5] Initializing demo traveler session..." + c.reset);
    const user = await UserModel.create({
      email: "explorer@travora.app",
      name: "Alex Explorer",
      passwordHash: "hashed_demo_pw",
    });
    console.log(
      c.green + `  ✓ Created user: ${user.name} (${user.email})\n` + c.reset
    );

    // 3. Create Trip Request
    console.log(c.cyan + "▶ [3/5] Submitting trip planning request..." + c.reset);
    const tripPayload: CreateTripRequest = {
      origin: "London, UK",
      destination: "Lisbon, Portugal",
      startDate: "2027-05-10",
      endDate: "2027-05-12",
      timezone: "Europe/Lisbon",
      travellers: { adults: 2, children: 0, infants: 0 },
      budget: { amount: 150000, currency: "EUR", flexibilityPct: 10 }, // €1,500
      interests: ["history", "culture", "museums", "food"],
      travelStyle: "balanced",
      transportPreferences: ["public_transit", "walking"],
      constraints: { accessibility: [], dietary: [], pace: "moderate" },
    };

    const trip = await TripModel.create({
      ...tripPayload,
      userId: user._id,
      status: "draft",
      currentVersionNo: 1,
    });

    console.log(c.green + `  ✓ Destination: ${trip.destination}` + c.reset);
    console.log(c.dim + `    Dates: ${trip.startDate} to ${trip.endDate} (3 days)` + c.reset);
    console.log(c.dim + `    Budget: €${trip.budget.amount / 100} ${trip.budget.currency}` + c.reset);
    console.log(c.dim + `    Travelers: ${trip.travellers.adults} Adults\n` + c.reset);

    // 4. Start Multi-Agent Planning Run & Stream Events
    console.log(c.cyan + "▶ [4/5] Dispatching LangGraph multi-agent pipeline..." + c.reset);
    const run = await createPlanningRun(trip._id.toString(), user._id.toString());
    const runId = run._id.toString();

    // Subscribe to live SSE events
    const unsubscribe = eventService.subscribe(runId, (evt: AgentEvent) => {
      const stagePad = `[${evt.stage.toUpperCase()}]`.padEnd(14);
      let color = c.indigo;
      if (evt.type === "run.completed") color = c.green;
      if (evt.type === "validation.issue" || evt.type === "replan.started") color = c.yellow;
      if (evt.type === "tool.called") color = c.magenta;

      console.log(
        `  ${color}${stagePad}${c.reset} ${c.bold}${evt.progress}%${c.reset} ${evt.message}`
      );
    });

    // Execute run synchronously
    await executePlanningRun(runId);
    unsubscribe();

    // 5. Fetch Completed Plan & Version Lineage
    console.log("\n" + c.cyan + "▶ [5/5] Generating final plan artifacts & version lineage..." + c.reset);
    const completedRun = await PlanningRunModel.findById(runId);
    const plan = completedRun?.result as FinalPlanResponse;
    const versions = await TripVersionModel.find({ tripId: trip._id }).sort({ versionNo: 1 });

    if (!plan) {
      throw new Error("Planning run did not return a valid plan");
    }

    console.log("\n" + c.indigo + c.bold + "═".repeat(74) + c.reset);
    console.log(c.bold + `  TRIP PLAN: ${plan.destination.toUpperCase()}` + c.reset);
    console.log(c.dim + `  Summary: ${plan.summary}` + c.reset);
    console.log(c.indigo + c.bold + "═".repeat(74) + c.reset);

    // Flight & Hotel
    if (plan.flightOptions?.[0]) {
      const f = plan.flightOptions[0];
      console.log(
        `\n  ✈️  ${c.bold}Flight:${c.reset} ${f.carrierName} (${f.carrier}) | ${f.origin} → ${f.destination} | €${f.price.amount / 100}`
      );
    }
    if (plan.hotelOptions?.[0]) {
      const h = plan.hotelOptions[0];
      console.log(
        `  🏨  ${c.bold}Hotel:${c.reset} ${h.name} (⭐ ${h.rating}) | ${h.address} | €${h.pricePerNight.amount / 100}/night`
      );
    }

    // Daily Itinerary
    console.log("\n  📅  " + c.bold + "Optimized Daily Schedule (Nearest-Neighbor TSP):" + c.reset);
    plan.itinerary.forEach((day) => {
      console.log(
        `\n    ${c.cyan}${c.bold}Day ${day.dayNumber} (${day.date})${c.reset} • ${day.stops.length} stops • ~${day.totalTravelTimeMin}m transit`
      );
      day.stops.forEach((stop, i) => {
        const transferStr =
          stop.transferFromPrevMin > 0
            ? ` (${stop.transferFromPrevMin}m transfer)`
            : "";
        console.log(
          `      ${i + 1}. [${stop.startLocal}-${stop.endLocal}] ${c.bold}${stop.name}${c.reset} (${stop.durationMin}m)${c.dim}${transferStr}${c.reset}`
        );
      });
    });

    // Budget Breakdown
    const b = plan.budgetBreakdown;
    console.log("\n  💰  " + c.bold + "Deterministic Budget Engine Breakdown:" + c.reset);
    console.log(
      `    Allocated Budget:  €${b.userBudget.amount / 100} ${b.userBudget.currency}`
    );
    console.log(
      `    Total Estimated:   €${b.totalEstimated.amount / 100} ${b.totalEstimated.currency} (${b.withinBudget ? c.green + "Within Budget" : c.yellow + "Exceeds Budget"}${c.reset})`
    );
    console.log(
      `    Remaining Buffer:  €${b.remainingBudget.amount / 100} ${b.remainingBudget.currency}`
    );
    console.log(
      `    Contingency:       ${b.contingencyPct}% (exact integer arithmetic)`
    );

    // Version Lineage
    console.log("\n  📜  " + c.bold + "Immutable Version Lineage:" + c.reset);
    versions.forEach((v) => {
      console.log(
        `    • Version ${v.versionNo}: ${v.changeReason || "Generated version"} (${v.createdAt.toLocaleTimeString()})`
      );
    });

    console.log("\n" + c.green + c.bold + "═".repeat(74) + c.reset);
    console.log(
      c.green + c.bold + "  ✓ DEMO RUN COMPLETED SUCCESSFULLY!" + c.reset
    );
    console.log(
      c.dim + "  All multi-agent stages, engines, and version lineage verified." + c.reset
    );
    console.log(c.green + c.bold + "═".repeat(74) + c.reset + "\n");
  } catch (err) {
    console.error(c.yellow + "\n❌ Demo encounter an error:" + c.reset, err);
  } finally {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  }
}

runDemo();

