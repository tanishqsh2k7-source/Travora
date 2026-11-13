import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config.js";
import { getConnectionStatus } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { tripsRouter } from "./routes/trips.js";
import { preferencesRouter } from "./routes/preferences.js";
import { planningRouter } from "./routes/planning.js";

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

  // ── API v1 routes ──────────────────────────────────────
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/trips", tripsRouter);
  app.use("/api/v1/me/preferences", preferencesRouter);
  app.use("/api/v1", planningRouter);

  // ── Root redirect ──────────────────────────────────────
  app.get("/", (_req, res) => {
    res.json({
      message: "Travora API",
      docs: "/api/health",
    });
  });

  // ── Global error handler ───────────────────────────────
  app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("[server] Unhandled error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  return app;
}

