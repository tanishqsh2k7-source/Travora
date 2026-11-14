import mongoose from "mongoose";
import dns from "dns";
import env from "./config.js";

let isConnected = false;
let memoryServerInstance: any = null;

/**
 * Connect to MongoDB. Idempotent — safe to call on every request in tests.
 * Attempts cloud Atlas connection first; if Atlas fails (e.g. IP whitelist / network block),
 * automatically spins up an in-memory Mongo server so the app never fails auth or trips.
 */
export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;

  // 1. Try cloud / configured URI first
  try {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Ignore if setServers fails
    }

    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 3500,
    });
    isConnected = true;
    console.log(`[db] Connected to MongoDB at ${env.MONGO_URI}`);
    return true;
  } catch (err) {
    console.warn(`[db] Cloud MongoDB connection failed: ${(err as Error).message}`);
    console.warn("[db] Tip: To persist to MongoDB Atlas, add your IP (or 0.0.0.0/0) to Atlas Network Access.");
  }

  // 2. In-memory fallback if remote fails
  try {
    console.log("[db] Initializing in-memory MongoDB fallback...");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServerInstance = await MongoMemoryServer.create();
    const memUri = memoryServerInstance.getUri();
    await mongoose.connect(memUri);
    isConnected = true;
    console.log(`[db] Connected to in-memory MongoDB fallback at ${memUri}`);
    return true;
  } catch (memErr) {
    console.error("[db] In-memory MongoDB fallback also failed:", memErr);
    return false;
  }
}

/**
 * Disconnect cleanly (for tests and graceful shutdown).
 */
export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
  isConnected = false;
}

export function getConnectionStatus(): boolean {
  return isConnected;
}
