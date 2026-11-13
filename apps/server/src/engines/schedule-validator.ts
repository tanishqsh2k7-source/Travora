import type {
  OptimizedDaySchedule,
  ValidationReport,
  ValidationIssue,
  BudgetBreakdown,
  PlaceCandidate,
} from "@travora/contracts";

export interface ScheduleValidatorInput {
  days: OptimizedDaySchedule[];
  budgetBreakdown?: BudgetBreakdown;
  placesMap?: Map<string, PlaceCandidate>;
  maxDailyActiveHours?: number; // default 9 hours
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function validateSchedule(input: ScheduleValidatorInput): ValidationReport {
  const issues: ValidationIssue[] = [];
  const warnings: string[] = [];
  const passedChecks: string[] = [];

  const maxHours = input.maxDailyActiveHours ?? 9;
  const maxMinutes = maxHours * 60;

  // ── 1. Check Budget Constraints ──────────────────────────────────────────
  if (input.budgetBreakdown) {
    if (!input.budgetBreakdown.withinBudget) {
      issues.push({
        code: "BUDGET_OVER_HARD_CAP",
        severity: "BLOCKER",
        message: `Plan exceeds hard budget cap. Total: ${input.budgetBreakdown.totalEstimated.currency} ${input.budgetBreakdown.totalEstimated.amount / 100}, Budget: ${input.budgetBreakdown.userBudget.amount / 100}`,
        repairSuggestion: "Reduce hotel class or select alternative flight offers",
      });
    } else if (input.budgetBreakdown.overBudgetAmount) {
      issues.push({
        code: "BUDGET_ABOVE_TARGET",
        severity: "WARNING",
        message: `Plan exceeds target budget by ${input.budgetBreakdown.overBudgetAmount.currency} ${input.budgetBreakdown.overBudgetAmount.amount / 100}, but is within flexibility tolerance`,
      });
    } else {
      passedChecks.push("Budget within target limits");
    }
  }

  // ── 2. Check Each Day Schedule ───────────────────────────────────────────
  for (const day of input.days) {
    const stops = day.stops;

    if (stops.length === 0) {
      warnings.push(`Day ${day.dayNumber} has no scheduled stops`);
      continue;
    }

    let hasLunchBreak = false;
    let dayOverlaps = false;
    let daySequenceBroken = false;

    // Daily load check
    const totalDaySpanMin =
      timeToMinutes(stops[stops.length - 1].endLocal) - timeToMinutes(stops[0].startLocal);

    if (totalDaySpanMin > maxMinutes) {
      issues.push({
        code: "DAILY_LOAD_EXCEEDED",
        severity: "WARNING",
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber} duration (${(totalDaySpanMin / 60).toFixed(1)} hrs) exceeds recommended ${maxHours} hours`,
        repairSuggestion: "Move the last activity to unplaced or another day",
      });
    } else {
      passedChecks.push(`Day ${day.dayNumber} load within bounds`);
    }

    // Stop-by-stop checks
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const startMin = timeToMinutes(stop.startLocal);
      const endMin = timeToMinutes(stop.endLocal);

      if (stop.type === "meal") {
        hasLunchBreak = true;
      }

      // Start must be strictly before end
      if (startMin >= endMin) {
        issues.push({
          code: "INVALID_STOP_TIME_WINDOW",
          severity: "BLOCKER",
          dayNumber: day.dayNumber,
          itemId: stop.id,
          message: `Stop "${stop.name}" has invalid time window: ${stop.startLocal} - ${stop.endLocal}`,
        });
      }

      // Check chronological ordering and time overlap with next stop
      if (i < stops.length - 1) {
        const nextStop = stops[i + 1];
        const nextStartMin = timeToMinutes(nextStop.startLocal);

        if (endMin > nextStartMin) {
          dayOverlaps = true;
          issues.push({
            code: "TIME_OVERLAP",
            severity: "BLOCKER",
            dayNumber: day.dayNumber,
            itemId: stop.id,
            message: `Stop "${stop.name}" (${stop.endLocal}) overlaps with next stop "${nextStop.name}" (${nextStop.startLocal})`,
            repairSuggestion: "Shift next stop later or reduce activity duration",
          });
        }

        // Check transfer feasibility
        if (nextStop.distanceFromPrevMeters > 5000 && nextStop.transferFromPrevMin < 10) {
          issues.push({
            code: "INSUFFICIENT_TRANSFER_TIME",
            severity: "WARNING",
            dayNumber: day.dayNumber,
            itemId: nextStop.id,
            message: `Transfer from "${stop.name}" to "${nextStop.name}" is ${(nextStop.distanceFromPrevMeters / 1000).toFixed(1)}km but only ${nextStop.transferFromPrevMin} min buffer allocated`,
            repairSuggestion: "Add at least 15-20 min transit buffer",
          });
        }
      }

      // Check opening hours if place information is available
      if (input.placesMap && stop.placeId) {
        const place = input.placesMap.get(stop.placeId);
        if (place) {
          if (!place.openingHours || place.openingHours.weekdayText.length === 0) {
            warnings.push(
              `Opening hours unknown for "${place.name}". Verify before visiting.`
            );
          }
        }
      }
    }

    if (!dayOverlaps && !daySequenceBroken) {
      passedChecks.push(`Day ${day.dayNumber} free of schedule overlaps`);
    }

    // Check meal break for full-day itineraries (> 5 hours span)
    if (totalDaySpanMin > 300 && !hasLunchBreak) {
      issues.push({
        code: "MISSING_MEAL_BREAK",
        severity: "QUALITY",
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber} has over 5 hours of continuous schedule without a designated lunch/rest window`,
        repairSuggestion: "Insert a 45-60 minute meal break between 12:00 and 14:00",
      });
    }
  }

  const hasBlockers = issues.some((i) => i.severity === "BLOCKER");
  const isValid = !hasBlockers;

  return {
    isValid,
    hasBlockers,
    issues,
    warnings,
    passedChecks,
  };
}
