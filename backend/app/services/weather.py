from __future__ import annotations

from datetime import date
from typing import Any

import httpx


def trip_forecast(destination: str, start: date, end: date, api_key: str) -> dict[str, Any]:
    response = httpx.get(
        "https://api.openweathermap.org/data/2.5/forecast",
        params={"q": destination, "appid": api_key, "units": "metric"},
        timeout=12,
    )
    response.raise_for_status()
    entries = response.json().get("list", [])
    by_day: dict[str, list[dict[str, Any]]] = {}
    for entry in entries:
        timestamp = entry.get("dt_txt", "")
        day = timestamp[:10]
        if not day or not (start.isoformat() <= day < end.isoformat()):
            continue
        description = (entry.get("weather") or [{}])[0].get("description", "")
        by_day.setdefault(day, []).append({
            "time": timestamp[11:16],
            "temperature_c": round(float(entry.get("main", {}).get("temp", 0))),
            "description": description,
            "precipitation_probability": round(float(entry.get("pop", 0)) * 100),
        })
    days = []
    for day, forecasts in sorted(by_day.items()):
        temps = [x["temperature_c"] for x in forecasts]
        days.append({"date": day, "low_c": min(temps), "high_c": max(temps), "summary": forecasts[len(forecasts) // 2]["description"], "precipitation_probability": max(x["precipitation_probability"] for x in forecasts)})
    return {"available": bool(days), "source": "OpenWeather 5-day forecast", "days": days, "note": "Forecasts are returned only when trip dates fall inside the provider's current forecast window." if not days else "Forecast conditions can change; check again close to departure."}
