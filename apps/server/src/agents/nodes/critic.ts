import type { TravelState, TravelStateUpdate } from "../state.js";
import { validateSchedule } from "../../engines/index.js";
import { eventService } from "../../services/event-service.js";
import type { ValidationReport, ValidationIssue } from "@travora/contracts";

const OUTDOOR_KEYWORDS = [
  "shrine",
  "temple",
  "park",
  "garden",
  "sky",
  "viewpoint",
  "outdoor",
  "street",
  "open-air",
  "tower",
];

function isOutdoorPlace(name: string, types: string[]): boolean {
  const lowerName = name.toLowerCase();
  const matchesKeyword = OUTDOOR_KEYWORDS.some((kw) => lowerName.includes(kw));
  const matchesType = types.some((t) => ["nature", "viewpoint", "park"].includes(t.toLowerCase()));
  return matchesKeyword || matchesType;
}

export async function criticNode(state: TravelState): Promise<TravelStateUpdate> {
  if (state.runId) {
    eventService.emitEvent(state.runId, {
      type: "tool.called",
      stage: "critic",
      progress: 75,
      message: "Critic running two-stage audit: deterministic schedule checks & weather coherence.",
    });
  }

  const days = state.routeResult?.days ?? [];
  const budgetBreakdown = state.budgetResult;
  const placesMap = new Map((state.placesResult ?? []).map((p) => [p.id, p]));

  // ── Stage A: Deterministic Constraint Auditor ─────────────────────────────
  const stageAReport = validateSchedule({
    days,
    budgetBreakdown,
    placesMap,
  });

  const issues: ValidationIssue[] = [...stageAReport.issues];
  const warnings: string[] = [...stageAReport.warnings];
  const passedChecks: string[] = [...stageAReport.passedChecks];

  // ── Stage B: Qualitative / Disruption Review (Weather & Coherence) ──────────
  const weather = state.weatherResult;

  if (weather && weather.daily) {
    for (const dayWeather of weather.daily) {
      if (dayWeather.isRainy) {
        // Find corresponding scheduled day
        const matchedDay = days.find((d) => d.date === dayWeather.date);

        if (matchedDay) {
          const outdoorStops = matchedDay.stops.filter((s) => {
            if (s.type === "meal") return false;
            const place = placesMap.get(s.placeId);
            return isOutdoorPlace(s.name, place?.types ?? []);
          });

          if (outdoorStops.length > 0) {
            const stopNames = outdoorStops.map((s) => s.name).join(", ");
            issues.push({
              code: "WEATHER_RAIN_CONFLICT",
              severity: "BLOCKER",
              dayNumber: matchedDay.dayNumber,
              message: `Day ${matchedDay.dayNumber} (${dayWeather.date}) has heavy rain (${dayWeather.precipitationProb}%), but outdoor activities are scheduled: ${stopNames}`,
              repairSuggestion: "Replace outdoor stops with indoor museums, galleries, or covered markets.",
            });
          } else {
            passedChecks.push(`Day ${matchedDay.dayNumber} is rain-adapted with indoor activities`);
          }
        }
      }
    }
  }

  // Check if an explicit user replan was requested that hasn't been applied yet
  if (state.replanRequest && state.replanCount === 0) {
    const affectedDay = state.replanRequest.affectedDayNumber ?? 2;
    issues.push({
      code: "USER_REPLAN_DISRUPTION",
      severity: "BLOCKER",
      dayNumber: affectedDay,
      message: `User requested itinerary modification: "${state.replanRequest.instruction}"`,
      repairSuggestion: "Execute targeted replan for affected day while preserving other days.",
    });
  }

  const hasBlockers = issues.some((i) => i.severity === "BLOCKER");
  const isValid = !hasBlockers;

  const validationReport: ValidationReport = {
    isValid,
    hasBlockers,
    issues,
    warnings,
    passedChecks,
  };

  if (state.runId && issues.length > 0) {
    eventService.emitEvent(state.runId, {
      type: "validation.issue",
      stage: "critic",
      progress: 80,
      message: `Critic identified issue: ${issues[0].message}`,
      payload: { issues },
    });
  }

  return {
    validationReport,
  };
}

