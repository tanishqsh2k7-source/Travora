import Decimal from "decimal.js";
import type { Money } from "@travora/contracts";

// Configure Decimal precision for financial math
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(amount: number): Decimal {
  return new Decimal(amount);
}

export function createMoney(amount: number | Decimal, currency: string): Money {
  const dec = amount instanceof Decimal ? amount : new Decimal(amount);
  return {
    amount: dec.round().toNumber(),
    currency: currency.toUpperCase(),
  };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot add money with different currencies: ${a.currency} vs ${b.currency}`);
  }
  const sum = toDecimal(a.amount).plus(toDecimal(b.amount));
  return createMoney(sum, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot subtract money with different currencies: ${a.currency} vs ${b.currency}`);
  }
  const diff = toDecimal(a.amount).minus(toDecimal(b.amount));
  return createMoney(diff, a.currency);
}

export function multiplyMoney(m: Money, factor: number | Decimal): Money {
  const prod = toDecimal(m.amount).times(factor);
  return createMoney(prod, m.currency);
}

export function sumMoney(items: Money[], currency?: string): Money {
  if (items.length === 0) {
    return { amount: 0, currency: currency ?? "USD" };
  }
  const targetCurrency = currency ?? items[0].currency;
  let total = new Decimal(0);

  for (const item of items) {
    if (item.currency !== targetCurrency) {
      throw new Error(`Currency mismatch in sum: expected ${targetCurrency}, got ${item.currency}`);
    }
    total = total.plus(toDecimal(item.amount));
  }

  return createMoney(total, targetCurrency);
}

export function percentageOf(m: Money, pct: number): Money {
  const amount = toDecimal(m.amount).times(pct).dividedBy(100);
  return createMoney(amount, m.currency);
}

export function compareMoney(a: Money, b: Money): number {
  if (a.currency !== b.currency) {
    throw new Error(`Cannot compare money with different currencies: ${a.currency} vs ${b.currency}`);
  }
  const decA = toDecimal(a.amount);
  const decB = toDecimal(b.amount);
  return decA.comparedTo(decB);
}

export function convertCurrency(
  m: Money,
  targetCurrency: string,
  exchangeRate: number | Decimal
): Money {
  if (m.currency === targetCurrency) return m;
  const converted = toDecimal(m.amount).times(exchangeRate);
  return createMoney(converted, targetCurrency);
}

export function formatMoney(m: Money): string {
  // Amount is in smallest currency unit (cents/paise)
  const mainUnit = toDecimal(m.amount).dividedBy(100).toFixed(2);
  return `${m.currency} ${mainUnit}`;
}

export const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.0118, // 1 USD ~ 85 INR -> 1 INR ~ 0.01176 USD
  JPY: 0.0065, // 1 USD ~ 155 JPY -> 1 JPY ~ 0.00645 USD
  CAD: 0.73,
  AUD: 0.66,
  CHF: 1.12,
  SGD: 0.74,
  AED: 0.272,
};

export function toTargetCurrency(m: Money, targetCurrency: string): Money {
  const from = m.currency.toUpperCase();
  const to = targetCurrency.toUpperCase();
  if (from === to) return m;

  const rateFrom = FX_RATES_TO_USD[from] ?? 1.0;
  const rateTo = FX_RATES_TO_USD[to] ?? 1.0;

  const inUSD = toDecimal(m.amount).times(rateFrom);
  const inTarget = inUSD.dividedBy(rateTo);
  return createMoney(inTarget, to);
}

