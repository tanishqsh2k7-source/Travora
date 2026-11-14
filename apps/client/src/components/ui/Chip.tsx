import React from "react";
import { Check } from "lucide-react";

export interface ChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function Chip({ label, selected, onToggle, icon, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`chip-toggle ${selected ? "is-selected" : ""} ${className}`}
    >
      <span className="chip-indicator" aria-hidden="true">
        {selected ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : icon}
      </span>
      <span className="chip-label">{label}</span>
    </button>
  );
}
