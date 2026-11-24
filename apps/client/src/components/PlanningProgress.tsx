import React, { useState, useEffect } from "react";
import type { AgentEvent } from "@travora/contracts";
import {
  Compass,
  Plane,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Photo } from "./Photo.js";
import { Button } from "./ui/Button.js";
import { useDestinationImage } from "../services/imageService.js";

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

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const MILESTONES: Milestone[] = [
  {
    id: "route",
    title: "Route & Transport Windows",
    description: "Aligning arrival, departure, and connection buffers",
    icon: <Plane className="w-5 h-5 text-sky-600" />,
  },
  {
    id: "stays",
    title: "Neighborhood Lodging",
    description: "Selecting central bases with seamless check-in logistics",
    icon: <Building2 className="w-5 h-5 text-amber" />,
  },
  {
    id: "sights",
    title: "Daily Sights & Activities",
    description: "Clustering attractions to minimize transit and avoid backtracking",
    icon: <Compass className="w-5 h-5 text-teal" />,
  },
  {
    id: "review",
    title: "Schedule & Budget Balance",
    description: "Cross-referencing weather, opening hours, and verified expenses",
    icon: <ShieldCheck className="w-5 h-5 text-forest" />,
  },
];

const INSPIRING_NOTES = [
  "Checking optimal travel windows and scenic routes...",
  "Selecting central neighborhood stays near key transit...",
  "Clustering sights geographically to avoid crisscrossing town...",
  "Balancing open-air walks with covered cultural landmarks...",
  "Verifying check-in times and penny-exact budget allocations...",
];

export function PlanningProgress({
  progress,
  stage,
  destination,
  status,
  error,
  onViewPlan,
  onRetry,
}: PlanningProgressProps) {
  const [messageIdx, setMessageIdx] = useState(0);
  const { imageUrl, cityName } = useDestinationImage(destination);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % INSPIRING_NOTES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  // Determine each milestone's status based on current planning progress and stage
  const getMilestoneStatus = (id: string): "idle" | "working" | "done" | "attention" => {
    if (status === "completed") return "done";
    if (status === "failed") return "attention";

    switch (id) {
      case "route":
        if (progress < 15) return "working";
        return "done";
      case "stays":
        if (progress < 15) return "idle";
        if (progress < 45) return "working";
        return "done";
      case "sights":
        if (progress < 45) return "idle";
        if (progress < 80) return "working";
        return "done";
      case "review":
        if (progress < 80) return "idle";
        if (progress < 100) return "working";
        return "done";
      default:
        return "idle";
    }
  };

  const displayCity = cityName || destination;

  return (
    <div className="planning-progress-editorial">
      <div className="progress-screen-container">
        {/* Main Header */}
        <div className="progress-main-header">
          <div className="progress-copy-block">
            <span className="editorial-kicker">Custom itinerary in progress</span>
            <h1 className="progress-headline">
              {status === "completed"
                ? `Your journey to ${displayCity} is ready`
                : status === "failed"
                ? "Planning interrupted"
                : `Crafting your trip to ${displayCity}`}
            </h1>
            <p className="progress-subheadline">
              {status === "completed"
                ? "All transit routes, lodging bases, and day-by-day schedules have been assembled."
                : status === "failed"
                ? error || "An unexpected issue occurred while assembling your journey."
                : INSPIRING_NOTES[messageIdx]}
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
            className={`progress-rail-fill ${
              status === "failed" ? "failed" : status === "completed" ? "completed" : ""
            }`}
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        {/* Action button row if completed or failed */}
        {status === "completed" && (
          <div className="progress-cta-banner">
            <Button variant="primary" size="lg" onClick={onViewPlan}>
              <span>View complete itinerary</span>
              <ArrowRight className="w-4 h-4 ml-2" />
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
          {/* Left Column: Planning Milestones */}
          <div className="team-column">
            <h2 className="team-section-title">Itinerary milestones</h2>
            <div className="team-members-list">
              {MILESTONES.map((milestone) => {
                const milestoneStatus = getMilestoneStatus(milestone.id);
                return (
                  <div
                    key={milestone.id}
                    className={`team-member-card status-${milestoneStatus}`}
                  >
                    <div className="member-icon-box">{milestone.icon}</div>
                    <div className="member-info">
                      <div className="member-name-row">
                        <strong className="member-name">{milestone.title}</strong>
                        <span className={`member-status-pill pill-${milestoneStatus}`}>
                          {milestoneStatus === "done" && (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                            </>
                          )}
                          {milestoneStatus === "working" && (
                            <>
                              <span className="pulse-dot" /> In progress
                            </>
                          )}
                          {milestoneStatus === "idle" && (
                            <>
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </>
                          )}
                          {milestoneStatus === "attention" && (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" /> Paused
                            </>
                          )}
                        </span>
                      </div>
                      <p className="member-role">{milestone.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Destination preview & soothing atmosphere */}
          <div className="destination-preview-column">
            <div className="calm-photo-card">
              <Photo
                src={imageUrl || `/images/destinations/${displayCity.toLowerCase().trim()}/card.jpg`}
                alt={displayCity}
                width={800}
                height={600}
                fallbackTitle={displayCity}
                fallbackSubtitle="Curating your journey"
                className="calm-photo-img"
                fill
              />
              <div className="calm-photo-scrim">
                <div className="calm-photo-caption">
                  <span className="calm-caption-kicker">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    Destined for
                  </span>
                  <strong className="calm-caption-name">{destination}</strong>
                  <p className="calm-caption-status">{INSPIRING_NOTES[messageIdx]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PlanningProgress;
