import React from "react";
import { Minus, Plus } from "lucide-react";

export interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  unitLabel?: string;
}

export function Stepper({
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  ariaLabel = "Value",
  unitLabel,
}: StepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const handleDecrement = () => {
    if (canDecrement) onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (canIncrement) onChange(Math.min(max, value + step));
  };

  return (
    <div className="stepper-control" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label={`Decrease ${ariaLabel}`}
        className="stepper-btn stepper-btn-decrement"
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="stepper-value-display">
        <span className="stepper-number">{value}</span>
        {unitLabel && <span className="stepper-unit">{unitLabel}</span>}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label={`Increase ${ariaLabel}`}
        className="stepper-btn stepper-btn-increment"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
