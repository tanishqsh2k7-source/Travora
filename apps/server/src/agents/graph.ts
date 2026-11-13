import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { TravelStateAnnotation } from "./state.js";
import { intakeNode } from "./nodes/intake.js";
import { supervisorNode } from "./nodes/supervisor.js";
import { destinationAgentNode } from "./nodes/destination-agent.js";
import { flightsAgentNode } from "./nodes/flights-agent.js";
import { hotelsAgentNode } from "./nodes/hotels-agent.js";
import { weatherAgentNode } from "./nodes/weather-agent.js";
import { mergeResultsNode } from "./nodes/merge-results.js";
import { itineraryNode } from "./nodes/itinerary.js";
import { criticNode } from "./nodes/critic.js";
import { replanNode } from "./nodes/replan.js";
import { aggregatorNode } from "./nodes/aggregator.js";

export function createPlanningGraph(checkpointer = new MemorySaver()) {
  const workflow = new StateGraph(TravelStateAnnotation)
    .addNode("intake", intakeNode)
    .addNode("supervisor", supervisorNode)
    .addNode("destination", destinationAgentNode)
    .addNode("flights", flightsAgentNode)
    .addNode("hotels", hotelsAgentNode)
    .addNode("weather", weatherAgentNode)
    .addNode("merge_results", mergeResultsNode)
    .addNode("itinerary", itineraryNode)
    .addNode("critic", criticNode)
    .addNode("replan", replanNode)
    .addNode("aggregator", aggregatorNode)
    // Entry sequence
    .addEdge(START, "intake")
    .addEdge("intake", "supervisor")
    // Dynamic parallel fan-out from supervisor based on TaskPlan
    .addConditionalEdges("supervisor", (state) => {
      const plan = state.taskPlan;
      const branches: Array<"destination" | "flights" | "hotels" | "weather"> = [
        "destination",
        "weather",
      ];

      if (plan?.requiredCapabilities.includes("flights")) {
        branches.push("flights");
      }
      if (plan?.requiredCapabilities.includes("hotels")) {
        branches.push("hotels");
      }

      return branches;
    })
    // Fan-in: all branches join at merge_results
    .addEdge("destination", "merge_results")
    .addEdge("flights", "merge_results")
    .addEdge("hotels", "merge_results")
    .addEdge("weather", "merge_results")
    // Schedule synthesis
    .addEdge("merge_results", "itinerary")
    .addEdge("itinerary", "critic")
    // Bounded Critic validation loop: max 2 replan passes
    .addConditionalEdges("critic", (state) => {
      const hasBlockers = state.validationReport?.hasBlockers ?? false;
      const replanCount = state.replanCount ?? 0;

      if (hasBlockers && replanCount < 2) {
        return "replan";
      }
      return "aggregator";
    })
    // Replan feeds back to critic for verification
    .addEdge("replan", "critic")
    .addEdge("aggregator", END);

  return workflow.compile({ checkpointer });
}
