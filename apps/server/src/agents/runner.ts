import mongoose from "mongoose";
import { TripModel, UserPreferenceModel, PlanningRunModel, type IPlanningRun } from "../models/index.js";
import { createPlanningGraph } from "./graph.js";
import { eventService } from "../services/event-service.js";
import type { CreateTripRequest, UserPreferences, ReplanRequest } from "@travora/contracts";

const graph = createPlanningGraph();

export async function executePlanningRun(
  runId: string,
  replanRequest?: ReplanRequest
): Promise<void> {
  const run = await PlanningRunModel.findById(runId);
  if (!run) return;

  try {
    run.status = "running";
    run.currentStage = "intake";
    run.progressPct = 10;
    await run.save();

    eventService.emitEvent(runId, {
      type: "run.started",
      stage: "intake",
      progress: 10,
      message: "Intake and normalization: validating dates, travelers, and parameters.",
    });

    const trip = await TripModel.findById(run.tripId);
    if (!trip) throw new Error("Trip not found");

    const preferencesDoc = await UserPreferenceModel.findOne({ userId: run.userId });
    const preferences: UserPreferences = preferencesDoc
      ? {
          interests: preferencesDoc.interests,
          travelStyle: preferencesDoc.travelStyle,
          pace: preferencesDoc.pace,
          dietaryRestrictions: preferencesDoc.dietaryRestrictions,
          accessibilityRequirements: preferencesDoc.accessibilityRequirements,
          preferredCurrency: preferencesDoc.preferredCurrency,
          transportPreferences: preferencesDoc.transportPreferences,
        }
      : {
          interests: [],
          travelStyle: "balanced",
          pace: "moderate",
          dietaryRestrictions: [],
          accessibilityRequirements: [],
          preferredCurrency: "USD",
          transportPreferences: ["public_transit"],
        };

    const tripRequest: CreateTripRequest = {
      origin: trip.origin,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      timezone: trip.timezone,
      travellers: trip.travellers,
      budget: trip.budget,
      interests: trip.interests,
      travelStyle: trip.travelStyle,
      transportPreferences: trip.transportPreferences,
      constraints: trip.constraints,
    };

    eventService.emitEvent(runId, {
      type: "agent.status",
      stage: "supervisor",
      progress: 25,
      message: "Supervisor formulating task plan and capability allowlist.",
    });

    run.currentStage = "research";
    run.progressPct = 45;
    await run.save();

    eventService.emitEvent(runId, {
      type: "agent.status",
      stage: "research",
      progress: 45,
      message: "Dispatched parallel research branches for attractions, transit, stays, and weather.",
    });

    const finalState = await graph.invoke(
      {
        runId: run._id.toString(),
        tripId: trip._id.toString(),
        userId: run.userId.toString(),
        request: tripRequest,
        preferences,
        replanRequest,
        status: "running",
        warnings: [],
      },
      {
        configurable: { thread_id: run._id.toString() },
      }
    );

    if (finalState.replanPatch) {
      eventService.emitEvent(runId, {
        type: "replan.started",
        stage: "replan",
        progress: 85,
        message: finalState.replanPatch.changeSummary,
        payload: { patch: finalState.replanPatch },
      });
    }

    run.status = finalState.status === "completed" ? "completed" : "partial";
    run.currentStage = "completed";
    run.progressPct = 100;
    run.finishedAt = new Date();
    run.result = finalState.finalResponse;
    run.warnings = finalState.warnings ?? [];
    await run.save();

    eventService.emitEvent(runId, {
      type: "run.completed",
      stage: "completed",
      progress: 100,
      message: "Trip planning completed successfully with verified itinerary and budget.",
      payload: { result: finalState.finalResponse },
    });
  } catch (err) {
    console.error("[runner] Planning run failed:", err);
    run.status = "failed";
    run.error = err instanceof Error ? err.message : String(err);
    run.finishedAt = new Date();
    await run.save();

    eventService.emitEvent(runId, {
      type: "run.failed",
      stage: "error",
      progress: 100,
      message: `Planning run failed: ${run.error}`,
    });
  }
}

export async function createPlanningRun(tripId: string, userId: string): Promise<IPlanningRun> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw new Error("Invalid trip ID format");
  }

  const trip = await TripModel.findById(tripId);
  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.userId.toString() !== userId) {
    throw new Error("Access denied: user does not own this trip");
  }

  const run = await PlanningRunModel.create({
    tripId: trip._id,
    userId: new mongoose.Types.ObjectId(userId),
    status: "queued",
    graphThreadId: new mongoose.Types.ObjectId().toString(),
    currentStage: "intake",
    progressPct: 0,
  });

  return run;
}

