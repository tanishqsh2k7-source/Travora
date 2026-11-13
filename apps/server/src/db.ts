import mongoose from "mongoose";
import env from "./config.js";

let isConnected = false;

/**
 * Connect to MongoDB. Idempotent — safe to call on every request in tests.
 * Returns `true` when the connection is healthy.
 */
export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;

  try {
    await mongoose.connect(env.MONGO_URI, {
      // Sensible defaults; override via MONGO_URI query params if needed
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[db] Connected to MongoDB at ${env.MONGO_URI}`);
    return true;
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err);
    return false;
  }
}

/**
 * Disconnect cleanly (for tests and graceful shutdown).
 */
export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

export function getConnectionStatus(): boolean {
  return isConnected;
}

