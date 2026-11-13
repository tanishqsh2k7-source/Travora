import mongoose, { Schema, Document } from "mongoose";

export interface ITripVersion extends Document {
  tripId: mongoose.Types.ObjectId;
  versionNo: number;
  parentVersionId?: mongoose.Types.ObjectId;
  changeReason?: string;
  createdByRunId?: string;
  itineraryData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TripVersionSchema = new Schema<ITripVersion>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    versionNo: {
      type: Number,
      required: true,
    },
    parentVersionId: {
      type: Schema.Types.ObjectId,
      ref: "TripVersion",
    },
    changeReason: {
      type: String,
    },
    createdByRunId: {
      type: String,
    },
    itineraryData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

TripVersionSchema.index({ tripId: 1, versionNo: 1 }, { unique: true });

export const TripVersionModel = mongoose.model<ITripVersion>(
  "TripVersion",
  TripVersionSchema
);

