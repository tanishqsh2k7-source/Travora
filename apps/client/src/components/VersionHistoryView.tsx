import React, { useState, useEffect } from "react";
import {
  getTripVersions,
  getTripVersion,
  restoreTripVersion,
  type TripVersionSummary,
  type TripVersionDetail,
} from "../api/client";
import type { FinalPlanResponse } from "@travora/contracts";
import {
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  CurrencyIcon,
  MapPinIcon,
} from "./Icons";

interface VersionHistoryViewProps {
  tripId: string;
  currentVersionNo: number;
  onVersionRestored: (version: TripVersionDetail) => void;
}

export function VersionHistoryView({
  tripId,
  currentVersionNo,
  onVersionRestored,
}: VersionHistoryViewProps) {
  const [versions, setVersions] = useState<TripVersionSummary[]>([]);
  const [selectedVersionNo, setSelectedVersionNo] = useState<number>(currentVersionNo);
  const [compareVersionNo, setCompareVersionNo] = useState<number>(
    Math.max(1, currentVersionNo - 1)
  );
  const [selectedDetail, setSelectedDetail] = useState<TripVersionDetail | null>(null);
  const [compareDetail, setCompareDetail] = useState<TripVersionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load version list
  useEffect(() => {
    getTripVersions(tripId)
      .then((vList) => {
        setVersions(vList);
        if (vList.length > 0) {
          const maxV = Math.max(...vList.map((v) => v.versionNo));
          setSelectedVersionNo(maxV);
          if (maxV > 1) {
            setCompareVersionNo(maxV - 1);
          } else {
            setCompareVersionNo(1);
          }
        }
      })
      .catch((err) => console.error("Failed to load trip versions:", err));
  }, [tripId]);

  // Load details for selected & compare version
  useEffect(() => {
    if (selectedVersionNo) {
      setIsLoading(true);
      Promise.all([
        getTripVersion(tripId, selectedVersionNo).catch(() => null),
        compareVersionNo !== selectedVersionNo
          ? getTripVersion(tripId, compareVersionNo).catch(() => null)
          : Promise.resolve(null),
      ])
        .then(([sel, comp]) => {
          setSelectedDetail(sel);
          setCompareDetail(comp);
        })
        .finally(() => setIsLoading(false));
    }
  }, [tripId, selectedVersionNo, compareVersionNo]);

  const handleRestore = async (versionNo: number) => {
    if (!confirm(`Restore Version ${versionNo} as the active plan for this trip?`)) return;
    setIsRestoring(true);
    try {
      const res = await restoreTripVersion(tripId, versionNo);
      onVersionRestored(res.version);
    } catch (err) {
      alert("Failed to restore version: " + String(err));
    } finally {
      setIsRestoring(false);
    }
  };

  const selPlan = selectedDetail?.itineraryData as FinalPlanResponse | undefined;
  const compPlan = compareDetail?.itineraryData as FinalPlanResponse | undefined;

  const selStopsCount =
    selPlan?.itinerary?.reduce((acc, d) => acc + d.stops.length, 0) ?? 0;
  const compStopsCount =
    compPlan?.itinerary?.reduce((acc, d) => acc + d.stops.length, 0) ?? 0;

  const selCost = selPlan?.budgetBreakdown?.totalEstimated;
  const compCost = compPlan?.budgetBreakdown?.totalEstimated;

  return (
    <div className="version-history-view">
      {/* Top Banner */}
      <div className="version-header-card">
        <div className="version-title-group">
          <SparklesIcon className="w-5 h-5 text-indigo" />
          <div>
            <h3>Plan Lineage & Version Comparison</h3>
            <p className="text-secondary text-sm">
              Travora tracks every itinerary revision, critic disruption repair, and user refinement as an immutable version.
            </p>
          </div>
        </div>
      </div>

      <div className="version-content-grid">
        {/* Version List Timeline */}
        <div className="version-timeline-card">
          <h4>Trip Version History ({versions.length})</h4>
          <div className="version-timeline-list">
            {versions.map((v) => {
              const isCurrent = v.versionNo === currentVersionNo;
              const isSelected = v.versionNo === selectedVersionNo;

              return (
                <div
                  key={v.id || v.versionNo}
                  className={`version-card ${isSelected ? "selected" : ""} ${isCurrent ? "current" : ""}`}
                  onClick={() => setSelectedVersionNo(v.versionNo)}
                >
                  <div className="version-top-row">
                    <span className="version-badge">Version {v.versionNo}</span>
                    {isCurrent && (
                      <span className="active-tag">
                        <CheckCircleIcon className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <p className="version-reason">
                    {v.changeReason || "Generated itinerary revision"}
                  </p>

                  <div className="version-meta">
                    <span className="version-date">
                      {new Date(v.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!isCurrent && v.hasItinerary && (
                      <button
                        className="btn btn-secondary btn-sm restore-btn"
                        disabled={isRestoring}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(v.versionNo);
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diff / Comparison Panel */}
        <div className="version-diff-card">
          <div className="diff-header-row">
            <h4>Comparing Version {selectedVersionNo} vs Version {compareVersionNo}</h4>
            <div className="compare-picker">
              <label>Compare with:</label>
              <select
                value={compareVersionNo}
                onChange={(e) => setCompareVersionNo(parseInt(e.target.value))}
              >
                {versions.map((v) => (
                  <option key={v.versionNo} value={v.versionNo}>
                    Version {v.versionNo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-diff">Loading plan version data...</div>
          ) : (
            <div className="diff-body">
              {/* Metric Variance Tiles */}
              <div className="diff-metrics-grid">
                <div className="diff-metric-tile">
                  <span className="metric-name">
                    <CurrencyIcon className="w-4 h-4 text-muted" /> Total Estimated Cost
                  </span>
                  <div className="metric-compare">
                    <span className="val-old">
                      {compCost ? `${(compCost.amount / 100).toLocaleString()} ${compCost.currency}` : "—"}
                    </span>
                    <ArrowRightIcon className="w-3 h-3 text-muted" />
                    <span className="val-new text-indigo">
                      {selCost ? `${(selCost.amount / 100).toLocaleString()} ${selCost.currency}` : "—"}
                    </span>
                  </div>
                </div>

                <div className="diff-metric-tile">
                  <span className="metric-name">
                    <MapPinIcon className="w-4 h-4 text-muted" /> Total Scheduled Stops
                  </span>
                  <div className="metric-compare">
                    <span className="val-old">{compStopsCount} stops</span>
                    <ArrowRightIcon className="w-3 h-3 text-muted" />
                    <span className="val-new text-indigo">{selStopsCount} stops</span>
                  </div>
                </div>

                <div className="diff-metric-tile">
                  <span className="metric-name">
                    <ClockIcon className="w-4 h-4 text-muted" /> Transit Time
                  </span>
                  <div className="metric-compare">
                    <span className="val-old">
                      {compPlan?.itinerary?.reduce((a, d) => a + d.totalTravelTimeMin, 0) ?? 0}m
                    </span>
                    <ArrowRightIcon className="w-3 h-3 text-muted" />
                    <span className="val-new text-indigo">
                      {selPlan?.itinerary?.reduce((a, d) => a + d.totalTravelTimeMin, 0) ?? 0}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Day-by-Day schedule diff */}
              <div className="days-diff-container">
                <h5>Schedule Changes by Day</h5>
                {selPlan?.itinerary?.map((selDay) => {
                  const compDay = compPlan?.itinerary?.find(
                    (d) => d.dayNumber === selDay.dayNumber
                  );

                  return (
                    <div key={selDay.dayNumber} className="day-diff-block">
                      <div className="day-diff-title">
                        <strong>Day {selDay.dayNumber}</strong> ({selDay.date})
                        {selDay.theme && <span className="day-theme-pill">{selDay.theme}</span>}
                      </div>

                      <div className="day-comparison-columns">
                        {/* Selected Version Column */}
                        <div className="diff-col col-new">
                          <span className="col-label">Version {selectedVersionNo} (Selected)</span>
                          <div className="stops-mini-list">
                            {selDay.stops.map((s, idx) => (
                              <div key={idx} className="stop-mini-item">
                                <span className="time">{s.startLocal}</span>
                                <span className="name">{s.name}</span>
                                <span className="type-tag">{s.type}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Compared Version Column */}
                        <div className="diff-col col-old">
                          <span className="col-label">Version {compareVersionNo} (Base)</span>
                          <div className="stops-mini-list">
                            {compDay ? (
                              compDay.stops.map((s, idx) => (
                                <div key={idx} className="stop-mini-item">
                                  <span className="time">{s.startLocal}</span>
                                  <span className="name">{s.name}</span>
                                  <span className="type-tag">{s.type}</span>
                                </div>
                              ))
                            ) : (
                              <span className="empty-sub">No data for this day in base version</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
