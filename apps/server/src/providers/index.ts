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

export * from "./base.js";
export * from "./fixtures/places.fixture.js";
export * from "./fixtures/routes.fixture.js";
export * from "./fixtures/weather.fixture.js";
export * from "./fixtures/flights.fixture.js";
export * from "./fixtures/hotels.fixture.js";
export * from "./live/google-places.js";
export * from "./live/google-routes.js";
export * from "./live/open-weather.js";

export function getPlacesProvider(mode?: "fixture" | "live"): IPlacesProvider {
  if (mode === "fixture") return new PlacesFixtureAdapter();
  if (mode === "live" || Boolean(process.env.GOOGLE_MAPS_API_KEY)) {
    return new GooglePlacesLiveAdapter();
  }
  return new PlacesFixtureAdapter();
}

export function getRoutesProvider(mode?: "fixture" | "live"): IRoutesProvider {
  if (mode === "fixture") return new RoutesFixtureAdapter();
  if (mode === "live" || Boolean(process.env.GOOGLE_MAPS_API_KEY)) {
    return new GoogleRoutesLiveAdapter();
  }
  return new RoutesFixtureAdapter();
}

export function getWeatherProvider(mode?: "fixture" | "live"): IWeatherProvider {
  if (mode === "fixture") return new WeatherFixtureAdapter();
  if (mode === "live" || Boolean(process.env.OPENWEATHER_API_KEY)) {
    return new OpenWeatherLiveAdapter();
  }
  return new WeatherFixtureAdapter();
}

export function getFlightsProvider(): IFlightsProvider {
  return new FlightsFixtureAdapter();
}

export function getHotelsProvider(): IHotelsProvider {
  return new HotelsFixtureAdapter();
}

export function getProviderRegistry(overrides?: Partial<ProviderRegistry>): ProviderRegistry {
  return {
    places: overrides?.places ?? getPlacesProvider(),
    routes: overrides?.routes ?? getRoutesProvider(),
    weather: overrides?.weather ?? getWeatherProvider(),
    flights: overrides?.flights ?? getFlightsProvider(),
    hotels: overrides?.hotels ?? getHotelsProvider(),
  };
}
