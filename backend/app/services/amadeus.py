from __future__ import annotations

import time
from typing import Any

import httpx


_token: str | None = None
_token_expires_at = 0.0


def _access_token(client_id: str, client_secret: str, base_url: str) -> str:
    global _token, _token_expires_at
    if _token and time.time() < _token_expires_at - 30:
        return _token
    response = httpx.post(
        f"{base_url.rstrip('/')}/v1/security/oauth2/token",
        data={"grant_type": "client_credentials", "client_id": client_id, "client_secret": client_secret},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=12,
    )
    response.raise_for_status()
    payload = response.json()
    _token = payload["access_token"]
    _token_expires_at = time.time() + float(payload.get("expires_in", 1700))
    return _token


def _get(path: str, params: dict[str, Any], client_id: str, client_secret: str, base_url: str) -> dict[str, Any]:
    token = _access_token(client_id, client_secret, base_url)
    response = httpx.get(
        f"{base_url.rstrip('/')}/{path.lstrip('/')}",
        params=params,
        headers={"Authorization": f"Bearer {token}"},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def city_code(city: str, client_id: str, client_secret: str, base_url: str) -> str | None:
    response = _get(
        "/v1/reference-data/locations",
        {"subType": "CITY", "keyword": city, "page[limit]": 1, "view": "LIGHT"},
        client_id,
        client_secret,
        base_url,
    )
    matches = response.get("data", [])
    return matches[0].get("iataCode") if matches else None


def search_flights(origin: str, destination: str, depart: str, return_date: str, adults: int, client_id: str, client_secret: str, base_url: str) -> list[dict[str, Any]]:
    origin_code = city_code(origin, client_id, client_secret, base_url)
    destination_code = city_code(destination, client_id, client_secret, base_url)
    if not origin_code or not destination_code:
        return []
    response = _get(
        "/v2/shopping/flight-offers",
        {"originLocationCode": origin_code, "destinationLocationCode": destination_code, "departureDate": depart, "returnDate": return_date, "adults": adults, "currencyCode": "INR", "max": 5},
        client_id,
        client_secret,
        base_url,
    )
    result = []
    for offer in response.get("data", []):
        itineraries = offer.get("itineraries", [])
        segments = itineraries[0].get("segments", []) if itineraries else []
        carrier = segments[0].get("carrierCode", "Airline") if segments else "Airline"
        result.append({
            "airline": carrier,
            "departure": origin,
            "arrival": destination,
            "price_inr": round(float(offer.get("price", {}).get("grandTotal", offer.get("price", {}).get("total", 0)))),
            "currency": offer.get("price", {}).get("currency", "INR"),
            "outbound_duration": itineraries[0].get("duration") if itineraries else None,
            "stops": max(0, len(segments) - 1),
            "source": "Amadeus",
        })
    return result


def search_hotels(city: str, check_in: str, check_out: str, adults: int, rooms: int, client_id: str, client_secret: str, base_url: str) -> list[dict[str, Any]]:
    code = city_code(city, client_id, client_secret, base_url)
    if not code:
        return []
    hotel_list = _get(
        "/v1/reference-data/locations/hotels/by-city",
        {"cityCode": code, "radius": 5, "radiusUnit": "KM", "hotelSource": "ALL"},
        client_id,
        client_secret,
        base_url,
    )
    ids = [item.get("hotelId") for item in hotel_list.get("data", []) if item.get("hotelId")][:10]
    if not ids:
        return []
    offers = _get(
        "/v3/shopping/hotel-offers",
        {"hotelIds": ",".join(ids), "adults": adults, "checkInDate": check_in, "checkOutDate": check_out, "roomQuantity": rooms, "currency": "INR"},
        client_id,
        client_secret,
        base_url,
    )
    result = []
    for item in offers.get("data", []):
        hotel = item.get("hotel", {})
        room_offers = item.get("offers", [])
        if not room_offers:
            continue
        price = room_offers[0].get("price", {})
        result.append({
            "name": hotel.get("name", "Hotel"),
            "hotel_id": hotel.get("hotelId"),
            "estimated_total_inr": round(float(price.get("total", 0))),
            "currency": price.get("currency", "INR"),
            "source": "Amadeus",
        })
    return sorted(result, key=lambda item: item["estimated_total_inr"])[:5]
