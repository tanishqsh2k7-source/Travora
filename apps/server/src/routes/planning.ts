import { Router } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middleware/auth.js";
import { PlanningRunModel, TripModel } from "../models/index.js";
import { createPlanningRun, executePlanningRun } from "../agents/runner.js";

export const planningRouter = Router();

planningRouter.use(requireAuth);

/**
 * POST /api/v1/trips/:tripId/plan
 * Starts a new multi-agent planning run for a trip.
 */
planningRouter.post("/trips/:tripId/plan", async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user!.userId;

    const run = await createPlanningRun(tripId, userId);

    const execPromise = executePlanningRun(run._id.toString());
    if (req.query.sync === "true") {
      await execPromise;
    } else {
      execPromise.catch((err) => {
        console.error(`[planningRouter] Error executing run ${run._id}:`, err);
      });
    }

    res.status(202).json({
      runId: run._id.toString(),
      tripId,
      status: req.query.sync === "true" ? "completed" : "queued",
      eventsUrl: `/api/v1/runs/${run._id.toString()}/events`,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("Access denied")) {
        res.status(403).json({ error: err.message });
        return;
      }
      if (err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message.includes("Invalid trip ID")) {
        res.status(400).json({ error: err.message });
        return;
      }
    }
    next(err);
  }
});

/**
 * GET /api/v1/runs/:runId
 * Retrieves status and full result of a planning run.
 */
planningRouter.get("/runs/:runId", async (req, res, next) => {
  try {
    const { runId } = req.params;
    const userId = req.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(runId)) {
      res.status(400).json({ error: "Invalid run ID format" });
      return;
    }

    const run = await PlanningRunModel.findById(runId);
    if (!run) {
      res.status(404).json({ error: "Planning run not found" });
      return;
    }

    if (run.userId.toString() !== userId) {
      res.status(403).json({ error: "Access denied to this planning run" });
      return;
    }

    res.json({
      runId: run._id.toString(),
      tripId: run.tripId.toString(),
      status: run.status,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString(),
      currentStage: run.currentStage,
      progressPct: run.progressPct,
      error: run.error,
      warnings: run.warnings,
      result: run.result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/trips/:tripId/runs
 * Lists all historical planning runs for a trip.
 */
planningRouter.get("/trips/:tripId/runs", async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      res.status(400).json({ error: "Invalid trip ID format" });
      return;
    }

    const trip = await TripModel.findById(tripId);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    if (trip.userId.toString() !== userId) {
      res.status(403).json({ error: "Access denied to this trip" });
      return;
    }

    const runs = await PlanningRunModel.find({ tripId }).sort({ createdAt: -1 });

    res.json(
      runs.map((r) => ({
        runId: r._id.toString(),
        tripId: r.tripId.toString(),
        status: r.status,
        progressPct: r.progressPct,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString(),
        error: r.error,
      }))
    );
  } catch (err) {
    next(err);
  }
});

