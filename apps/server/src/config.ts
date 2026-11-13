import "dotenv/config";

const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "3001", 10),
  MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/travora",
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  // ── LLM & LangSmith (Observability) ──
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  LANGSMITH_TRACING: process.env.LANGSMITH_TRACING === "true",
  LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
  LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT ?? "travora",
  // ── Provider Mode & Live Keys ──
  PROVIDER_MODE: process.env.PROVIDER_MODE ?? "fixture",
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
} as const;

export default env;

