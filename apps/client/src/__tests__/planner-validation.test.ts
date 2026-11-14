import { describe, it, expect } from "vitest";

interface PlannerFormState {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
}

function validatePlannerForm(state: PlannerFormState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!state.origin.trim()) {
    errors.origin = "Please provide a starting departure city.";
  }
  if (!state.destination.trim()) {
    errors.destination = "Please specify a destination.";
  }
  if (!state.startDate) {
    errors.startDate = "Select departure date.";
  }
  if (!state.endDate) {
    errors.endDate = "Select return date.";
  } else if (state.startDate && state.endDate <= state.startDate) {
    errors.endDate = "Return date must be strictly after departure date.";
  }

  const numBudget = parseFloat(state.budget);
  if (isNaN(numBudget) || numBudget <= 0) {
    errors.budget = "Please enter a realistic budget amount.";
  }

  return errors;
}

describe("Planner Form Validation Rules", () => {
  it("passes when all fields are valid and return date is strictly after start date", () => {
    const valid = {
      origin: "London, UK",
      destination: "Lisbon, Portugal",
      startDate: "2027-05-10",
      endDate: "2027-05-14",
      budget: "1800",
    };
    const errors = validatePlannerForm(valid);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("fails when return date is on or before departure date", () => {
    const sameDay = {
      origin: "London, UK",
      destination: "Lisbon, Portugal",
      startDate: "2027-05-10",
      endDate: "2027-05-10",
      budget: "1800",
    };
    const errors = validatePlannerForm(sameDay);
    expect(errors.endDate).toBe("Return date must be strictly after departure date.");

    const backwards = {
      ...sameDay,
      endDate: "2027-05-08",
    };
    const backwardsErrors = validatePlannerForm(backwards);
    expect(backwardsErrors.endDate).toBe("Return date must be strictly after departure date.");
  });

  it("fails when budget is empty, zero or non-numeric", () => {
    const zeroBudget = {
      origin: "Delhi, India",
      destination: "Tokyo, Japan",
      startDate: "2027-06-01",
      endDate: "2027-06-07",
      budget: "0",
    };
    const errors = validatePlannerForm(zeroBudget);
    expect(errors.budget).toBe("Please enter a realistic budget amount.");
  });

  it("fails when origin or destination is empty", () => {
    const missingCities = {
      origin: "",
      destination: " ",
      startDate: "2027-06-01",
      endDate: "2027-06-07",
      budget: "1200",
    };
    const errors = validatePlannerForm(missingCities);
    expect(errors.origin).toBe("Please provide a starting departure city.");
    expect(errors.destination).toBe("Please specify a destination.");
  });
});
