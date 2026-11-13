from __future__ import annotations

from typing import Any

import httpx


PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
ROUTE_MATRIX_URL = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"


def search_attractions(destination: str, interests: list[str], api_key: str) -> list[dict[str, Any]]:
    interest_text = ", ".join(interests[:5])
    query = f"top tourist attractions and points of interest in {destination}"
    if interest_text:
        query += f" suited to {interest_text}"
    response = httpx.post(
        PLACES_URL,
        headers={
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.primaryType,places.formattedAddress",
        },
        json={"textQuery": query, "pageSize": 10},
        timeout=12,
    )
    response.raise_for_status()
    places = response.json().get("places", [])
    results = []
    for place in places:
        location = place.get("location", {})
        name = place.get("displayName", {}).get("text")
        if not name or "latitude" not in location or "longitude" not in location:
            continue
        results.append({
            "name": name,
            "lat": location["latitude"],
            "lon": location["longitude"],
            "category": place.get("primaryType", "attraction").replace("_", " "),
            "cost_eur": 0,
            "address": place.get("formattedAddress"),
            "place_id": place.get("id"),
        })
    return results


def route_matrix(locations: list[dict[str, Any]], api_key: str, travel_mode: str) -> dict[tuple[int, int], tuple[float, float]]:
    if not locations or len(locations) ** 2 > 100:
        return {}
    waypoints = [
        {"waypoint": {"location": {"latLng": {"latitude": item["lat"], "longitude": item["lon"]}}}}
        for item in locations
    ]
    response = httpx.post(
        ROUTE_MATRIX_URL,
        headers={
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "originIndex,destinationIndex,status,condition,distanceMeters,duration",
        },
        json={"origins": waypoints, "destinations": waypoints, "travelMode": travel_mode},
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    if isinstance(payload, dict):
        payload = payload.get("elements", [])
    matrix: dict[tuple[int, int], tuple[float, float]] = {}
    for element in payload:
        if element.get("condition") != "ROUTE_EXISTS" or element.get("status", {}).get("code", 0) != 0:
            continue
        try:
            seconds = float(element["duration"].removesuffix("s"))
            km = float(element["distanceMeters"]) / 1000
            matrix[(int(element["originIndex"]), int(element["destinationIndex"]))] = (seconds, km)
        except (KeyError, TypeError, ValueError):
            continue
    return matrix
