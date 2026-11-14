import React, { useState, useEffect } from "react";
import type {
  CreateTripRequest,
  AgentEvent,
  FinalPlanResponse,
  ReplanRequest,
  TransportPreference,
} from "@travora/contracts";
import { Navbar } from "./components/Navbar";
import { TripBuilder } from "./components/TripBuilder";
import { PlanningProgress } from "./components/PlanningProgress";
import { ItineraryView } from "./components/ItineraryView";
import { BudgetView } from "./components/BudgetView";
import { MapStopList } from "./components/MapStopList";
import { ReplanModal } from "./components/ReplanModal";
import { PreferencesModal } from "./components/PreferencesModal";
import { VersionHistoryView } from "./components/VersionHistoryView";
import {
  ensureAuth,
  createTrip,
  getTrip,
  startPlanning,
  startReplanning,
  subscribeToRunEvents,
  type TripResponse,
  type TripVersionDetail,
} from "./api/client";
import {
  SparklesIcon,
  CalendarIcon,
  CurrencyIcon,
  MapPinIcon,
  RefreshIcon,
} from "./components/Icons";
import { SAMPLE_MULTICITY_ITINERARY } from "./fixtures/sample-multicity";
import "./styles/app.css";

type AppView = "builder" | "planning" | "view";
type PlanTab = "itinerary" | "budget" | "map" | "versions" | "terminal";

export function App() {
  const [currentView, setCurrentView] = useState<AppView>("builder");
  const [activeTab, setActiveTab] = useState<PlanTab>("itinerary");

  const [activeTrip, setActiveTrip] = useState<TripResponse | null>(null);
  const [_activeRunId, setActiveRunId] = useState<string | null>(null);
  const [planningStatus, setPlanningStatus] = useState<
    "queued" | "running" | "completed" | "failed" | "partial"
  >("queued");
  const [planningStage, setPlanningStage] = useState("intake");
  const [progressPct, setProgressPct] = useState(0);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [planResult, setPlanResult] = useState<FinalPlanResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();

  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize auth and check for /sample route
  useEffect(() => {
    ensureAuth().catch((err) => {
      console.warn("Auth initialization note:", err);
    });

    const isSample =
      window.location.pathname === "/sample" ||
      window.location.search.includes("sample=true");

    if (isSample) {
      const itin = SAMPLE_MULTICITY_ITINERARY;
      const mockPlan: FinalPlanResponse = {
        version: 2,
        tripId: itin.id,
        runId: "sample_run",
        destination: itin.summary.cities.join(" & "),
        dates: {
          startDate: itin.startDate,
          endDate: itin.endDate,
          totalDays: itin.days.length,
        },
        summary: itin.summary.title,
        itinerary: [],
        itineraryV2: itin,
        budgetBreakdown: {
          userBudget: itin.summary.budget,
          totalEstimated: itin.summary.estimatedTotal,
          remainingBudget: itin.summary.remaining,
          withinBudget: itin.summary.withinBudget,
          flexibilityPct: 10,
          contingencyPct: 10,
          alternatives: [],
          categories: {
            flights: itin.journey[0]?.cost ?? { amount: 8000000, currency: itin.currency },
            accommodation: itin.stays[0]?.hotel.total ?? { amount: 12000000, currency: itin.currency },
            food: { amount: 3000000, currency: itin.currency },
            local_transport: { amount: 1500000, currency: itin.currency },
            activities: { amount: 1500000, currency: itin.currency },
            contingency: { amount: 2000000, currency: itin.currency },
          },
          breakdown: [],
          warnings: itin.summary.warnings,
        },
        flightOptions: [],
        hotelOptions: [],
        sources: itin.sources,
        warnings: itin.summary.warnings,
      };

      const mockTrip: TripResponse = {
        id: itin.id,
        userId: "sample_user",
        origin: itin.journey[0]?.from.city || "Delhi",
        destination: itin.summary.cities.join(" & "),
        startDate: itin.startDate,
        endDate: itin.endDate,
        timezone: "Asia/Tokyo",
        travellers: itin.travellers,
        budget: itin.summary.budget,
        interests: ["Culture", "Temples", "Food", "Heritage"],
        travelStyle: "balanced",
        transportPreferences: ["train", "flight"],
        status: "planned",
        currentVersionNo: 1,
        createdAt: itin.generatedAt,
        updatedAt: itin.generatedAt,
      };

      setActiveTrip(mockTrip);
      setPlanResult(mockPlan);
      setCurrentView("view");
    }
  }, []);

  const handleStartTripPlanning = async (tripRequest: CreateTripRequest) => {
    setIsLoading(true);
    setErrorMsg(undefined);
    setEvents([]);
    setProgressPct(5);
    setPlanningStage("intake");
    setPlanningStatus("running");

    try {
      const token = await ensureAuth();
      const trip = await createTrip(tripRequest);
      setActiveTrip(trip);
      setCurrentView("planning");

      const runInfo = await startPlanning(trip.id);
      setActiveRunId(runInfo.runId);

      // Subscribe to real-time progress stream
      const unsubscribe = subscribeToRunEvents(
        runInfo.runId,
        token,
        async (event: AgentEvent) => {
          setEvents((prev) => [...prev, event]);
          setPlanningStage(event.stage);
          setProgressPct(event.progress);

          if (event.type === "run.completed") {
            setPlanningStatus("completed");
            if (event.payload?.result) {
              setPlanResult(event.payload.result as FinalPlanResponse);
            }
            // Refresh trip metadata
            try {
              const refreshed = await getTrip(trip.id);
              setActiveTrip(refreshed);
            } catch {}
          } else if (event.type === "run.failed") {
            setPlanningStatus("failed");
            setErrorMsg(event.message);
          }
        },
        (err) => {
          console.error("SSE connection error:", err);
        }
      );

      return () => unsubscribe();
    } catch (err: unknown) {
      console.error("Failed to plan trip:", err);
      setPlanningStatus("failed");
      setErrorMsg(err instanceof Error ? err.message : "Failed to initialize planning run");
      setCurrentView("planning");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteReplan = async (replanRequest: ReplanRequest) => {
    if (!activeTrip) return;
    setIsLoading(true);
    setErrorMsg(undefined);
    setEvents([]);
    setProgressPct(10);
    setPlanningStage("replan");
    setPlanningStatus("running");
    setCurrentView("planning");

    try {
      const token = await ensureAuth();
      const runInfo = await startReplanning(activeTrip.id, replanRequest);
      setActiveRunId(runInfo.runId);

      const unsubscribe = subscribeToRunEvents(
        runInfo.runId,
        token,
        async (event: AgentEvent) => {
          setEvents((prev) => [...prev, event]);
          setPlanningStage(event.stage);
          setProgressPct(event.progress);

          if (event.type === "run.completed") {
            setPlanningStatus("completed");
            if (event.payload?.result) {
              setPlanResult(event.payload.result as FinalPlanResponse);
            }
            // Refresh trip metadata so currentVersionNo is updated
            try {
              const refreshed = await getTrip(activeTrip.id);
              setActiveTrip(refreshed);
            } catch {}
          } else if (event.type === "run.failed") {
            setPlanningStatus("failed");
            setErrorMsg(event.message);
          }
        },
        (err) => {
          console.error("SSE replan error:", err);
        }
      );

      return () => unsubscribe();
    } catch (err: unknown) {
      console.error("Failed to replan:", err);
      setPlanningStatus("failed");
      setErrorMsg(err instanceof Error ? err.message : "Failed to start replanning");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionRestored = (versionDetail: TripVersionDetail) => {
    if (versionDetail.itineraryData) {
      setPlanResult(versionDetail.itineraryData as FinalPlanResponse);
    }
    if (activeTrip) {
      setActiveTrip({
        ...activeTrip,
        currentVersionNo: versionDetail.versionNo,
      });
    }
    setActiveTab("itinerary");
  };

  return (
    <div className="app-container">
      <Navbar
        onNewTrip={() => setCurrentView("builder")}
        hasActiveTrip={currentView !== "builder" && planResult !== null}
        onOpenPreferences={() => setIsPreferencesModalOpen(true)}
      />

      <main className="main-content">
        {currentView === "builder" && (
          <TripBuilder onSubmit={handleStartTripPlanning} isLoading={isLoading} />
        )}

        {currentView === "planning" && (
          <PlanningProgress
            events={events}
            progress={progressPct}
            stage={planningStage}
            destination={activeTrip?.destination || "Your Trip"}
            status={planningStatus}
            error={errorMsg}
            onViewPlan={() => setCurrentView("view")}
            onRetry={() => {
              if (activeTrip) {
                const transport: TransportPreference[] = [
                  "public_transit",
                  "walking",
                ];
                handleStartTripPlanning({
                  origin: activeTrip.origin,
                  destination: activeTrip.destination,
                  startDate: activeTrip.startDate,
                  endDate: activeTrip.endDate,
                  timezone: activeTrip.timezone,
                  travellers: activeTrip.travellers,
                  budget: {
                    amount: activeTrip.budget.amount,
                    currency: activeTrip.budget.currency,
                    flexibilityPct: activeTrip.budget.flexibilityPct ?? 10,
                  },
                  interests: activeTrip.interests,
                  travelStyle: activeTrip.travelStyle as any,
                  transportPreferences: transport,
                  constraints: { accessibility: [], dietary: [], pace: "moderate" },
                });
              } else {
                setCurrentView("builder");
              }
            }}
          />
        )}

        {currentView === "view" && planResult && activeTrip && (
          <div className="plan-view-container">
            {/* View navigation bar */}
            <div className="plan-tabs-bar">
              <div className="tabs-group">
                <button
                  className={`plan-tab-btn ${activeTab === "itinerary" ? "active" : ""}`}
                  onClick={() => setActiveTab("itinerary")}
                >
                  <CalendarIcon className="w-4 h-4" /> {planResult.itineraryV2 ? "Itinerary Journey" : "Day-by-Day Itinerary"}
                </button>
                {!planResult.itineraryV2 && (
                  <>
                    <button
                      className={`plan-tab-btn ${activeTab === "budget" ? "active" : ""}`}
                      onClick={() => setActiveTab("budget")}
                    >
                      <CurrencyIcon className="w-4 h-4" /> Budget Breakdown
                    </button>
                    <button
                      className={`plan-tab-btn ${activeTab === "map" ? "active" : ""}`}
                      onClick={() => setActiveTab("map")}
                    >
                      <MapPinIcon className="w-4 h-4" /> Route & Stops
                    </button>
                  </>
                )}
                <button
                  className={`plan-tab-btn ${activeTab === "versions" ? "active" : ""}`}
                  onClick={() => setActiveTab("versions")}
                >
                  <RefreshIcon className="w-4 h-4" /> Version Lineage (v{activeTrip.currentVersionNo})
                </button>
                <button
                  className={`plan-tab-btn ${activeTab === "terminal" ? "active" : ""}`}
                  onClick={() => setActiveTab("terminal")}
                >
                  <SparklesIcon className="w-4 h-4" /> Agent Event Log ({events.length})
                </button>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsReplanModalOpen(true)}
              >
                <SparklesIcon className="w-4 h-4 text-indigo" /> Refine / Replan
              </button>
            </div>

            {/* Tab Panels */}
            {activeTab === "itinerary" && (
              <ItineraryView
                plan={planResult}
                onOpenReplanModal={() => setIsReplanModalOpen(true)}
              />
            )}

            {activeTab === "budget" && (
              <BudgetView budget={planResult.budgetBreakdown} />
            )}

            {activeTab === "map" && (
              <MapStopList days={planResult.itinerary} />
            )}

            {activeTab === "versions" && (
              <VersionHistoryView
                tripId={activeTrip.id}
                currentVersionNo={activeTrip.currentVersionNo}
                onVersionRestored={handleVersionRestored}
              />
            )}

            {activeTab === "terminal" && (
              <div className="agent-terminal">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot dot-red"></span>
                    <span className="dot dot-yellow"></span>
                    <span className="dot dot-green"></span>
                  </div>
                  <span className="terminal-title">Agent Execution Log</span>
                  <span className="terminal-count">{events.length} events logged</span>
                </div>
                <div className="terminal-body">
                  {events.map((evt) => (
                    <div key={evt.id} className="log-row">
                      <span className="log-time">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                      <span className="log-badge badge-indigo">{evt.type}</span>
                      <span className="log-stage">@{evt.stage}:</span>
                      <span className="log-msg">{evt.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Refine / Replan Modal */}
      <ReplanModal
        isOpen={isReplanModalOpen}
        onClose={() => setIsReplanModalOpen(false)}
        onSubmit={handleExecuteReplan}
        totalDays={planResult?.itinerary?.length ?? 3}
      />

      {/* User Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
      />
    </div>
  );
}
export default App;
