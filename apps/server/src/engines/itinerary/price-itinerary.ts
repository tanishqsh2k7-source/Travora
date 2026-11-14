import Decimal from "decimal.js";
import type {
  Itinerary,
  StaySegment,
  DayPlan,
  Leg,
  ItineraryMoney,
  ItinerarySummary,
} from "@travora/contracts";
import {
  toDecimal,
  createMoney,
  toTargetCurrency,
} from "../currency.js";

export interface PriceItineraryInput {
  targetCurrency: string;
  userBudget: { amount: number; currency: string };
  stays: StaySegment[];
  days: DayPlan[];
  journey: Leg[];
  cities: string[];
  title?: string;
}

export function priceItinerary(input: PriceItineraryInput): {
  summary: ItinerarySummary;
  stays: StaySegment[];
  days: DayPlan[];
} {
  const { targetCurrency, userBudget, cities } = input;
  const currencyUpper = targetCurrency.toUpperCase();

  // 1. Normalize and sum stays
  let staysTotalDec = new Decimal(0);
  const pricedStays: StaySegment[] = input.stays.map((stay) => {
    const nightlyConverted = toTargetCurrency(stay.hotel.nightlyPrice, currencyUpper);
    const totalAmount = new Decimal(nightlyConverted.amount).times(stay.nights).round().toNumber();
    const totalConverted: ItineraryMoney = {
      amount: totalAmount,
      currency: currencyUpper,
      kind: stay.hotel.nightlyPrice.kind,
      source: stay.hotel.nightlyPrice.source,
      fetchedAt: stay.hotel.nightlyPrice.fetchedAt,
    };

    staysTotalDec = staysTotalDec.plus(totalAmount);

    return {
      ...stay,
      hotel: {
        ...stay.hotel,
        nightlyPrice: {
          ...nightlyConverted,
          kind: stay.hotel.nightlyPrice.kind,
          source: stay.hotel.nightlyPrice.source,
          fetchedAt: stay.hotel.nightlyPrice.fetchedAt,
        },
        total: totalConverted,
      },
    };
  });

  // 2. Sum transit legs
  let legsTotalDec = new Decimal(0);
  for (const leg of input.journey) {
    if (leg.cost) {
      const legConverted = toTargetCurrency(leg.cost, currencyUpper);
      legsTotalDec = legsTotalDec.plus(legConverted.amount);
    }
  }

  // 3. Sum daily event costs
  let activitiesTotalDec = new Decimal(0);
  const pricedDays: DayPlan[] = input.days.map((d) => {
    let daySumDec = new Decimal(0);
    for (const ev of d.events) {
      if (ev.cost) {
        const evConverted = toTargetCurrency(ev.cost, currencyUpper);
        daySumDec = daySumDec.plus(evConverted.amount);
      }
    }
    activitiesTotalDec = activitiesTotalDec.plus(daySumDec);

    return {
      ...d,
      dayCost: {
        amount: daySumDec.round().toNumber(),
        currency: currencyUpper,
        kind: "estimate",
        source: "travora_engine",
        fetchedAt: new Date().toISOString(),
      },
    };
  });

  // 4. Grand estimated total
  const estimatedTotalDec = staysTotalDec.plus(legsTotalDec).plus(activitiesTotalDec);
  const normalizedBudget = toTargetCurrency(userBudget, currencyUpper);
  const budgetDec = toDecimal(normalizedBudget.amount);

  const withinBudget = estimatedTotalDec.lessThanOrEqualTo(budgetDec);
  const remainingDec = budgetDec.minus(estimatedTotalDec);

  const warnings: string[] = [];
  if (!withinBudget) {
    const overage = estimatedTotalDec.minus(budgetDec).dividedBy(100).toFixed(2);
    warnings.push(`Estimated total exceeds target budget by ${currencyUpper} ${overage}`);
  }

  const summary: ItinerarySummary = {
    title: input.title || `Curated Journey across ${cities.join(" & ")}`,
    cities,
    estimatedTotal: {
      amount: estimatedTotalDec.round().toNumber(),
      currency: currencyUpper,
      kind: "demo_offer",
      source: "travora_engine",
      fetchedAt: new Date().toISOString(),
    },
    budget: {
      amount: normalizedBudget.amount,
      currency: currencyUpper,
      kind: "estimate",
      source: "user_budget",
      fetchedAt: new Date().toISOString(),
    },
    remaining: {
      amount: remainingDec.round().toNumber(),
      currency: currencyUpper,
      kind: "estimate",
      source: "travora_engine",
      fetchedAt: new Date().toISOString(),
    },
    withinBudget,
    warnings,
  };

  return {
    summary,
    stays: pricedStays,
    days: pricedDays,
  };
}
