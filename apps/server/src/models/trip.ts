import mongoose, { Schema, Document } from "mongoose";
import type {
  Travellers,
  BudgetInput,
  TripConstraints,
  TripStatus,
  TravelStyle,
  TransportPreference,
} from "@travora/contracts";

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  timezone: string;
  travellers: Travellers;
  budget: BudgetInput;
  interests: string[];
  travelStyle: TravelStyle;
  transportPreferences: TransportPreference[];
  constraints: TripConstraints;
  status: TripStatus;
  currentVersionNo: number;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    travellers: {
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
      infants: { type: Number, default: 0, min: 0 },
    },
    budget: {
      amount: { type: Number, required: true },
      currency: { type: String, required: true, uppercase: true },
      flexibilityPct: { type: Number, default: 5, min: 0, max: 100 },
    },
    interests: {
      type: [String],
      default: [],
    },
    travelStyle: {
      type: String,
      enum: ["budget", "balanced", "luxury", "fast-paced", "relaxed"],
      default: "balanced",
    },
    transportPreferences: {
      type: [String],
      enum: ["flight", "train", "public_transit", "car_rental", "rideshare", "walking"],
      default: ["public_transit"],
    },
    constraints: {
      accessibility: { type: [String], default: [] },
      dietary: { type: [String], default: [] },
      pace: { type: String, enum: ["relaxed", "moderate", "fast"], default: "moderate" },
    },
    status: {
      type: String,
      enum: ["draft", "planning", "planned", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    currentVersionNo: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const TripModel = mongoose.model<ITrip>("Trip", TripSchema);
