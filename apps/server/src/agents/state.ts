import { Annotation } from "@langchain/langgraph";
import type {
  CreateTripRequest,
  UserPreferences,
  PlaceCandidate,
  FlightOffer,
  HotelOffer,
  WeatherForecast,
  BudgetBreakdown,
  RouteOptimizerResult,
  ValidationReport,
  PlanningRunStatus,
  FinalPlanResponse,
} from "@travora/contracts";

export const TravelStateAnnotation = Annotation.Root({
  runId: Annotation<string>(),
  tripId: Annotation<string>(),
  userId: Annotation<string>(),
  request: Annotation<CreateTripRequest>(),
  preferences: Annotation<UserPreferences>({
    reducer: (_, next) => next,
    default: () => ({
      interests: [],
      travelStyle: "balanced",
      pace: "moderate",
      dietaryRestrictions: [],
      accessibilityRequirements: [],
      preferredCurrency: "USD",
      transportPreferences: ["public_transit"],
    }),
  }),
  placesResult: Annotation<PlaceCandidate[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  flightsResult: Annotation<FlightOffer[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  hotelsResult: Annotation<HotelOffer[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  weatherResult: Annotation<WeatherForecast | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  budgetResult: Annotation<BudgetBreakdown | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  routeResult: Annotation<RouteOptimizerResult | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  validationReport: Annotation<ValidationReport | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
  replanCount: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
  status: Annotation<PlanningRunStatus>({
    reducer: (_, next) => next,
    default: () => "queued",
  }),
  warnings: Annotation<string[]>({
    reducer: (curr, next) => Array.from(new Set([...(curr ?? []), ...(next ?? [])])),
    default: () => [],
  }),
  finalResponse: Annotation<FinalPlanResponse | undefined>({
    reducer: (_, next) => next,
    default: () => undefined,
  }),
});

export type TravelState = typeof TravelStateAnnotation.State;
export type TravelStateUpdate = typeof TravelStateAnnotation.Update;

