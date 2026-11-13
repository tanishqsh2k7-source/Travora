import type { IRoutesProvider } from "../base.js";
import { ProviderError } from "../base.js";
import type {
  Coordinates,
  RouteLeg,
  RouteMatrixElement,
  RouteMatrixQuery,
  RouteMatrixResult,
  TravelMode,
} from "@travora/contracts";

export class GoogleRoutesLiveAdapter implements IRoutesProvider {
  readonly name = "google_routes";
  private apiKey: string;
  private routesBaseUrl = "https://routes.googleapis.com";

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
  }

  private mapTravelMode(mode: TravelMode): string {
    switch (mode) {
      case "walking":
        return "WALK";
      case "bicycling":
        return "BICYCLE";
      case "transit":
        return "TRANSIT";
      case "driving":
      default:
        return "DRIVE";
    }
  }

  private parseDurationSeconds(durationStr?: string): number {
    if (!durationStr) return 0;
    // Format is e.g. "1245s"
    const matched = durationStr.match(/^(\d+)s$/);
    return matched ? parseInt(matched[1], 10) : 0;
  }

  async computeRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TravelMode = "transit"
  ): Promise<RouteLeg> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "GOOGLE_MAPS_API_KEY is not configured", 401);
    }

    const travelMode = this.mapTravelMode(mode);

    const res = await fetch(`${this.routesBaseUrl}/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new ProviderError(
        this.name,
        `computeRoutes failed: ${res.status} ${res.statusText}`,
        res.status,
        errText
      );
    }

    interface GoogleRouteResponse {
      routes?: Array<{
        distanceMeters?: number;
        duration?: string;
        polyline?: { encodedPolyline?: string };
      }>;
    }

    const data = (await res.json()) as GoogleRouteResponse;
    const primaryRoute = data.routes?.[0];

    const distanceMeters = primaryRoute?.distanceMeters ?? 0;
    const durationSeconds = this.parseDurationSeconds(primaryRoute?.duration);

    return {
      origin,
      destination,
      distanceMeters,
      durationSeconds,
      mode,
      polyline: primaryRoute?.polyline?.encodedPolyline,
      fetchedAt: new Date().toISOString(),
      provider: this.name,
    };
  }

  async computeRouteMatrix(query: RouteMatrixQuery): Promise<RouteMatrixResult> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "GOOGLE_MAPS_API_KEY is not configured", 401);
    }

    const travelMode = this.mapTravelMode(query.mode);

    const origins = query.origins.map((c) => ({
      waypoint: { location: { latLng: { latitude: c.lat, longitude: c.lng } } },
    }));

    const destinations = query.destinations.map((c) => ({
      waypoint: { location: { latLng: { latitude: c.lat, longitude: c.lng } } },
    }));

    const res = await fetch(`${this.routesBaseUrl}/distanceMatrix/v2:computeRouteMatrix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": "originIndex,destinationIndex,status,duration,distanceMeters",
      },
      body: JSON.stringify({
        origins,
        destinations,
        travelMode,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new ProviderError(
        this.name,
        `computeRouteMatrix failed: ${res.status} ${res.statusText}`,
        res.status,
        errText
      );
    }

    interface MatrixRow {
      originIndex?: number;
      destinationIndex?: number;
      status?: { code?: number };
      duration?: string;
      distanceMeters?: number;
    }

    const rows = (await res.json()) as MatrixRow[];
    const elements: RouteMatrixElement[] = rows.map((r) => ({
      originIndex: r.originIndex ?? 0,
      destinationIndex: r.destinationIndex ?? 0,
      distanceMeters: r.distanceMeters ?? 0,
      durationSeconds: this.parseDurationSeconds(r.duration),
      status: r.status?.code && r.status.code !== 0 ? "FAILED" : "OK",
    }));

    return {
      elements,
      fetchedAt: new Date().toISOString(),
      provider: this.name,
    };
  }
}

