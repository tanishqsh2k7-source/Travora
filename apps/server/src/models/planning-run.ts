import mongoose, { Schema, Document } from "mongoose";
import type { PlanningRunStatus, FinalPlanResponse } from "@travora/contracts";

export interface IPlanningRun extends Document {
  tripId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: PlanningRunStatus;
  graphThreadId: string;
  currentStage?: string;
  progressPct: number;
  startedAt: Date;
  finishedAt?: Date;
  error?: string;
  warnings: string[];
  result?: FinalPlanResponse;
  createdAt: Date;
  updatedAt: Date;
}

const PlanningRunSchema = new Schema<IPlanningRun>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "partial", "failed"],
      default: "queued",
      index: true,
    },
    graphThreadId: {
      type: String,
      required: true,
      index: true,
    },
    currentStage: {
      type: String,
      default: "intake",
    },
    progressPct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
    },
    error: {
      type: String,
    },
    warnings: {
      type: [String],
      default: [],
    },
    result: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const PlanningRunModel = mongoose.model<IPlanningRun>(
  "PlanningRun",
  PlanningRunSchema
);
