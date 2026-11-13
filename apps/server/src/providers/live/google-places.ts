import type { IPlacesProvider } from "../base.js";
import { ProviderError } from "../base.js";
import type { PlaceCandidate, PlaceSearchQuery } from "@travora/contracts";

interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

interface GooglePlaceDisplayName {
  text: string;
  languageCode?: string;
}

interface GooglePlaceOpeningHours {
  openNow?: boolean;
  weekdayDescriptions?: string[];
}

interface GooglePlaceResult {
  id: string;
  displayName?: GooglePlaceDisplayName;
  formattedAddress?: string;
  location?: GooglePlaceLocation;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  regularOpeningHours?: GooglePlaceOpeningHours;
  priceLevel?: string;
  editorialSummary?: { text: string };
  websiteUri?: string;
}

export class GooglePlacesLiveAdapter implements IPlacesProvider {
  readonly name = "google_places";
  private apiKey: string;
  private baseUrl = "https://places.googleapis.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GOOGLE_MAPS_API_KEY ?? "";
  }

  private normalizePlace(p: GooglePlaceResult): PlaceCandidate {
    const lat = p.location?.latitude ?? 0;
    const lng = p.location?.longitude ?? 0;

    let priceLevel = 0;
    if (p.priceLevel === "PRICE_LEVEL_INEXPENSIVE") priceLevel = 1;
    else if (p.priceLevel === "PRICE_LEVEL_MODERATE") priceLevel = 2;
    else if (p.priceLevel === "PRICE_LEVEL_EXPENSIVE") priceLevel = 3;
    else if (p.priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") priceLevel = 4;

    return {
      id: p.id,
      name: p.displayName?.text ?? "Unknown Place",
      description: p.editorialSummary?.text,
      address: p.formattedAddress ?? "",
      coordinates: { lat, lng },
      rating: p.rating,
      userRatingsTotal: p.userRatingCount,
      types: p.types ?? [],
      openingHours: p.regularOpeningHours
        ? {
            openNow: p.regularOpeningHours.openNow,
            weekdayText: p.regularOpeningHours.weekdayDescriptions ?? [],
          }
        : undefined,
      priceLevel,
      estimatedDurationMin: 90,
      sourceUrl: p.websiteUri,
      fetchedAt: new Date().toISOString(),
      provider: this.name,
    };
  }

  async searchPlaces(query: PlaceSearchQuery): Promise<PlaceCandidate[]> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "GOOGLE_MAPS_API_KEY is not configured", 401);
    }

    const textQuery = query.destination ? `${query.query} in ${query.destination}` : query.query;

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.types",
      "places.regularOpeningHours",
      "places.priceLevel",
      "places.editorialSummary",
      "places.websiteUri",
    ].join(",");

    const res = await fetch(`${this.baseUrl}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery,
        pageSize: query.limit,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new ProviderError(
        this.name,
        `Places searchText failed: ${res.status} ${res.statusText}`,
        res.status,
        errText
      );
    }

    const data = (await res.json()) as { places?: GooglePlaceResult[] };
    return (data.places ?? []).map((p) => this.normalizePlace(p));
  }

  async getPlaceDetails(placeId: string): Promise<PlaceCandidate | null> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "GOOGLE_MAPS_API_KEY is not configured", 401);
    }

    const fieldMask = [
      "id",
      "displayName",
      "formattedAddress",
      "location",
      "rating",
      "userRatingCount",
      "types",
      "regularOpeningHours",
      "priceLevel",
      "editorialSummary",
      "websiteUri",
    ].join(",");

    const res = await fetch(`${this.baseUrl}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
    });

    if (res.status === 404) return null;

    if (!res.ok) {
      const errText = await res.text();
      throw new ProviderError(
        this.name,
        `Place details failed: ${res.status} ${res.statusText}`,
        res.status,
        errText
      );
    }

    const data = (await res.json()) as GooglePlaceResult;
    return this.normalizePlace(data);
  }
}
