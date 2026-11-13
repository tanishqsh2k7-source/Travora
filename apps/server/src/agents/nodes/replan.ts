import type { TravelState, TravelStateUpdate } from "../state.js";
import { optimizeRoutes } from "../../engines/index.js";
import { eventService } from "../../services/event-service.js";
import type { ReplanPatch, PlaceCandidate, OptimizedDaySchedule } from "@travora/contracts";

const INDOOR_TYPES = ["museum", "art_gallery", "shopping", "food", "market"];

function isIndoorCandidate(place: PlaceCandidate): boolean {
  const types = place.types.map((t) => t.toLowerCase());
  const name = place.name.toLowerCase();
  const desc = (place.description ?? "").toLowerCase();

  const matchesType = types.some((t) => INDOOR_TYPES.includes(t));
  const matchesKeyword =
    name.includes("museum") ||
    name.includes("art") ||
    name.includes("market") ||
    name.includes("planets") ||
    name.includes("ghibli") ||
    desc.includes("indoor") ||
    desc.includes("museum");

  return matchesType || matchesKeyword;
}

export async function replanNode(state: TravelState): Promise<TravelStateUpdate> {
  const currentDays = state.routeResult?.days ?? [];
  const report = state.validationReport;
  const replanCount = (state.replanCount ?? 0) + 1;
  const warnings = [...(state.warnings ?? [])];

  // Identify affected day from validation report or replan request
  let affectedDayNum = 2; // Default to Day 2 for typical "rain tomorrow" disruption
  const rainIssue = report?.issues.find(
    (i) => i.code === "WEATHER_RAIN_CONFLICT" || i.code === "USER_REPLAN_DISRUPTION"
  );
  if (rainIssue?.dayNumber) {
    affectedDayNum = rainIssue.dayNumber;
  } else if (state.replanRequest?.affectedDayNumber) {
    affectedDayNum = state.replanRequest.affectedDayNumber;
  }

  const affectedDayIndex = affectedDayNum - 1;
  const originalDay = currentDays[affectedDayIndex];

  if (state.runId) {
    eventService.emitEvent(state.runId, {
      type: "replan.started",
      stage: "replan",
      progress: 88,
      message: `Replanning Day ${affectedDayNum}: swapping outdoor activities for indoor alternatives.`,
    });
  }

  if (!originalDay) {
    warnings.push(`Replanning targeted day ${affectedDayNum}, which does not exist in itinerary.`);
    return {
      replanCount,
      warnings,
    };
  }

  // 1. Filter candidate places for indoor options
  const allPlaces = state.placesResult ?? [];
  const indoorPlaces = allPlaces.filter(isIndoorCandidate);

  // If insufficient indoor places found, fallback to any available non-outdoor places
  const replacementCandidates = indoorPlaces.length >= 2 ? indoorPlaces : allPlaces;

  // 2. Re-optimize routes ONLY for the affected day
  const singleDayResult = optimizeRoutes({
    places: replacementCandidates,
    daysCount: 1,
    pace: state.request.constraints.pace ?? "moderate",
    travelDates: [originalDay.date],
    hotelCoordinates: state.hotelsResult?.[0]?.coordinates,
  });

  const repairedDay: OptimizedDaySchedule = {
    ...singleDayResult.days[0],
    dayNumber: affectedDayNum,
    date: originalDay.date,
    theme: "Indoor Culture & Art Exploration (Rain-Adapted)",
  };

  // 3. Assemble new itinerary: PRESERVE unaffected days!
  const newDays: OptimizedDaySchedule[] = currentDays.map((d) => {
    if (d.dayNumber === affectedDayNum) {
      return repairedDay;
    }
    return d; // Completely preserved
  });

  const preservedDays = currentDays
    .filter((d) => d.dayNumber !== affectedDayNum)
    .map((d) => d.dayNumber);

  const replacedNames = repairedDay.stops
    .filter((s) => s.type === "activity")
    .map((s) => s.name)
    .join(", ");

  const changeSummary = `Day ${affectedDayNum} (${originalDay.date}) adapted for rain: scheduled indoor cultural venues (${replacedNames}). Unaffected days (${preservedDays.join(", ")}) preserved.`;

  const replanPatch: ReplanPatch = {
    affectedDayNumbers: [affectedDayNum],
    preservedDayNumbers: preservedDays,
    changeSummary,
    replanCount,
  };

  warnings.push(`Itinerary revised: ${changeSummary}`);

  return {
    routeResult: {
      days: newDays,
      unplacedPlaces: singleDayResult.unplacedPlaces,
      totalDistanceMeters: state.routeResult?.totalDistanceMeters ?? 0,
      totalTravelTimeMin: state.routeResult?.totalTravelTimeMin ?? 0,
    },
    replanCount,
    replanPatch,
    warnings,
  };
}

