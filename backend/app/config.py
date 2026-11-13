from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or None
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    amadeus_client_id: str | None = os.getenv("AMADEUS_CLIENT_ID") or None
    amadeus_client_secret: str | None = os.getenv("AMADEUS_CLIENT_SECRET") or None
    amadeus_base_url: str = os.getenv("AMADEUS_BASE_URL", "https://test.api.amadeus.com")
    google_maps_api_key: str | None = os.getenv("GOOGLE_MAPS_API_KEY") or None
    openweather_api_key: str | None = os.getenv("OPENWEATHER_API_KEY") or None

    def integrations(self) -> dict[str, dict[str, str | bool]]:
        amadeus_ready = bool(self.amadeus_client_id and self.amadeus_client_secret)
        return {
            "llm": {
                "provider": "Google Gemini API (free tier)",
                "model": self.gemini_model,
                "credentials_present": bool(self.gemini_api_key),
            },
            "flights": {"provider": "Amadeus Self-Service", "credentials_present": amadeus_ready},
            "hotels": {"provider": "Amadeus Self-Service", "credentials_present": amadeus_ready},
            "places_and_routes": {"provider": "Google Maps Platform", "credentials_present": bool(self.google_maps_api_key)},
            "weather": {"provider": "OpenWeather", "credentials_present": bool(self.openweather_api_key)},
        }


settings = Settings()
