import mongoose, { Schema, Document } from "mongoose";
import type { UserPreferences } from "@travora/contracts";

export interface IUserPreference extends Document, UserPreferences {
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
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
    pace: {
      type: String,
      enum: ["relaxed", "moderate", "fast"],
      default: "moderate",
    },
    dietaryRestrictions: {
      type: [String],
      default: [],
    },
    accessibilityRequirements: {
      type: [String],
      default: [],
    },
    preferredCurrency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    transportPreferences: {
      type: [String],
      enum: ["flight", "train", "public_transit", "car_rental", "rideshare", "walking"],
      default: ["public_transit"],
    },
  },
  {
    timestamps: true,
  }
);

export const UserPreferenceModel = mongoose.model<IUserPreference>(
  "UserPreference",
  UserPreferenceSchema
);

