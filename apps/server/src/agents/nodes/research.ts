import type { TravelState, TravelStateUpdate } from "../state.js";
import { getProviderRegistry } from "../../providers/index.js";

export async function researchNode(state: TravelState): Promise<TravelStateUpdate> {
  const req = state.request;
  const providers = getProviderRegistry();

  const queryInterests = req.interests.length > 0 ? req.interests.join(" ") : "popular attractions";

  // 1. Search destination places
  const placesResult = await providers.places.searchPlaces({
    query: `${queryInterests} tourist attractions`,
    destination: req.destination,
    limit: 10,
    types: req.interests,
    radiusMeters: 15000,
  });

  // 2. Search flights
  const flightsResult = await providers.flights.searchFlights({
    origin: req.origin,
    destination: req.destination,
    departureDate: req.startDate,
    returnDate: req.endDate,
    adults: req.travellers.adults,
    currency: req.budget.currency,
  });

  // 3. Search hotels
  const hotelsResult = await providers.hotels.searchHotels({
    destination: req.destination,
    checkInDate: req.startDate,
    checkOutDate: req.endDate,
    adults: req.travellers.adults,
    rooms: 1,
    travelStyle: req.travelStyle,
    currency: req.budget.currency,
  });

  // 4. Get weather forecast for destination
  const firstCoord = placesResult[0]?.coordinates ?? { lat: 35.6762, lng: 139.6503 };
  const weatherResult = await providers.weather.getForecast({
    coordinates: firstCoord,
    startDate: req.startDate,
    endDate: req.endDate,
  });

  return {
    placesResult,
    flightsResult,
    hotelsResult,
    weatherResult,
  };
}
