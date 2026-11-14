import type {
  IPlacesProvider,
  IRoutesProvider,
  IWeatherProvider,
  IFlightsProvider,
  IHotelsProvider,
  ProviderRegistry,
} from "./base.js";
import { PlacesFixtureAdapter } from "./fixtures/places.fixture.js";
import { RoutesFixtureAdapter } from "./fixtures/routes.fixture.js";
import { WeatherFixtureAdapter } from "./fixtures/weather.fixture.js";
import { FlightsFixtureAdapter } from "./fixtures/flights.fixture.js";
import { HotelsFixtureAdapter } from "./fixtures/hotels.fixture.js";
import { GooglePlacesLiveAdapter } from "./live/google-places.js";
import { GoogleRoutesLiveAdapter } from "./live/google-routes.js";
import { OpenWeatherLiveAdapter } from "./live/open-weather.js";
import { DuffelFlightsLiveAdapter } from "./live/duffel-flights.js";
import { LiteApiLiveAdapter } from "./live/lite-api.js";
import { BookingComLiveAdapter } from "./live/booking-com.js";

export * from "./base.js";
export * from "./fixtures/places.fixture.js";
export * from "./fixtures/routes.fixture.js";
export * from "./fixtures/weather.fixture.js";
export * from "./fixtures/flights.fixture.js";
export * from "./fixtures/hotels.fixture.js";
export * from "./live/google-places.js";
export * from "./live/google-routes.js";
export * from "./live/open-weather.js";
export * from "./live/duffel-flights.js";
export * from "./live/lite-api.js";
export * from "./live/booking-com.js";

function shouldUseLive(explicitMode?: "fixture" | "live", hasKey?: boolean): boolean {
  if (explicitMode === "fixture") return false;
  if (explicitMode === "live") return true;
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.PROVIDER_MODE === "fixture") return false;
  return Boolean(hasKey);
}

export function getPlacesProvider(mode?: "fixture" | "live"): IPlacesProvider {
  if (shouldUseLive(mode, Boolean(process.env.GOOGLE_MAPS_API_KEY))) {
    return new GooglePlacesLiveAdapter();
  }
  return new PlacesFixtureAdapter();
}

export function getRoutesProvider(mode?: "fixture" | "live"): IRoutesProvider {
  if (shouldUseLive(mode, Boolean(process.env.GOOGLE_MAPS_API_KEY))) {
    return new GoogleRoutesLiveAdapter();
  }
  return new RoutesFixtureAdapter();
}

export function getWeatherProvider(mode?: "fixture" | "live"): IWeatherProvider {
  if (shouldUseLive(mode, Boolean(process.env.OPENWEATHER_API_KEY))) {
    return new OpenWeatherLiveAdapter();
  }
  return new WeatherFixtureAdapter();
}

export function getFlightsProvider(mode?: "fixture" | "live"): IFlightsProvider {
  if (shouldUseLive(mode, Boolean(process.env.DUFFEL_API_KEY))) {
    return new DuffelFlightsLiveAdapter();
  }
  return new FlightsFixtureAdapter();
}

export function getHotelsProvider(mode?: "fixture" | "live"): IHotelsProvider {
  const hasHotelKey = Boolean(process.env.LITEAPI_KEY || process.env.RAPIDAPI_KEY);
  if (shouldUseLive(mode, hasHotelKey)) {
    if (process.env.LITEAPI_KEY) {
      return new LiteApiLiveAdapter();
    }
    if (process.env.RAPIDAPI_KEY) {
      return new BookingComLiveAdapter();
    }
  }
  return new HotelsFixtureAdapter();
}

export function getProviderRegistry(overrides?: Partial<ProviderRegistry>, mode?: "fixture" | "live"): ProviderRegistry {
  return {
    places: overrides?.places ?? getPlacesProvider(mode),
    routes: overrides?.routes ?? getRoutesProvider(mode),
    weather: overrides?.weather ?? getWeatherProvider(mode),
    flights: overrides?.flights ?? getFlightsProvider(mode),
    hotels: overrides?.hotels ?? getHotelsProvider(mode),
  };
}
