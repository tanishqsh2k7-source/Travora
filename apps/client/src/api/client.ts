import type {
  CreateTripRequest,
  AgentEvent,
  FinalPlanResponse,
  ReplanRequest,
} from "@travora/contracts";

export interface TripResponse {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  timezone: string;
  travellers: { adults: number; children: number; infants: number };
  budget: { amount: number; currency: string; flexibilityPct?: number };
  interests: string[];
  travelStyle: string;
  transportPreferences: string[];
  status: string;
  currentVersionNo: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningRunResponse {
  runId: string;
  tripId: string;
  status: "queued" | "running" | "completed" | "failed" | "partial";
  startedAt: string;
  finishedAt?: string;
  currentStage: string;
  progressPct: number;
  error?: string;
  warnings?: string[];
  result?: FinalPlanResponse;
}

const TOKEN_KEY = "travora_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Ensures the user has a valid JWT session.
 * If not already present, registers or logs in with a demo guest account.
 */
export async function ensureAuth(): Promise<string> {
  const existingToken = getStoredToken();
  if (existingToken) {
    try {
      const res = await fetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${existingToken}` },
      });
      if (res.ok) {
        return existingToken;
      }
    } catch {
      // Continue to re-auth
    }
  }

  // Auto-login or register demo guest
  const demoEmail = "demo@travora.app";
  const demoPassword = "TravoraDemo123!";

  try {
    const loginRes = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPassword }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      setStoredToken(data.token);
      return data.token;
    }
  } catch {
    // try register
  }

  // Register demo user
  const regRes = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: demoEmail,
      password: demoPassword,
      name: "Demo Explorer",
    }),
  });

  if (!regRes.ok) {
    throw new Error("Failed to authenticate demo user session");
  }

  const regData = await regRes.json();
  setStoredToken(regData.token);
  return regData.token;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await ensureAuth();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, { ...options, headers });
  return response;
}

export async function createTrip(payload: CreateTripRequest): Promise<TripResponse> {
  const res = await authFetch("/api/v1/trips", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create trip");
  }

  return res.json();
}

export async function listTrips(): Promise<TripResponse[]> {
  const res = await authFetch("/api/v1/trips");
  if (!res.ok) throw new Error("Failed to list trips");
  return res.json();
}

export async function getTrip(tripId: string): Promise<TripResponse> {
  const res = await authFetch(`/api/v1/trips/${tripId}`);
  if (!res.ok) throw new Error("Failed to fetch trip");
  return res.json();
}

export async function startPlanning(
  tripId: string
): Promise<{ runId: string; tripId: string; status: string; eventsUrl: string }> {
  const res = await authFetch(`/api/v1/trips/${tripId}/plan`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to start planning run");
  }

  return res.json();
}

export async function startReplanning(
  tripId: string,
  request: ReplanRequest
): Promise<{ runId: string; tripId: string; status: string; eventsUrl: string }> {
  const res = await authFetch(`/api/v1/trips/${tripId}/replan`, {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to start replanning");
  }

  return res.json();
}

export async function getPlanningRun(runId: string): Promise<PlanningRunResponse> {
  const res = await authFetch(`/api/v1/runs/${runId}`);
  if (!res.ok) throw new Error("Failed to fetch planning run");
  return res.json();
}

/**
 * Connects to the Server-Sent Events stream for a planning run.
 * Passes token as query param so standard browser EventSource functions cleanly.
 */
export function subscribeToRunEvents(
  runId: string,
  token: string,
  onEvent: (event: AgentEvent) => void,
  onError?: (err: Event) => void
): () => void {
  const eventsUrl = `/api/v1/runs/${runId}/events?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(eventsUrl);

  const eventTypes = [
    "run.started",
    "agent.status",
    "tool.called",
    "validation.issue",
    "replan.started",
    "run.completed",
    "run.failed",
  ];

  eventTypes.forEach((type) => {
    eventSource.addEventListener(type, (e: MessageEvent) => {
      try {
        const parsed: AgentEvent = JSON.parse(e.data);
        onEvent(parsed);
      } catch (err) {
        console.error("Failed to parse SSE event data:", err);
      }
    });
  });

  // Also listen on standard message
  eventSource.onmessage = (e: MessageEvent) => {
    try {
      const parsed: AgentEvent = JSON.parse(e.data);
      onEvent(parsed);
    } catch (err) {
      console.error("Failed to parse SSE message data:", err);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}

