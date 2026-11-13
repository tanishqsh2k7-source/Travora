import React, { useState } from "react";
import type { ReplanRequest, DisruptionType } from "@travora/contracts";
import { SparklesIcon, CloudRainIcon, ClockIcon } from "./Icons";

interface ReplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: ReplanRequest) => void;
  totalDays: number;
}

export function ReplanModal({ isOpen, onClose, onSubmit, totalDays }: ReplanModalProps) {
  const [instruction, setInstruction] = useState("It is going to rain tomorrow, replace outdoor activities with indoor museums.");
  const [disruptionType, setDisruptionType] = useState<DisruptionType>("weather_rain");
  const [affectedDay, setAffectedDay] = useState(2);

  if (!isOpen) return null;

  const quickPresets: Array<{
    title: string;
    text: string;
    type: DisruptionType;
    icon: typeof CloudRainIcon;
  }> = [
    {
      title: "Rain Disruption",
      text: "It is forecasted to rain tomorrow. Please swap outdoor sights for indoor museums or art galleries.",
      type: "weather_rain",
      icon: CloudRainIcon,
    },
    {
      title: "Pace Adjustment",
      text: "Adjust schedule to a more relaxed pace. Avoid early morning starts before 10:30 AM.",
      type: "user_custom",
      icon: ClockIcon,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    onSubmit({
      instruction: instruction.trim(),
      disruptionType,
      affectedDayNumber: affectedDay,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <SparklesIcon className="w-5 h-5 text-indigo" />
            <h3>Refine Itinerary / Adaptive Replan</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-presets">
          <span className="preset-label">Quick suggestions:</span>
          <div className="preset-chips">
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-chip"
                onClick={() => {
                  setInstruction(p.text);
                  setDisruptionType(p.type);
                }}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Disruption or Modification Instruction</label>
            <textarea
              rows={3}
              required
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. It will rain tomorrow, find indoor activities..."
            />
          </div>

          <div className="form-group">
            <label>Disruption Category</label>
            <select
              value={disruptionType}
              onChange={(e) => setDisruptionType(e.target.value as DisruptionType)}
            >
              <option value="weather_rain">Weather / Rain Forecast</option>
              <option value="user_custom">Custom Preference / Pace Change</option>
              <option value="budget_reduced">Budget Reduced</option>
              <option value="hotel_cancelled">Hotel Issue</option>
              <option value="flight_delayed">Flight Schedule Change</option>
            </select>
          </div>

          <div className="form-group">
            <label>Target / Affected Day</label>
            <select
              value={affectedDay}
              onChange={(e) => setAffectedDay(parseInt(e.target.value))}
            >
              {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <SparklesIcon className="w-4 h-4" /> Start Adaptive Replan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
