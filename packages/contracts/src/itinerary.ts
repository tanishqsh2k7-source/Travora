import { z } from "zod";

// ── Place ─────────────────────────────────────────────────────────────────
export const PlaceSchema = z.object({
  name: z.string(),
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
  timezone: z.string(), // IANA timezone e.g. "Asia/Tokyo", "Europe/Lisbon"
  code: z.string().optional(), // IATA code for airports e.g. "HND", "DEL", "LIS"
});
export type Place = z.infer<typeof PlaceSchema>;

// ── Money ─────────────────────────────────────────────────────────────────
export const MoneyKindSchema = z.enum(["estimate", "demo_offer", "live_offer"]);
export type MoneyKind = z.infer<typeof MoneyKindSchema>;

export const ItineraryMoneySchema = z.object({
  amount: z.number().int().nonnegative(), // Minor units (e.g. cents, paise, yen minor units)
  currency: z.string().length(3), // ISO 4217 uppercase
  kind: MoneyKindSchema.default("estimate"),
  source: z.string().default("travora_engine"),
  fetchedAt: z.string(), // ISO datetime string
});
export type ItineraryMoney = z.infer<typeof ItineraryMoneySchema>;

// ── Leg ───────────────────────────────────────────────────────────────────
export const LegKindSchema = z.enum([
  "outbound",
  "intercity",
  "return",
  "airport_transfer",
  "local_transfer",
]);
export type LegKind = z.infer<typeof LegKindSchema>;

export const LegModeSchema = z.enum([
  "flight",
  "train",
  "bus",
  "car",
  "ferry",
  "metro",
  "walk",
]);
export type LegMode = z.infer<typeof LegModeSchema>;

export const LegSchema = z.object({
  id: z.string(),
  kind: LegKindSchema,
  mode: LegModeSchema,
  from: PlaceSchema,
  to: PlaceSchema,
  departLocal: z.string(), // ISO local datetime e.g. "2027-04-10T10:30:00"
  arriveLocal: z.string(), // ISO local datetime e.g. "2027-04-10T19:45:00"
  durationMin: z.number().int().positive(),
  carrier: z.string().optional(),
  number: z.string().optional(), // Flight/train number e.g. "JL740", "Shinkansen Nozomi 23"
  cost: ItineraryMoneySchema.nullable(),
  note: z.string().optional(),
  source: z.string().default("travora_engine"),
});
export type Leg = z.infer<typeof LegSchema>;

// ── StaySegment & Hotel ───────────────────────────────────────────────────
export const ChangeReasonCodeSchema = z.enum([
  "FIRST_STAY",
  "NEW_CITY",
  "DISTANT_AREA",
  "LONG_STAY_SPLIT",
  "EARLY_FLIGHT_AIRPORT",
]);
export type ChangeReasonCode = z.infer<typeof ChangeReasonCodeSchema>;

export const ChangeReasonSchema = z.object({
  code: ChangeReasonCodeSchema,
  text: z.string(),
});
export type ChangeReason = z.infer<typeof ChangeReasonSchema>;

export const HotelDetailsSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  stars: z.number().min(1).max(5).optional(),
  lat: z.number(),
  lng: z.number(),
  nightlyPrice: ItineraryMoneySchema,
  total: ItineraryMoneySchema,
  cancellation: z.string().optional(),
  link: z.string().optional(),
});
export type HotelDetails = z.infer<typeof HotelDetailsSchema>;

export const StaySegmentSchema = z.object({
  id: z.string(),
  city: z.string(),
  area: z.string(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().positive(),
  hotel: HotelDetailsSchema,
  changeReason: ChangeReasonSchema.optional(),
  previousStayId: z.string().optional(),
});
export type StaySegment = z.infer<typeof StaySegmentSchema>;

// ── Transition ────────────────────────────────────────────────────────────
export const TransitionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fromStayId: z.string(),
  toStayId: z.string(),
  checkOutBy: z.string().regex(/^\d{2}:\d{2}$/), // e.g. "11:00"
  legs: z.array(LegSchema),
  checkInFrom: z.string().regex(/^\d{2}:\d{2}$/), // e.g. "15:00"
  luggageTip: z.string(),
  tip: z.string().optional(),
});
export type Transition = z.infer<typeof TransitionSchema>;

// ── DayEvent ──────────────────────────────────────────────────────────────
export const DayEventTypeSchema = z.enum([
  "arrival",
  "departure",
  "checkout",
  "checkin",
  "transfer",
  "activity",
  "meal",
  "free",
]);
export type DayEventType = z.infer<typeof DayEventTypeSchema>;

export const DayEventSchema = z.object({
  id: z.string(),
  type: DayEventTypeSchema,
  startLocal: z.string().regex(/^\d{2}:\d{2}$/), // "HH:MM"
  endLocal: z.string().regex(/^\d{2}:\d{2}$/), // "HH:MM"
  title: z.string(),
  place: PlaceSchema.optional(),
  legId: z.string().optional(),
  cost: ItineraryMoneySchema.optional(),
  notes: z.string().optional(),
  evidence: z.array(z.string()).optional(),
});
export type DayEvent = z.infer<typeof DayEventSchema>;

// ── DayPlan ───────────────────────────────────────────────────────────────
export const DayWeatherSchema = z.object({
  summary: z.string(),
  high: z.number().optional(), // °C
  low: z.number().optional(), // °C
  confidence: z.enum(["forecast", "seasonal"]).default("forecast"),
});
export type DayWeather = z.infer<typeof DayWeatherSchema>;

export const DayPlanSchema = z.object({
  dayNumber: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string(),
  theme: z.string(),
  wakeUpStayId: z.string().nullable(), // null on Day 1 when traveller is still at home
  sleepStayId: z.string().nullable(), // null on the final day when returning home
  isMovingDay: z.boolean().default(false),
  events: z.array(DayEventSchema),
  weather: DayWeatherSchema.optional(),
  dayCost: ItineraryMoneySchema,
});
export type DayPlan = z.infer<typeof DayPlanSchema>;

// ── Itinerary Summary & Source ────────────────────────────────────────────
export const ItinerarySummarySchema = z.object({
  title: z.string(),
  cities: z.array(z.string()),
  estimatedTotal: ItineraryMoneySchema,
  budget: ItineraryMoneySchema,
  remaining: ItineraryMoneySchema,
  withinBudget: z.boolean(),
  warnings: z.array(z.string()).default([]),
});
export type ItinerarySummary = z.infer<typeof ItinerarySummarySchema>;

export const ItinerarySourceSchema = z.object({
  provider: z.string(),
  kind: z.string(),
  fetchedAt: z.string(),
});
export type ItinerarySource = z.infer<typeof ItinerarySourceSchema>;

// ── Full Itinerary Contract ───────────────────────────────────────────────
export const ItinerarySchema = z.object({
  id: z.string(),
  version: z.number().int().default(2),
  generatedAt: z.string(),
  dataMode: z.enum(["demo", "live"]).default("demo"),
  currency: z.string().length(3),
  travellers: z.object({
    adults: z.number().int().positive(),
    children: z.number().int().nonnegative().default(0),
    infants: z.number().int().nonnegative().default(0),
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nights: z.number().int().positive(),
  summary: ItinerarySummarySchema,
  journey: z.array(LegSchema),
  stays: z.array(StaySegmentSchema),
  transitions: z.array(TransitionSchema),
  days: z.array(DayPlanSchema),
  sources: z.array(ItinerarySourceSchema).default([]),
});
export type Itinerary = z.infer<typeof ItinerarySchema>;
