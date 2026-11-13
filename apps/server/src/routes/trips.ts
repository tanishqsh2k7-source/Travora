import { Router } from "express";
import mongoose from "mongoose";
import { CreateTripRequestSchema, type TripResponse } from "@travora/contracts";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { TripModel, TripVersionModel, type ITrip } from "../models/index.js";

export const tripsRouter = Router();

// All trip endpoints require authentication
tripsRouter.use(requireAuth);

function formatTrip(trip: ITrip): TripResponse {
  return {
    id: trip._id.toString(),
    userId: trip.userId.toString(),
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
    status: trip.status,
    currentVersionNo: trip.currentVersionNo ?? 1,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

/**
 * POST /api/v1/trips
 * Create a new trip request for the authenticated user.
 */
tripsRouter.post("/", validateBody(CreateTripRequestSchema), async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const data = req.body;

    const trip = await TripModel.create({
      ...data,
      userId: new mongoose.Types.ObjectId(userId),
      status: "draft",
      currentVersionNo: 1,
    });

    // Create initial trip version
    await TripVersionModel.create({
      tripId: trip._id,
      versionNo: 1,
      changeReason: "Initial trip request created",
      itineraryData: {},
    });

    res.status(201).json(formatTrip(trip));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/trips
 * List all trips for the authenticated user.
 */
tripsRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const trips = await TripModel.find({ userId }).sort({ createdAt: -1 });
    res.json(trips.map(formatTrip));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/trips/:tripId
 * Get a specific trip by ID.
 * Strict ownership check: returns 404 if not found, 403 if belonging to another user.
 */
tripsRouter.get("/:tripId", async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const currentUserId = req.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      res.status(400).json({ error: "Invalid trip ID format" });
      return;
    }

    const trip = await TripModel.findById(tripId);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    // Ownership check
    if (trip.userId.toString() !== currentUserId) {
      res.status(403).json({ error: "Access denied to this trip" });
      return;
    }

    res.json(formatTrip(trip));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/trips/:tripId/versions
 * List historical plan versions for a trip.
 */
tripsRouter.get("/:tripId/versions", async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const currentUserId = req.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      res.status(400).json({ error: "Invalid trip ID format" });
      return;
    }

    const trip = await TripModel.findById(tripId);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    if (trip.userId.toString() !== currentUserId) {
      res.status(403).json({ error: "Access denied to this trip" });
      return;
    }

    const versions = await TripVersionModel.find({ tripId: trip._id }).sort({ versionNo: 1 });
    res.json(
      versions.map((v) => ({
        id: v._id.toString(),
        tripId: v.tripId.toString(),
        versionNo: v.versionNo,
        changeReason: v.changeReason,
        createdAt: v.createdAt.toISOString(),
        hasItinerary: Boolean(v.itineraryData && Object.keys(v.itineraryData).length > 0),
      }))
    );
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/trips/:tripId/versions/:versionNo
 * Retrieve full plan payload for a specific trip version.
 */
tripsRouter.get("/:tripId/versions/:versionNo", async (req, res, next) => {
  try {
    const { tripId, versionNo } = req.params;
    const currentUserId = req.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      res.status(400).json({ error: "Invalid trip ID format" });
      return;
    }

    const versionNumber = parseInt(versionNo, 10);
    if (isNaN(versionNumber) || versionNumber < 1) {
      res.status(400).json({ error: "Invalid version number" });
      return;
    }

    const trip = await TripModel.findById(tripId);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    if (trip.userId.toString() !== currentUserId) {
      res.status(403).json({ error: "Access denied to this trip" });
      return;
    }

    const version = await TripVersionModel.findOne({
      tripId: trip._id,
      versionNo: versionNumber,
    });

    if (!version) {
      res.status(404).json({ error: "Trip version not found" });
      return;
    }

    res.json({
      id: version._id.toString(),
      tripId: version.tripId.toString(),
      versionNo: version.versionNo,
      changeReason: version.changeReason,
      itineraryData: version.itineraryData,
      createdAt: version.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/trips/:tripId/versions/:versionNo/restore
 * Restores a specific historical version as the active trip version.
 */
tripsRouter.post("/:tripId/versions/:versionNo/restore", async (req, res, next) => {
  try {
    const { tripId, versionNo } = req.params;
    const currentUserId = req.user!.userId;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      res.status(400).json({ error: "Invalid trip ID format" });
      return;
    }

    const versionNumber = parseInt(versionNo, 10);
    if (isNaN(versionNumber) || versionNumber < 1) {
      res.status(400).json({ error: "Invalid version number" });
      return;
    }

    const trip = await TripModel.findById(tripId);
    if (!trip) {
      res.status(404).json({ error: "Trip not found" });
      return;
    }

    if (trip.userId.toString() !== currentUserId) {
      res.status(403).json({ error: "Access denied to this trip" });
      return;
    }

    const targetVersion = await TripVersionModel.findOne({
      tripId: trip._id,
      versionNo: versionNumber,
    });

    if (!targetVersion) {
      res.status(404).json({ error: "Target trip version not found" });
      return;
    }

    trip.currentVersionNo = versionNumber;
    await trip.save();

    res.json({
      message: `Restored version ${versionNumber} as active version`,
      trip: formatTrip(trip),
      version: {
        id: targetVersion._id.toString(),
        versionNo: targetVersion.versionNo,
        changeReason: targetVersion.changeReason,
        itineraryData: targetVersion.itineraryData,
        createdAt: targetVersion.createdAt.toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

