import type { TravelState, TravelStateUpdate } from "../state.js";
import { getProviderRegistry } from "../../providers/index.js";

async function resolveDestinationCoordinates(
  destination: string,
  fallbackCoord?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number }> {
  if (fallbackCoord?.lat && fallbackCoord?.lng) return fallbackCoord;

  const lower = destination.toLowerCase().trim();
  const known: Record<string, { lat: number; lng: number }> = {
    laos: { lat: 17.9757, lng: 102.6331 },
    loas: { lat: 17.9757, lng: 102.6331 },
    vientiane: { lat: 17.9757, lng: 102.6331 },
    "luang prabang": { lat: 19.8893, lng: 102.1347 },
    china: { lat: 39.9042, lng: 116.4074 },
    beijing: { lat: 39.9042, lng: 116.4074 },
    shanghai: { lat: 31.2304, lng: 121.4737 },
    guangzhou: { lat: 23.1291, lng: 113.2644 },
    shenzhen: { lat: 22.5431, lng: 114.0579 },
    tokyo: { lat: 35.6762, lng: 139.6503 },
    kyoto: { lat: 35.0116, lng: 135.7681 },
    osaka: { lat: 34.6937, lng: 135.5023 },
    paris: { lat: 48.8566, lng: 2.3522 },
    london: { lat: 51.5074, lng: -0.1278 },
    lisbon: { lat: 38.7223, lng: -9.1393 },
    bangkok: { lat: 13.7563, lng: 100.5018 },
    singapore: { lat: 1.3521, lng: 103.8198 },
    "new york": { lat: 40.7128, lng: -74.006 },
    rome: { lat: 41.9028, lng: 12.4964 },
    barcelona: { lat: 41.3851, lng: 2.1734 },
    berlin: { lat: 52.52, lng: 13.405 },
    amsterdam: { lat: 52.3676, lng: 4.9041 },
    dubai: { lat: 25.2048, lng: 55.2708 },
    bali: { lat: -8.4095, lng: 115.1889 },
    seoul: { lat: 37.5665, lng: 126.978 },
    delhi: { lat: 28.6139, lng: 77.209 },
    mumbai: { lat: 19.076, lng: 72.8777 },
    sydney: { lat: -33.8688, lng: 151.2093 },
  };

  for (const [k, v] of Object.entries(known)) {
    if (lower.includes(k)) return v;
  }

  const gKey = process.env.GOOGLE_MAPS_API_KEY;
  if (gKey) {
    try {
      const gRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": gKey,
          "X-Goog-FieldMask": "places.location",
        },
        body: JSON.stringify({ textQuery: destination }),
      });
      if (gRes.ok) {
        const gData = (await gRes.json()) as { places?: Array<{ location?: { latitude: number; longitude: number } }> };
        const loc = gData.places?.[0]?.location;
        if (loc && typeof loc.latitude === "number" && typeof loc.longitude === "number") {
          return { lat: loc.latitude, lng: loc.longitude };
        }
      }
    } catch {
      // Fall through to default
    }
  }

  return { lat: 35.6762, lng: 139.6503 };
}

export async function weatherAgentNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const providers = getProviderRegistry();
  const warnings: string[] = [];

  const targetCoord = await resolveDestinationCoordinates(
    req.destination,
    state.placesResult?.[0]?.coordinates
  );

  try {
    const weatherResult = await providers.weather.getForecast({
      coordinates: targetCoord,
      startDate: req.startDate,
      endDate: req.endDate,
    });

    return {
      weatherResult,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Weather forecast unavailable: ${msg}`);
    return {
      weatherResult: undefined,
      warnings,
    };
  }
}

