import React from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  label?: string;
  name?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  name,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented-control-group" role="radiogroup" aria-label={label}>
      {label && <span className="segmented-control-label">{label}</span>}
      <div className="segmented-control-track">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              name={name}
              className={`segmented-control-item ${isSelected ? "selected" : ""}`}
              onClick={() => onChange(opt.value)}
            >
              <span className="segmented-title">{opt.label}</span>
              {opt.sublabel && <span className="segmented-sublabel">{opt.sublabel}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
