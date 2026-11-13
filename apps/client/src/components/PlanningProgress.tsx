import React, { useEffect, useRef } from "react";
import type { AgentEvent } from "@travora/contracts";
import { SparklesIcon, CheckCircleIcon, AlertCircleIcon, RefreshIcon } from "./Icons";

interface PlanningProgressProps {
  events: AgentEvent[];
  progress: number;
  stage: string;
  destination: string;
  status: "queued" | "running" | "completed" | "failed" | "partial";
  error?: string;
  onViewPlan: () => void;
  onRetry: () => void;
}

const STAGES = [
  { key: "intake", label: "Intake & Validation" },
  { key: "supervisor", label: "Supervisor Routing" },
  { key: "research", label: "Specialist Research" },
  { key: "itinerary", label: "Route & Budget Engines" },
  { key: "critic", label: "Critic & Disruption Audit" },
  { key: "completed", label: "Plan Finalized" },
];

export function PlanningProgress({
  events,
  progress,
  stage,
  destination,
  status,
  error,
  onViewPlan,
  onRetry,
}: PlanningProgressProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the log container
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const getStageStatus = (stageKey: string) => {
    const stageOrder = ["intake", "supervisor", "research", "itinerary", "critic", "completed"];
    const currentIndex = stageOrder.indexOf(stage);
    const thisIndex = stageOrder.indexOf(stageKey);

    if (status === "completed") return "done";
    if (thisIndex < currentIndex) return "done";
    if (thisIndex === currentIndex) return "active";
    return "pending";
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case "run.started":
        return "badge-blue";
      case "agent.status":
        return "badge-indigo";
      case "tool.called":
        return "badge-purple";
      case "validation.issue":
      case "replan.started":
        return "badge-amber";
      case "run.completed":
        return "badge-emerald";
      case "run.failed":
        return "badge-rose";
      default:
        return "badge-slate";
    }
  };

  return (
    <div className="planning-progress-container">
      <div className="progress-header">
        <div className="pulse-indicator-group">
          {status === "running" && <span className="pulsing-radar"></span>}
          <h3>
            {status === "completed"
              ? `Plan Ready for ${destination}!`
              : status === "failed"
              ? "Planning Interrupted"
              : `Agents Planning Trip to ${destination}...`}
          </h3>
        </div>
        <span className="progress-percentage">{Math.round(progress)}%</span>
      </div>

      {/* Progress Bar */}
      <div className="progress-track">
        <div
          className={`progress-fill ${status === "completed" ? "completed" : status === "failed" ? "failed" : ""}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage Flow Nodes */}
      <div className="stages-flow">
        {STAGES.map((s, idx) => {
          const st = getStageStatus(s.key);
          return (
            <div key={idx} className={`stage-step ${st}`}>
              <div className="step-circle">
                {st === "done" ? (
                  <CheckCircleIcon className="w-4 h-4 text-emerald" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error Notice */}
      {status === "failed" && (
        <div className="error-alert">
          <AlertCircleIcon className="w-5 h-5 text-rose" />
          <div className="error-text">
            <strong>Execution Error:</strong> {error || "An unexpected error occurred."}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onRetry}>
            <RefreshIcon className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {/* Live Agent Terminal Log */}
      <div className="agent-terminal">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <span className="terminal-title">LangGraph Agent Stream (SSE Live)</span>
          <span className="terminal-count">{events.length} events</span>
        </div>

        <div className="terminal-body">
          {events.length === 0 ? (
            <div className="empty-logs">Connecting to live agent stream...</div>
          ) : (
            events.map((evt) => {
              const timeStr = new Date(evt.timestamp).toLocaleTimeString();
              return (
                <div key={evt.id} className="log-row">
                  <span className="log-time">[{timeStr}]</span>
                  <span className={`log-badge ${getEventBadgeClass(evt.type)}`}>
                    {evt.type}
                  </span>
                  <span className="log-stage">@{evt.stage}:</span>
                  <span className="log-msg">{evt.message}</span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Completion CTA */}
      {status === "completed" && (
        <div className="progress-footer">
          <button className="btn btn-primary btn-lg" onClick={onViewPlan}>
            <SparklesIcon className="w-5 h-5" /> View Optimized Itinerary & Budget
          </button>
        </div>
      )}
    </div>
  );
}
