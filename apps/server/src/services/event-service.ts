import { EventEmitter } from "events";
import type { AgentEvent, AgentEventType } from "@travora/contracts";

class RunEventService {
  private emitter = new EventEmitter();
  private history = new Map<string, AgentEvent[]>();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  public emitEvent(
    runId: string,
    eventData: {
      type: AgentEventType;
      stage: string;
      progress: number;
      message: string;
      payload?: Record<string, unknown>;
    }
  ): AgentEvent {
    const event: AgentEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      runId,
      type: eventData.type,
      stage: eventData.stage,
      progress: eventData.progress,
      message: eventData.message,
      timestamp: new Date().toISOString(),
      payload: eventData.payload,
    };

    // Store in history (last 50 events per run)
    const runHistory = this.history.get(runId) ?? [];
    runHistory.push(event);
    if (runHistory.length > 50) {
      runHistory.shift();
    }
    this.history.set(runId, runHistory);

    // Broadcast to listeners
    this.emitter.emit(`run:${runId}`, event);
    return event;
  }

  public subscribe(runId: string, listener: (event: AgentEvent) => void): () => void {
    const channel = `run:${runId}`;
    this.emitter.on(channel, listener);

    return () => {
      this.emitter.off(channel, listener);
    };
  }

  public getHistory(runId: string): AgentEvent[] {
    return this.history.get(runId) ?? [];
  }

  public clearRun(runId: string): void {
    this.history.delete(runId);
  }
}

export const eventService = new RunEventService();
