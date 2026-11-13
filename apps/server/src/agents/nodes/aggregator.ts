import mongoose from "mongoose";
import type { TravelState, TravelStateUpdate } from "../state.js";
import type { FinalPlanResponse } from "@travora/contracts";
import { TripModel, TripVersionModel } from "../../models/index.js";

export async function aggregatorNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  const sources = [
    { provider: "places_fixture", fetchedAt: new Date().toISOString() },
    { provider: "routes_fixture", fetchedAt: new Date().toISOString() },
    { provider: "weather_fixture", fetchedAt: new Date().toISOString() },
    { provider: "flights_fixture", fetchedAt: new Date().toISOString() },
    { provider: "hotels_fixture", fetchedAt: new Date().toISOString() },
  ];

  const allWarnings = Array.from(
    new Set([
      ...(state.warnings ?? []),
      ...(state.budgetResult?.warnings ?? []),
      ...(state.validationReport?.warnings ?? []),
    ])
  );

  const finalResponse: FinalPlanResponse = {
    tripId: state.tripId,
    runId: state.runId,
    destination: req.destination,
    dates: {
      startDate: req.startDate,
      endDate: req.endDate,
      totalDays,
    },
    summary: `Curated ${totalDays}-day travel plan for ${req.destination} covering top sights, optimized transit routes, and verified budgets.`,
    itinerary: state.routeResult?.days ?? [],
    budgetBreakdown: state.budgetResult!,
    flightOptions: state.flightsResult ?? [],
    hotelOptions: state.hotelsResult ?? [],
    weatherForecast: state.weatherResult,
    sources,
    warnings: allWarnings,
  };

  // Persist new trip version to MongoDB if connected and tripId is valid
  if (mongoose.connection.readyState !== 0 && mongoose.Types.ObjectId.isValid(state.tripId)) {
    try {
      const trip = await TripModel.findById(state.tripId);
      if (trip) {
        const nextVersionNo = (trip.currentVersionNo ?? 1) + 1;

        await TripVersionModel.create({
          tripId: trip._id,
          versionNo: nextVersionNo,
          changeReason: "Planning run generated complete itinerary",
          createdByRunId: state.runId,
          itineraryData: finalResponse,
        });

        trip.currentVersionNo = nextVersionNo;
        trip.status = "planned";
        await trip.save();
      }
    } catch (err) {
      console.error("[aggregator] Failed to persist trip version:", err);
    }
  }

  return {
    finalResponse,
    status: "completed",
    warnings: allWarnings,
  };
}
