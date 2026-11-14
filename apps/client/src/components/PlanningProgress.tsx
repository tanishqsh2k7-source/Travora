import React, { useState, useEffect, useRef } from "react";
import type { AgentEvent } from "@travora/contracts";
import {
  Compass,
  Plane,
  Building2,
  CloudSun,
  MapPin,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Terminal,
} from "lucide-react";
import { Photo } from "./Photo.js";
import { Button } from "./ui/Button.js";

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

interface TeamMember {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
}

const PLANNING_TEAM: TeamMember[] = [
  {
    id: "planner",
    name: "Trip planner",
    role: "Validates travel dates, party size, and requirements",
    icon: <Compass className="w-5 h-5 text-terracotta" />,
  },
  {
    id: "flights",
    name: "Flight scout",
    role: "Scans real schedules, connections, and fares",
    icon: <Plane className="w-5 h-5 text-teal" />,
  },
  {
    id: "hotels",
    name: "Stay finder",
    role: "Locates neighborhood hotels and check-in schedules",
    icon: <Building2 className="w-5 h-5 text-amber" />,
  },
  {
    id: "weather",
    name: "Weather watcher",
    role: "Checks microclimate forecasts and rain forecasts",
    icon: <CloudSun className="w-5 h-5 text-sky-600" />,
  },
  {
    id: "routes",
    name: "Route planner",
    role: "Optimizes daily stop order to prevent backtracking",
    icon: <MapPin className="w-5 h-5 text-indigo-600" />,
  },
  {
    id: "budget",
    name: "Budget keeper",
    role: "Calculates penny-exact totals and FX conversion",
    icon: <Calculator className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: "reviewer",
    name: "Reviewer",
    role: "Audits pacing, transfers, and rainy-day options",
    icon: <ShieldCheck className="w-5 h-5 text-forest" />,
  },
];

const CALM_MESSAGES = [
  "Checking flight routes and optimal departure windows...",
  "Reviewing neighborhood lodging and hotel locations...",
  "Clustering daily sights to minimize walking and transit time...",
  "Checking weather forecasts for outdoor and indoor balance...",
  "Finalizing schedule timings and verified budget breakdowns...",
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
  const [isUnderTheHoodOpen, setIsUnderTheHoodOpen] = useState(false);
  const [messageIdx, setMessageIdx] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % CALM_MESSAGES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isUnderTheHoodOpen) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [events, isUnderTheHoodOpen]);

  // Determine each team member's live status
  const getMemberStatus = (id: string): "idle" | "working" | "done" | "attention" => {
    if (status === "completed") return "done";
    if (status === "failed") return "attention";

    switch (id) {
      case "planner":
        return stage === "intake" ? "working" : "done";
      case "flights":
        if (["intake", "supervisor"].includes(stage)) return "idle";
        if (stage === "research") return "working";
        return "done";
      case "hotels":
        if (["intake", "supervisor"].includes(stage)) return "idle";
        if (stage === "research") return "working";
        return "done";
      case "weather":
        if (["intake", "supervisor"].includes(stage)) return "idle";
        if (stage === "research") return "working";
        return "done";
      case "routes":
        if (["intake", "supervisor", "research"].includes(stage)) return "idle";
        if (stage === "itinerary") return "working";
        return "done";
      case "budget":
        if (["intake", "supervisor", "research"].includes(stage)) return "idle";
        if (stage === "itinerary") return "working";
        return "done";
      case "reviewer":
        if (["intake", "supervisor", "research", "itinerary"].includes(stage)) return "idle";
        if (["critic", "replan"].includes(stage)) return "working";
        return "done";
      default:
        return "idle";
    }
  };

  return (
    <div className="planning-progress-editorial">
      <div className="progress-screen-container">
        {/* Main Header */}
        <div className="progress-main-header">
          <div className="progress-copy-block">
            <span className="editorial-kicker">Custom itinerary in progress</span>
            <h1 className="progress-headline">
              {status === "completed"
                ? `Your journey to ${destination} is ready`
                : status === "failed"
                ? "Planning interrupted"
                : `Planning your trip to ${destination}`}
            </h1>
            <p className="progress-subheadline">
              {status === "completed"
                ? "All transit routes, lodging bases, and schedules have been checked and verified."
                : status === "failed"
                ? error || "An unexpected error occurred while planning your journey."
                : CALM_MESSAGES[messageIdx]}
            </p>
          </div>

          <div className="progress-metric-wrap">
            <span className="progress-metric-number">{Math.round(progress)}%</span>
            <span className="progress-metric-label">Complete</span>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="progress-rail-wrap">
          <div
            className={`progress-rail-fill ${status === "failed" ? "failed" : status === "completed" ? "completed" : ""}`}
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        {/* Action button row if completed or failed */}
        {status === "completed" && (
          <div className="progress-cta-banner">
            <Button variant="primary" size="lg" onClick={onViewPlan}>
              View complete itinerary
            </Button>
          </div>
        )}

        {status === "failed" && (
          <div className="progress-failure-banner" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="failure-message-wrap">
              <strong>Planning stopped:</strong>
              <span>{error || "An issue occurred during optimization."}</span>
            </div>
            <Button variant="secondary" size="md" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Try again
            </Button>
          </div>
        )}

        {/* Two-Column Planning Layout */}
        <div className="planning-team-layout">
          {/* Left Column: Your Planning Team */}
          <div className="team-column">
            <h2 className="team-section-title">Your planning team</h2>
            <div className="team-members-list">
              {PLANNING_TEAM.map((member) => {
                const memberStatus = getMemberStatus(member.id);
                return (
                  <div key={member.id} className={`team-member-card status-${memberStatus}`}>
                    <div className="member-icon-box">{member.icon}</div>
                    <div className="member-info">
                      <div className="member-name-row">
                        <strong className="member-name">{member.name}</strong>
                        <span className={`member-status-pill pill-${memberStatus}`}>
                          {memberStatus === "done" && (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Done
                            </>
                          )}
                          {memberStatus === "working" && (
                            <>
                              <span className="pulse-dot" /> Working
                            </>
                          )}
                          {memberStatus === "idle" && (
                            <>
                              <Clock className="w-3.5 h-3.5" /> Waiting
                            </>
                          )}
                          {memberStatus === "attention" && (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" /> Paused
                            </>
                          )}
                        </span>
                      </div>
                      <p className="member-role">{member.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Destination preview & calm message */}
          <div className="destination-preview-column">
            <div className="calm-photo-card">
              <Photo
                src={`/images/destinations/${destination.toLowerCase().split(",")[0].trim()}-card.jpg`}
                alt={destination}
                width={800}
                height={600}
                fallbackTitle={destination}
                fallbackSubtitle="Curating optimal itinerary"
                className="calm-photo-img"
              />
              <div className="calm-photo-scrim">
                <div className="calm-photo-caption">
                  <span className="calm-caption-kicker">Destined for</span>
                  <strong className="calm-caption-name">{destination}</strong>
                  <p className="calm-caption-status">{CALM_MESSAGES[messageIdx]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed 'Under the hood' Disclosure */}
        <div className="under-the-hood-section">
          <button
            type="button"
            className="under-the-hood-toggle"
            onClick={() => setIsUnderTheHoodOpen(!isUnderTheHoodOpen)}
            aria-expanded={isUnderTheHoodOpen}
          >
            <div className="toggle-left">
              <Terminal className="w-4 h-4 text-ink-muted" />
              <span>Under the hood (Raw agent stream logs)</span>
              <span className="event-count-pill">{events.length} events</span>
            </div>
            <ChevronDown className={`w-4 h-4 chevron ${isUnderTheHoodOpen ? "rotate" : ""}`} />
          </button>

          {isUnderTheHoodOpen && (
            <div className="under-the-hood-body">
              <div className="console-stream-box">
                {events.map((ev, i) => (
                  <div key={i} className="stream-event-line">
                    <span className="stream-time">
                      [{new Date(ev.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`stream-type type-${ev.type.replace(".", "-")}`}>
                      {ev.type}
                    </span>
                    <span className="stream-stage">@{ev.stage}:</span>
                    <span className="stream-msg">{ev.message}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
