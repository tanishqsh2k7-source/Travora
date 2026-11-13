import React from "react";
import type { BudgetBreakdown, Money } from "@travora/contracts";
import { CheckCircleIcon, AlertCircleIcon } from "./Icons";

interface BudgetViewProps {
  budget?: BudgetBreakdown;
}

export function BudgetView({ budget }: BudgetViewProps) {
  if (!budget) {
    return (
      <div className="budget-empty">
        <p>No budget calculations available for this plan.</p>
      </div>
    );
  }

  const formatMoney = (m?: Money) => {
    if (!m) return "—";
    return (m.amount / 100).toLocaleString(undefined, {
      style: "currency",
      currency: m.currency,
      maximumFractionDigits: 0,
    });
  };

  const categories = [
    { label: "Flights", value: budget.categories.flights, color: "#3b82f6" },
    { label: "Accommodation", value: budget.categories.accommodation, color: "#8b5cf6" },
    { label: "Food & Dining", value: budget.categories.food, color: "#f59e0b" },
    { label: "Activities & Sightseeing", value: budget.categories.activities, color: "#10b981" },
    { label: "Local Transport", value: budget.categories.local_transport, color: "#06b6d4" },
    { label: "Contingency Buffer", value: budget.categories.contingency, color: "#64748b" },
  ];

  const totalAmount = budget.totalEstimated.amount || 1;

  return (
    <div className="budget-view">
      {/* Top Budget Header Card */}
      <div className="budget-hero-card">
        <div className="budget-metric">
          <span className="metric-label">Allocated Budget</span>
          <span className="metric-value">{formatMoney(budget.userBudget)}</span>
        </div>

        <div className="budget-separator">vs</div>

        <div className="budget-metric">
          <span className="metric-label">Estimated Total Cost</span>
          <span className="metric-value text-indigo">{formatMoney(budget.totalEstimated)}</span>
        </div>

        <div className="budget-status-pill">
          {budget.withinBudget ? (
            <div className="status-badge badge-emerald">
              <CheckCircleIcon className="w-4 h-4" /> Within Budget
            </div>
          ) : (
            <div className="status-badge badge-amber">
              <AlertCircleIcon className="w-4 h-4" /> Exceeds Budget ({formatMoney(budget.overBudgetAmount)})
            </div>
          )}
        </div>
      </div>

      {/* Multi-segment Progress Bar */}
      <div className="budget-stacked-bar-container">
        <div className="budget-stacked-bar">
          {categories.map((cat, idx) => {
            const amount = cat.value?.amount ?? 0;
            const pct = Math.round((amount / totalAmount) * 100);
            if (pct <= 0) return null;
            return (
              <div
                key={idx}
                className="bar-segment"
                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                title={`${cat.label}: ${pct}% (${formatMoney(cat.value)})`}
              />
            );
          })}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="categories-grid">
        {categories.map((cat, idx) => {
          const amount = cat.value?.amount ?? 0;
          const pct = Math.round((amount / totalAmount) * 100);

          return (
            <div key={idx} className="category-card">
              <div className="category-header">
                <span className="color-dot" style={{ backgroundColor: cat.color }}></span>
                <span className="cat-name">{cat.label}</span>
                <span className="cat-pct">{pct}%</span>
              </div>
              <div className="cat-amount">{formatMoney(cat.value)}</div>
            </div>
          );
        })}
      </div>

      {/* Cost-saving tips */}
      <div className="budget-tips-card">
        <h4>💡 Deterministic Budget Engine Insights</h4>
        <ul>
          <li>All arithmetic is computed via exact Decimal.js integer smallest-units (no floating point drift).</li>
          <li>A {budget.contingencyPct}% contingency buffer is automatically allocated for unexpected transit or ticket surges.</li>
          <li>Remaining budget buffer: {formatMoney(budget.remainingBudget)}</li>
          {budget.alternatives && budget.alternatives.length > 0 && (
            <li>
              Alternative: {budget.alternatives[0].description} (potential savings: {formatMoney(budget.alternatives[0].potentialSavings)})
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
