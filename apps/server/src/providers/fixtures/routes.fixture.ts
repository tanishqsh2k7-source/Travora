import type { IRoutesProvider } from "../base.js";
import type {
  Coordinates,
  RouteLeg,
  RouteMatrixQuery,
  RouteMatrixResult,
  TravelMode,
} from "@travora/contracts";

/**
 * Great-circle distance between two points in meters using the Haversine formula.
 */
export function haversineDistanceMeters(c1: Coordinates, c2: Coordinates): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const lat1 = (c1.lat * Math.PI) / 180;
  const lat2 = (c2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Estimate travel duration in seconds based on straight-line distance and mode.
 * Uses a circuity factor of 1.3 to account for real urban road/path network layouts.
 */
export function estimateDurationSeconds(distanceMeters: number, mode: TravelMode): number {
  if (distanceMeters === 0) return 0;

  const networkDistance = distanceMeters * 1.3;

  switch (mode) {
    case "walking": {
      // 4.5 km/h = 1.25 m/s
      return Math.round(networkDistance / 1.25);
    }
    case "bicycling": {
      // 15 km/h = 4.17 m/s
      return Math.round(networkDistance / 4.17);
    }
    case "transit": {
      // 25 km/h average train/bus speed (6.94 m/s) + 5 min wait buffer
      const travel = networkDistance / 6.94;
      return Math.round(travel + 300);
    }
    case "driving":
    default: {
      // 35 km/h urban driving speed (9.72 m/s) + 2 min buffer
      const travel = networkDistance / 9.72;
      return Math.round(travel + 120);
    }
  }
}

export class RoutesFixtureAdapter implements IRoutesProvider {
  readonly name = "routes_fixture";

  async computeRoute(
    origin: Coordinates,
    destination: Coordinates,
    mode: TravelMode = "transit"
  ): Promise<RouteLeg> {
    const distanceMeters = haversineDistanceMeters(origin, destination);
    const durationSeconds = estimateDurationSeconds(distanceMeters, mode);

    return {
      origin,
      destination,
      distanceMeters,
      durationSeconds,
      mode,
      fetchedAt: new Date().toISOString(),
      provider: this.name,
    };
  }

  async computeRouteMatrix(query: RouteMatrixQuery): Promise<RouteMatrixResult> {
    const elements = [];

    for (let i = 0; i < query.origins.length; i++) {
      for (let j = 0; j < query.destinations.length; j++) {
        const origin = query.origins[i];
        const destination = query.destinations[j];
        const distanceMeters = haversineDistanceMeters(origin, destination);
        const durationSeconds = estimateDurationSeconds(distanceMeters, query.mode);

        elements.push({
          originIndex: i,
          destinationIndex: j,
          distanceMeters,
          durationSeconds,
          status: "OK" as const,
        });
      }
    }

    return {
      elements,
      fetchedAt: new Date().toISOString(),
      provider: this.name,
    };
  }
}
