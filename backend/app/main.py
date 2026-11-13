from __future__ import annotations

import json
import os
import sqlite3
from datetime import date, timedelta
from pathlib import Path
from typing import Any, TypedDict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import END, START, StateGraph
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.config import settings
from app.services.amadeus import search_flights, search_hotels
from app.services.google_maps import route_matrix, search_attractions
from app.services.weather import trip_forecast


DB_PATH = Path(os.getenv("TRAVEL_PLANNER_DB", Path(__file__).resolve().parents[1] / "travel_planner.db"))
app = FastAPI(title="Travel Planner", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PlanRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=80)
    start_date: date
    end_date: date
    travelers: int = Field(default=1, ge=1, le=20)
    budget_inr: int = Field(default=150000, ge=10000, le=100000000)
    interests: list[str] = Field(default_factory=list)
    user_id: str = Field(default="local", min_length=1, max_length=80)
    request: str = ""
    origin: str = "Delhi"


class ReplanRequest(BaseModel):
    plan: dict[str, Any]
    event: str = Field(min_length=2, max_length=300)
    delay_hours: float | None = Field(default=None, ge=0, le=72)


class PreferencesRequest(BaseModel):
    preferences: list[str] = Field(default_factory=list)


class TravelState(TypedDict, total=False):
    request: PlanRequest
    requested_agents: list[str]
    next_agent_index: int
    agent_trace: list[str]
    attractions: list[dict[str, Any]]
    transport: dict[str, Any]
    accommodation: dict[str, Any]
    budget: dict[str, Any]
    itinerary: list[dict[str, Any]]
    places_source: str
    route_source: str
    flight_options: list[dict[str, Any]]
    hotel_options: list[dict[str, Any]]
    weather: dict[str, Any]
    final_response: dict[str, Any]


CITY_DATA: dict[str, dict[str, Any]] = {
    "paris": {
        "country": "France", "center": (48.8566, 2.3522),
        "attractions": [
            ("Louvre Museum", 48.8606, 2.3376, "museum", 22),
            ("Eiffel Tower", 48.8584, 2.2945, "landmark", 28),
            ("Musée d'Orsay", 48.8600, 2.3266, "museum", 16),
            ("Notre-Dame", 48.8530, 2.3499, "history", 0),
            ("Montmartre", 48.8867, 2.3431, "food", 0),
            ("Sainte-Chapelle", 48.8554, 2.3449, "history", 13),
            ("Luxembourg Gardens", 48.8462, 2.3372, "outdoors", 0),
            ("Le Marais food walk", 48.8575, 2.3622, "food", 20),
        ],
    },
    "rome": {
        "country": "Italy", "center": (41.9028, 12.4964),
        "attractions": [
            ("Colosseum", 41.8902, 12.4922, "history", 22), ("Roman Forum", 41.8925, 12.4853, "history", 18),
            ("Vatican Museums", 41.9065, 12.4536, "museum", 25), ("Trevi Fountain", 41.9009, 12.4833, "landmark", 0),
            ("Pantheon", 41.8986, 12.4769, "history", 5), ("Trastevere food walk", 41.8897, 12.4692, "food", 25),
        ],
    },
    "tokyo": {
        "country": "Japan", "center": (35.6762, 139.6503),
        "attractions": [
            ("Senso-ji Temple", 35.7148, 139.7967, "history", 0), ("Tokyo National Museum", 35.7188, 139.7765, "museum", 8),
            ("Shibuya Crossing", 35.6595, 139.7005, "landmark", 0), ("teamLab Planets", 35.6492, 139.7897, "museum", 30),
            ("Tsukiji Outer Market", 35.6654, 139.7707, "food", 15), ("Meiji Shrine", 35.6764, 139.6993, "history", 0),
        ],
    },
    "new york": {
        "country": "United States", "center": (40.7128, -74.0060),
        "attractions": [
            ("Metropolitan Museum of Art", 40.7794, -73.9632, "museum", 30), ("Central Park", 40.7829, -73.9654, "outdoors", 0),
            ("Statue of Liberty", 40.6892, -74.0445, "history", 25), ("Times Square", 40.7580, -73.9855, "landmark", 0),
            ("9/11 Memorial", 40.7115, -74.0134, "history", 0), ("Chelsea Market", 40.7424, -74.0061, "food", 20),
        ],
    },
}


def db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.execute("CREATE TABLE IF NOT EXISTS preferences (user_id TEXT PRIMARY KEY, values_json TEXT NOT NULL)")
    return connection


def preference_values(user_id: str) -> list[str]:
    with db() as connection:
        row = connection.execute("SELECT values_json FROM preferences WHERE user_id = ?", (user_id,)).fetchone()
    return json.loads(row[0]) if row else []


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    from math import asin, cos, radians, sin, sqrt
    lat1, lon1, lat2, lon2 = map(radians, (*a, *b))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(h))


def supervisor(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    intent = req.request.lower()
    trace = ["Supervisor"]
    agents: list[str] = []
    if settings.gemini_api_key:
        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=(
                    "You route travel-planning requests to specialist nodes. Return JSON only as "
                    '{"agents": ["destination", "transport", "accommodation", "weather", "budget", "itinerary"]}. '
                    "Always include destination. Use only the agents needed: a places-only question needs "
                    "destination alone; a complete trip needs transport, accommodation, weather, budget, and itinerary. "
                    "Do not add agents that the user did not ask for.\n\nRequest: "
                    + json.dumps({"request": req.request, "destination": req.destination, "dates": [req.start_date.isoformat(), req.end_date.isoformat()], "budget_inr": req.budget_inr, "interests": req.interests})
                ),
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            if not response.text:
                raise ValueError("Gemini returned an empty routing response")
            parsed = json.loads(response.text)
            allowed = set(AGENTS)
            agents = [name for name in parsed.get("agents", []) if name in allowed]
            agents = list(dict.fromkeys(["destination", *agents]))
            trace.append("LLM routing")
        except Exception:
            # Keep travel planning available during provider outages or bad credentials.
            agents = []
    if not agents:
        agents = ["destination"]
        if any(word in intent for word in ("complete", "full trip", "plan my")):
            agents += ["transport", "accommodation", "weather", "budget", "itinerary"]
        else:
            if any(word in intent for word in ("stay", "hotel", "accommodation")):
                agents += ["accommodation"]
            if any(word in intent for word in ("flight", "transport", "getting there")):
                agents += ["transport"]
            if "budget" in intent or "cost" in intent:
                agents += ["budget"]
            if "itinerary" in intent or "day by day" in intent:
                agents += ["budget", "itinerary"]
            if "weather" in intent or "forecast" in intent:
                agents += ["weather"]
            if not req.request.strip() and req.end_date > req.start_date:
                agents += ["transport", "accommodation", "weather", "budget", "itinerary"]
        if settings.gemini_api_key:
            trace.append("Rules fallback")
    return {"requested_agents": agents, "next_agent_index": 0, "agent_trace": trace}


def destination_agent(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    city = CITY_DATA.get(req.destination.strip().lower())
    source = "demo"
    attractions: list[dict[str, Any]] = []
    if settings.google_maps_api_key:
        try:
            attractions = search_attractions(req.destination, req.interests + preference_values(req.user_id), settings.google_maps_api_key)
            if attractions:
                source = "Google Places"
        except Exception:
            # Preserve a useful itinerary if a provider request fails.
            attractions = []
    if not attractions and city:
        attractions = [{"name": n, "lat": lat, "lon": lon, "category": cat, "cost_eur": cost} for n, lat, lon, cat, cost in city["attractions"]]
    elif not attractions:
        attractions = [{"name": f"{req.destination} historic center", "category": "history", "cost_eur": 0}]
    wanted = {x.lower() for x in req.interests + preference_values(req.user_id)}
    if wanted:
        attractions.sort(key=lambda a: (0 if a["category"] in wanted or any(w in a["category"] for w in wanted) else 1, a["name"]))
    return {"attractions": attractions, "places_source": source, "agent_trace": state.get("agent_trace", []) + ["Destination Agent"]}


def transport_agent(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    flights: list[dict[str, Any]] = []
    if settings.amadeus_client_id and settings.amadeus_client_secret:
        try:
            flights = search_flights(req.origin, req.destination, req.start_date.isoformat(), req.end_date.isoformat(), req.travelers, settings.amadeus_client_id, settings.amadeus_client_secret, settings.amadeus_base_url)
        except Exception:
            flights = []
    fallback_fare = req.travelers * (30000 if req.destination.lower() in ("paris", "rome") else 26000)
    fare = flights[0]["price_inr"] if flights else fallback_fare
    note = "Live search via Amadeus; fares can change." if flights else "Demo estimate; no live flight offers returned."
    return {"transport": {"origin": req.origin, "destination": req.destination, "note": note, "estimated_fare_inr": fare, "local_transit_per_day_inr": 900}, "flight_options": flights, "agent_trace": state.get("agent_trace", []) + ["Transport Agent"]}


def accommodation_agent(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    nights = max(1, (req.end_date - req.start_date).days)
    rooms = max(1, (req.travelers + 1) // 2)
    hotels: list[dict[str, Any]] = []
    if settings.amadeus_client_id and settings.amadeus_client_secret:
        try:
            hotels = search_hotels(req.destination, req.start_date.isoformat(), req.end_date.isoformat(), req.travelers, rooms, settings.amadeus_client_id, settings.amadeus_client_secret, settings.amadeus_base_url)
        except Exception:
            hotels = []
    cheapest = hotels[0] if hotels else None
    total = cheapest["estimated_total_inr"] if cheapest else 6500 * nights * rooms
    stay = {"name": cheapest["name"] if cheapest else "Well-rated guesthouse near public transit", "nightly_inr": round(total / max(1, nights * rooms)), "rooms": rooms, "nights": nights, "estimated_total_inr": total, "note": "Live Amadeus offer; verify terms before booking." if cheapest else "Demo estimate; no live hotel offers returned."}
    return {"accommodation": stay, "hotel_options": hotels, "agent_trace": state.get("agent_trace", []) + ["Accommodation Agent"]}


def weather_agent(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    weather: dict[str, Any] = {"available": False, "source": "unavailable", "days": [], "note": "Add an OpenWeather API key to fetch forecasts."}
    if settings.openweather_api_key:
        try:
            weather = trip_forecast(req.destination, req.start_date, req.end_date, settings.openweather_api_key)
        except Exception:
            weather = {"available": False, "source": "OpenWeather", "days": [], "note": "Weather provider request failed; itinerary planning continued."}
    return {"weather": weather, "agent_trace": state.get("agent_trace", []) + ["Weather Agent"]}


def budget_agent(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    n_days = max(1, (req.end_date - req.start_date).days)
    people = req.travelers
    rooms = max(1, (people + 1) // 2)
    transport = state.get("transport", {}).get("estimated_fare_inr", 0)
    hotel = state.get("accommodation", {}).get("estimated_total_inr", 0)
    planned_attractions = state.get("attractions", [])[:n_days * 2]
    activities = sum(a.get("cost_eur", 0) * 95 for a in planned_attractions) * people
    local = n_days * state.get("transport", {}).get("local_transit_per_day_inr", 0) * people
    food = n_days * 1800 * people
    budget = req.budget_inr
    adjustments: list[str] = []
    total = transport + hotel + activities + local + food
    if total > budget and hotel and not state.get("hotel_options"):
        target = max(1800, (budget - transport - activities - local - food) // max(1, n_days * rooms))
        hotel = min(hotel, int(target * n_days * rooms))
        adjustments.append("Switched to a lower-cost stay to fit the budget.")
        total = transport + hotel + activities + local + food
    while total > budget:
        paid = [item for item in planned_attractions if item.get("cost_eur", 0) > 0]
        if not paid:
            break
        item = max(paid, key=lambda attraction: attraction.get("cost_eur", 0))
        planned_attractions.remove(item)
        activities -= item.get("cost_eur", 0) * 95 * people
        total = transport + hotel + activities + local + food
        if "Removed paid activities to keep the plan within budget." not in adjustments:
            adjustments.append("Removed paid activities to keep the plan within budget.")
    if total > budget:
        food = max(n_days * 800 * people, food - (total - budget))
        adjustments.append("Reduced the daily food estimate and prioritized free activities.")
        total = transport + hotel + activities + local + food
    stay = dict(state.get("accommodation", {}))
    if stay and hotel != stay.get("estimated_total_inr", hotel):
        stay["estimated_total_inr"] = hotel
        stay["nightly_inr"] = round(hotel / max(1, n_days * rooms))
        stay["note"] = "Lower-cost stay estimate selected to help meet the trip budget. No booking has been made."
    return {"budget": {"limit_inr": budget, "estimated_total_inr": total, "within_budget": total <= budget, "categories_inr": {"flights": transport, "hotel": hotel, "food": food, "activities": activities, "local_transport": local}, "adjustments": adjustments}, "accommodation": stay, "attractions": planned_attractions, "agent_trace": state.get("agent_trace", []) + ["Budget Agent"]}


def itinerary_agent(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    count_days = max(1, (req.end_date - req.start_date).days)
    attractions = state.get("attractions", [])
    located = [a for a in attractions if "lat" in a][:max(2, min(len(attractions), count_days * 2, 10))]
    preferred = " ".join(req.interests + preference_values(req.user_id)).lower()
    travel_mode = "TRANSIT" if any(word in preferred for word in ("public transport", "transit", "metro")) else "WALK" if "walk" in preferred else "DRIVE"
    matrix: dict[tuple[int, int], tuple[float, float]] = {}
    if settings.google_maps_api_key and located:
        try:
            matrix = route_matrix(located, settings.google_maps_api_key, travel_mode)
        except Exception:
            matrix = {}
    if located:
        origin = CITY_DATA.get(req.destination.strip().lower(), {}).get("center", (located[0]["lat"], located[0]["lon"]))
        first = min(range(len(located)), key=lambda i: haversine_km(origin, (located[i]["lat"], located[i]["lon"])))
        order = [first]
        remaining = set(range(len(located))) - {first}
        while remaining:
            here = order[-1]
            nxt = min(remaining, key=lambda i: matrix.get((here, i), (haversine_km((located[here]["lat"], located[here]["lon"]), (located[i]["lat"], located[i]["lon"])), 0))[0])
            order.append(nxt)
            remaining.remove(nxt)
        ordered = [located[i] for i in order]
        index_by_id = {id(item): i for i, item in enumerate(located)}
        # Preserve the chosen order's provider-backed distances for each day.
        route_legs = {(order[pos], order[pos + 1]): matrix.get((order[pos], order[pos + 1])) for pos in range(len(order) - 1)}
    else:
        ordered = attractions[:count_days]
        route_legs = {}
    days = []
    for i in range(count_days):
        stops = ordered[i * 2:(i + 1) * 2]
        km = 0.0
        if len(stops) > 1 and "lat" in stops[0]:
            a_idx, b_idx = index_by_id[id(stops[0])], index_by_id[id(stops[1])]
            leg = route_legs.get((a_idx, b_idx))
            km = leg[1] if leg else haversine_km((stops[0]["lat"], stops[0]["lon"]), (stops[1]["lat"], stops[1]["lon"]))
        days.append({"date": (req.start_date + timedelta(days=i)).isoformat(), "activities": [a["name"] for a in stops] or [f"Explore {req.destination} at your own pace"], "estimated_travel_km": round(km, 1), "route_source": "Google Routes" if matrix else "straight-line estimate", "travel_mode": travel_mode.lower()})
    return {"itinerary": days, "route_source": "Google Routes" if matrix else "straight-line estimate", "agent_trace": state.get("agent_trace", []) + ["Route & Itinerary Agent"]}


AGENTS = {"destination": destination_agent, "transport": transport_agent, "accommodation": accommodation_agent, "weather": weather_agent, "budget": budget_agent, "itinerary": itinerary_agent}


def route_next(state: TravelState) -> str:
    agents = state.get("requested_agents", [])
    index = state.get("next_agent_index", 0)
    return agents[index] if index < len(agents) else "aggregate"


def aggregator(state: TravelState) -> dict[str, Any]:
    req = state["request"]
    result = {"destination": req.destination, "country": CITY_DATA.get(req.destination.lower(), {}).get("country", ""), "dates": {"start": req.start_date.isoformat(), "end": req.end_date.isoformat()}, "travelers": req.travelers, "budget": state.get("budget"), "transport": state.get("transport"), "accommodation": state.get("accommodation"), "flight_options": state.get("flight_options", []), "hotel_options": state.get("hotel_options", []), "weather": state.get("weather"), "attractions": state.get("attractions", []), "places_source": state.get("places_source", "demo"), "route_source": state.get("route_source", "straight-line estimate"), "itinerary": state.get("itinerary", []), "agents_used": state.get("agent_trace", []) + ["Aggregator"]}
    return {"final_response": result}


def build_graph():
    graph = StateGraph(TravelState)
    graph.add_node("supervisor", supervisor)
    graph.add_node("aggregate", aggregator)
    for name, agent in AGENTS.items():
        def run_agent(state: TravelState, selected_agent=agent) -> dict[str, Any]:
            result = selected_agent(state)
            return {**result, "next_agent_index": state.get("next_agent_index", 0) + 1}
        graph.add_node(name, run_agent)
    graph.add_edge(START, "supervisor")
    destinations = {**{name: name for name in AGENTS}, "aggregate": "aggregate"}
    graph.add_conditional_edges("supervisor", route_next, destinations)
    for name in AGENTS:
        graph.add_conditional_edges(name, route_next, destinations)
    graph.add_edge("aggregate", END)
    return graph.compile()


workflow = build_graph()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/integrations")
def integrations() -> dict[str, Any]:
    """Report configured provider names and readiness without revealing secrets."""
    return {"integrations": settings.integrations()}


@app.post("/api/plan")
def plan_trip(request: PlanRequest) -> dict[str, Any]:
    if request.end_date <= request.start_date:
        raise HTTPException(422, "end_date must be after start_date")
    try:
        result = workflow.invoke({"request": request})
        return result["final_response"]
    except Exception as exc:
        raise HTTPException(503, f"Trip planning could not complete: {exc}") from exc


@app.post("/api/replan")
def replan(request: ReplanRequest) -> dict[str, Any]:
    plan = request.plan.copy()
    days = plan.get("itinerary", [])
    if not days:
        raise HTTPException(422, "The plan has no itinerary to update")
    delay = request.delay_hours or 0
    first = days[0]
    if delay >= 4:
        postponed = first.get("activities", [])
        first["activities"] = ["Rest, check in, and have a flexible nearby meal"]
        first["estimated_travel_km"] = 0
        if len(days) > 1:
            days[1]["activities"] = postponed + days[1].get("activities", [])
            first["replanned_note"] = f"Arrival delayed by {delay:g} hours; shifted sightseeing to later days."
        elif postponed:
            first["replanned_note"] = f"Arrival delayed by {delay:g} hours; original activities to reschedule: {', '.join(postponed)}."
    else:
        first["activities"] = ["Confirm arrival time, then keep the nearest planned activity"] + first.get("activities", [])[:1]
        first["replanned_note"] = request.event
    plan["itinerary"] = days
    plan["replan_note"] = f"Updated after: {request.event}"
    plan["agents_used"] = plan.get("agents_used", []) + ["Replanning Agent"]
    return plan


@app.get("/api/preferences/{user_id}")
def get_preferences(user_id: str) -> dict[str, Any]:
    return {"user_id": user_id, "preferences": preference_values(user_id)}


@app.put("/api/preferences/{user_id}")
def save_preferences(user_id: str, request: PreferencesRequest) -> dict[str, Any]:
    values = list(dict.fromkeys(x.strip() for x in request.preferences if x.strip()))[:30]
    with db() as connection:
        connection.execute("INSERT INTO preferences(user_id, values_json) VALUES(?, ?) ON CONFLICT(user_id) DO UPDATE SET values_json=excluded.values_json", (user_id, json.dumps(values)))
    return {"user_id": user_id, "preferences": values}
