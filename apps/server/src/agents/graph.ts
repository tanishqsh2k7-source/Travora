import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { TravelStateAnnotation } from "./state.js";
import { intakeNode } from "./nodes/intake.js";
import { researchNode } from "./nodes/research.js";
import { itineraryNode } from "./nodes/itinerary.js";
import { aggregatorNode } from "./nodes/aggregator.js";

export function createPlanningGraph(checkpointer = new MemorySaver()) {
  const workflow = new StateGraph(TravelStateAnnotation)
    .addNode("intake", intakeNode)
    .addNode("research", researchNode)
    .addNode("itinerary", itineraryNode)
    .addNode("aggregator", aggregatorNode)
    .addEdge(START, "intake")
    .addEdge("intake", "research")
    .addEdge("research", "itinerary")
    .addEdge("itinerary", "aggregator")
    .addEdge("aggregator", END);

  return workflow.compile({ checkpointer });
}

