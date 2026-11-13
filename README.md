# Wayfarer travel planner

A small full-stack travel-planning demo that implements intent-based agent routing, budget-aware estimates, route ordering, trip replanning, and saved travel preferences.

## Run locally

Backend (Python 3.11+):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend (Node.js):

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`. The backend listens on `http://localhost:8000`; interactive API docs are at `/docs`.

## Provider setup

Copy `backend/.env.example` to `backend/.env`. Keep actual keys in `.env`; do not paste them into the React app or commit them. `GET /api/integrations` reports whether credentials are present, not whether a provider request has succeeded.

The Gemini API key activates LLM-based supervisor routing. The default model is `gemini-3.5-flash-lite`, which Google currently lists with free-tier input and output tokens. If the key is missing, a request fails, or a free-tier quota is reached, the supervisor falls back to local intent rules. Gemini free-tier limits and model availability can change; check Google's current [pricing](https://ai.google.dev/gemini-api/docs/pricing) and [model list](https://ai.google.dev/gemini-api/docs/models). Free-tier prompts may be used to improve Google's products, as described on its pricing page.

## Implemented behavior

- The LangGraph supervisor routes “suggest places” requests to the destination specialist and complete-trip requests through transport, accommodation, budget, and itinerary specialists.
- The budget specialist totals flights, lodging, food, activities, and local transport, then reduces the lodging/food estimates and flags any remaining overage.
- The itinerary specialist orders nearby attractions with a nearest-neighbor route heuristic. With a Google Maps key, it searches Places API (New) and ranks route legs using a Routes API matrix; otherwise it uses the bundled sample data and straight-line fallback.
- The replanning endpoint accepts a changed event and delay, then replaces a heavily affected first day with a flexible arrival day.
- Travel preferences are saved in SQLite and influence attraction selection. The local database is created at `backend/travel_planner.db` on first use.

## Demo data and limits

When credentials are available, Places and route matrices use Google Maps Platform, flight/hotel searches use Amadeus Self-Service, and a 5-day forecast uses OpenWeather. Missing keys or provider errors fall back to demo estimates or an unavailable-data note. No bookings or payments are made. This demo has no authentication; the `local` user ID is only a local profile key.

Set `TRAVEL_PLANNER_DB` to change the SQLite file path, `CORS_ORIGINS` to configure allowed frontend origins, and `VITE_API_URL` to point the frontend at a different backend URL.

## APIs to arrange

Start with these accounts and keys. Use sandbox/test access wherever offered; no provider key belongs in frontend code.

1. **Google Gemini API (optional, free tier available)** — create an API key in [Google AI Studio](https://aistudio.google.com/apikey) and add `GEMINI_API_KEY` to `backend/.env`. The default model is `gemini-3.5-flash-lite`; change `GEMINI_MODEL` only to a model available to your account and tier. Free usage is subject to Google's model-specific rate limits and availability. If you leave the key blank, rule-based routing still works.
2. **Google Maps Platform** — create a Cloud project with billing, enable **Places API (New)** and **Routes API**, and create a key restricted to only those APIs. Add `GOOGLE_MAPS_API_KEY`. Places supplies attractions/details; Routes Compute Route Matrix supplies real travel distances and times for the itinerary optimizer. Set quota/budget alerts. [Places setup](https://developers.google.com/maps/documentation/places/web-service/get-api-key) · [Routes setup](https://developers.google.com/maps/documentation/routes/get-api-key) · [Usage and billing](https://developers.google.com/maps/documentation/routes/usage-and-billing)
3. **Amadeus for Developers Self-Service** — register and create an app to get a `client_id` and `client_secret`; begin in the test environment. Use Flight Offers Search for fares and Hotel List + Hotel Search for stay options. Add both credentials and `AMADEUS_BASE_URL=https://test.api.amadeus.com`. This is search/price discovery; real-world flight booking has additional market and consolidator requirements, so skip booking credentials for the demo. [Quick start](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/quick-start/) · [Hotel APIs](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/hotels/) · [API FAQ](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/)
4. **OpenWeather** — create an account and API key, then add `OPENWEATHER_API_KEY`. Useful for current conditions and forecasts near the trip; far-future dates will need a seasonal expectation instead of a precise forecast. [Weather APIs and key setup](https://openweathermap.org/api)

You do **not** need to arrange booking, payment, authentication, PostgreSQL, Redis, or Celery services for this planning demo. Adapters are in place for Google Places/Routes, Amadeus flight/hotel search, and OpenWeather forecast, each with a graceful fallback when keys or live results are unavailable.
