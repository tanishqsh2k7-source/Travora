import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config.js";
import { getConnectionStatus } from "./db.js";

export function createApp() {
  const app = express();

  // ── Middleware ──────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  // ── Health endpoint ────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    const dbOk = getConnectionStatus();
    const status = dbOk ? "ok" : "degraded";
    res.status(dbOk ? 200 : 503).json({
      status,
      service: "travora-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      checks: {
        mongo: dbOk ? "connected" : "disconnected",
      },
    });
  });

  // ── Root redirect ──────────────────────────────────────
  app.get("/", (_req, res) => {
    res.json({
      message: "Travora API",
      docs: "/api/health",
    });
  });

  return app;
}

