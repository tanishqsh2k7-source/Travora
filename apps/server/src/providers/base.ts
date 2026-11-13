import type {
  Coordinates,
  PlaceCandidate,
  PlaceSearchQuery,
  RouteLeg,
  RouteMatrixQuery,
  RouteMatrixResult,
  TravelMode,
  WeatherForecast,
  WeatherQuery,
  FlightOffer,
  FlightSearchQuery,
  HotelOffer,
  HotelSearchQuery,
} from "@travora/contracts";

export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(`[${provider}] ${message}`);
    this.name = "ProviderError";
  }
}

export interface IPlacesProvider {
  readonly name: string;
  searchPlaces(query: PlaceSearchQuery): Promise<PlaceCandidate[]>;
  getPlaceDetails(placeId: string): Promise<PlaceCandidate | null>;
}

export interface IRoutesProvider {
  readonly name: string;
  computeRoute(origin: Coordinates, destination: Coordinates, mode?: TravelMode): Promise<RouteLeg>;
  computeRouteMatrix(query: RouteMatrixQuery): Promise<RouteMatrixResult>;
}

export interface IWeatherProvider {
  readonly name: string;
  getForecast(query: WeatherQuery): Promise<WeatherForecast>;
}

export interface IFlightsProvider {
  readonly name: string;
  searchFlights(query: FlightSearchQuery): Promise<FlightOffer[]>;
}

export interface IHotelsProvider {
  readonly name: string;
  searchHotels(query: HotelSearchQuery): Promise<HotelOffer[]>;
}

export interface ProviderRegistry {
  places: IPlacesProvider;
  routes: IRoutesProvider;
  weather: IWeatherProvider;
  flights: IFlightsProvider;
  hotels: IHotelsProvider;
}

