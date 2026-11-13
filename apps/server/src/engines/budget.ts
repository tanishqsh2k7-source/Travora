import Decimal from "decimal.js";
import type {
  Money,
  Travellers,
  BudgetBreakdown,
  BudgetCategory,
  BudgetAlternative,
  CategoryBreakdownItem,
} from "@travora/contracts";
import {
  toDecimal,
  createMoney,
  addMoney,
  subtractMoney,
  sumMoney,
  percentageOf,
} from "./currency.js";

export interface BudgetEngineInput {
  userBudget: Money;
  flexibilityPct?: number;
  flightsTotal: Money;
  accommodationTotal: Money;
  dailyFoodAllowancePerPerson: Money;
  dailyLocalTransportPerPerson: Money;
  activityTickets: Money[];
  travellers: Travellers;
  daysCount: number;
  contingencyPct?: number;
  flightAlternatives?: Array<{ description: string; price: Money }>;
  hotelAlternatives?: Array<{ description: string; price: Money }>;
}

export function calculateBudget(input: BudgetEngineInput): BudgetBreakdown {
  const currency = input.userBudget.currency;
  const days = Math.max(1, input.daysCount);
  const adults = input.travellers.adults;
  const children = input.travellers.children;
  const contingencyPct = input.contingencyPct ?? 10;
  const flexibilityPct = input.flexibilityPct ?? 5;

  // 1. Food calculation: adults + 75% for children
  const effectiveFoodEaters = new Decimal(adults).plus(new Decimal(children).times(0.75));
  const foodTotalDec = toDecimal(input.dailyFoodAllowancePerPerson.amount)
    .times(effectiveFoodEaters)
    .times(days);
  const foodTotal = createMoney(foodTotalDec, currency);

  // 2. Local transport calculation: adults + children
  const totalRiders = new Decimal(adults).plus(children);
  const transportTotalDec = toDecimal(input.dailyLocalTransportPerPerson.amount)
    .times(totalRiders)
    .times(days);
  const transportTotal = createMoney(transportTotalDec, currency);

  // 3. Activity total
  const activityTotal = sumMoney(input.activityTickets, currency);

  // 4. Fixed categories
  const flightsTotal = input.flightsTotal;
  const accommodationTotal = input.accommodationTotal;

  // 5. Subtotal before contingency
  const subtotal = sumMoney(
    [flightsTotal, accommodationTotal, foodTotal, transportTotal, activityTotal],
    currency
  );

  // 6. Contingency calculation
  const contingency = percentageOf(subtotal, contingencyPct);

  // 7. Total estimated
  const totalEstimated = addMoney(subtotal, contingency);

  // 8. Hard cap with flexibility
  const hardCap = percentageOf(input.userBudget, 100 + flexibilityPct);
  const withinBudget = toDecimal(totalEstimated.amount).lessThanOrEqualTo(toDecimal(hardCap.amount));

  // 9. Remaining budget or overage
  const remainingBudget = subtractMoney(input.userBudget, totalEstimated);
  const isOver = toDecimal(totalEstimated.amount).greaterThan(toDecimal(input.userBudget.amount));
  const overBudgetAmount = isOver
    ? subtractMoney(totalEstimated, input.userBudget)
    : undefined;

  // 10. Percentage breakdown per category
  const totalDec = toDecimal(totalEstimated.amount);
  const computePct = (catAmount: Money): number => {
    if (totalDec.isZero()) return 0;
    return toDecimal(catAmount.amount)
      .dividedBy(totalDec)
      .times(100)
      .toDecimalPlaces(1)
      .toNumber();
  };

  const categories: Record<BudgetCategory, Money> = {
    flights: flightsTotal,
    accommodation: accommodationTotal,
    food: foodTotal,
    local_transport: transportTotal,
    activities: activityTotal,
    contingency,
  };

  const breakdown: CategoryBreakdownItem[] = [
    {
      category: "flights",
      amount: flightsTotal,
      percentage: computePct(flightsTotal),
      description: "Airfare roundtrip for all travellers",
    },
    {
      category: "accommodation",
      amount: accommodationTotal,
      percentage: computePct(accommodationTotal),
      description: `Lodging for ${days} nights`,
    },
    {
      category: "food",
      amount: foodTotal,
      percentage: computePct(foodTotal),
      description: `Daily meals allowance for ${days} days`,
    },
    {
      category: "local_transport",
      amount: transportTotal,
      percentage: computePct(transportTotal),
      description: "Metro, buses, and local transit transfers",
    },
    {
      category: "activities",
      amount: activityTotal,
      percentage: computePct(activityTotal),
      description: "Admission fees and experience tickets",
    },
    {
      category: "contingency",
      amount: contingency,
      percentage: computePct(contingency),
      description: `${contingencyPct}% buffer for unexpected expenses`,
    },
  ];

  // 11. Alternatives generation if over budget
  const alternatives: BudgetAlternative[] = [];
  const warnings: string[] = [];

  if (isOver) {
    warnings.push(
      `Estimated total exceeds target budget by ${currency} ${toDecimal(overBudgetAmount!.amount).dividedBy(100).toFixed(2)}`
    );

    // Evaluate flight alternatives
    if (input.flightAlternatives) {
      for (const alt of input.flightAlternatives) {
        if (toDecimal(alt.price.amount).lessThan(toDecimal(flightsTotal.amount))) {
          const savings = subtractMoney(flightsTotal, alt.price);
          alternatives.push({
            description: alt.description,
            potentialSavings: savings,
            category: "flights",
          });
        }
      }
    }

    // Evaluate hotel alternatives
    if (input.hotelAlternatives) {
      for (const alt of input.hotelAlternatives) {
        if (toDecimal(alt.price.amount).lessThan(toDecimal(accommodationTotal.amount))) {
          const savings = subtractMoney(accommodationTotal, alt.price);
          alternatives.push({
            description: alt.description,
            potentialSavings: savings,
            category: "accommodation",
          });
        }
      }
    }
  }

  return {
    userBudget: input.userBudget,
    totalEstimated,
    remainingBudget,
    withinBudget,
    overBudgetAmount,
    flexibilityPct,
    categories,
    breakdown,
    contingencyPct,
    alternatives,
    warnings,
  };
}

