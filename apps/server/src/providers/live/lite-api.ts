import type { IHotelsProvider } from "../base.js";
import { ProviderError } from "../base.js";
import type { HotelOffer, HotelSearchQuery } from "@travora/contracts";

interface LiteApiHotel {
  id: string;
  name?: string;
  hotelDescription?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  starRating?: number;
  amenities?: string[];
  retailRate?: {
    total?: Array<{
      amount: number;
      currency: string;
    }>;
  };
}

interface LiteApiResponse {
  data?: LiteApiHotel[];
}

export class LiteApiLiveAdapter implements IHotelsProvider {
  readonly name = "lite_api";
  private apiKey: string;
  private baseUrl = "https://api.liteapi.travel/v3.0";

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.LITEAPI_KEY ?? "";
  }

  private async resolveCoordinates(destination: string, coordinates?: { lat: number; lng: number }): Promise<{ lat: number; lng: number }> {
    if (coordinates?.lat && coordinates?.lng) return coordinates;

    const lower = destination.toLowerCase().trim();
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      china: { lat: 39.9042, lng: 116.4074 },
      beijing: { lat: 39.9042, lng: 116.4074 },
      shanghai: { lat: 31.2304, lng: 121.4737 },
      guangzhou: { lat: 23.1291, lng: 113.2644 },
      shenzhen: { lat: 22.5431, lng: 114.0579 },
      chengdu: { lat: 30.5728, lng: 104.0668 },
      "xi'an": { lat: 34.3416, lng: 108.9398 },
      xian: { lat: 34.3416, lng: 108.9398 },
      "hong kong": { lat: 22.3193, lng: 114.1694 },
      laos: { lat: 17.9757, lng: 102.6331 },
      loas: { lat: 17.9757, lng: 102.6331 },
      vientiane: { lat: 17.9757, lng: 102.6331 },
      "luang prabang": { lat: 19.8893, lng: 102.1347 },
      tokyo: { lat: 35.6762, lng: 139.6503 },
      kyoto: { lat: 35.0116, lng: 135.7681 },
      osaka: { lat: 34.6937, lng: 135.5023 },
      paris: { lat: 48.8566, lng: 2.3522 },
      london: { lat: 51.5074, lng: -0.1278 },
      "new york": { lat: 40.7128, lng: -74.006 },
      lisbon: { lat: 38.7223, lng: -9.1393 },
      rome: { lat: 41.9028, lng: 12.4964 },
      barcelona: { lat: 41.3851, lng: 2.1734 },
      amsterdam: { lat: 52.3676, lng: 4.9041 },
      berlin: { lat: 52.52, lng: 13.405 },
      dubai: { lat: 25.2048, lng: 55.2708 },
      singapore: { lat: 1.3521, lng: 103.8198 },
      bangkok: { lat: 13.7563, lng: 100.5018 },
      sydney: { lat: -33.8688, lng: 151.2093 },
      delhi: { lat: 28.6139, lng: 77.209 },
      mumbai: { lat: 19.076, lng: 72.8777 },
      vienna: { lat: 48.2082, lng: 16.3738 },
      madrid: { lat: 40.4168, lng: -3.7038 },
      bali: { lat: -8.4095, lng: 115.1889 },
      seoul: { lat: 37.5665, lng: 126.978 },
      hanoi: { lat: 21.0285, lng: 105.8542 },
      "ho chi minh": { lat: 10.8231, lng: 106.6297 },
      cairo: { lat: 30.0444, lng: 31.2357 },
    };

    for (const [key, coords] of Object.entries(cityCoords)) {
      if (lower.includes(key)) return coords;
    }

    // Dynamic geocoding fallback via Google Places API if key available
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
        // Fall back gracefully
      }
    }

    // Default to Tokyo if entirely unresolved
    return { lat: 35.6762, lng: 139.6503 };
  }

  async searchHotels(query: HotelSearchQuery): Promise<HotelOffer[]> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "LITEAPI_KEY is not configured", 401);
    }

    const checkIn = new Date(query.checkInDate);
    const checkOut = new Date(query.checkOutDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay));

    const coords = await this.resolveCoordinates(query.destination, query.coordinates);
    const url = `${this.baseUrl}/data/hotels?latitude=${coords.lat}&longitude=${coords.lng}&limit=10`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new ProviderError(
        this.name,
        `LiteAPI hotel search failed: ${res.status} ${res.statusText}`,
        res.status,
        errText
      );
    }

    const data = (await res.json()) as LiteApiResponse;
    const list = data.data ?? [];

    const isINR = query.currency.toUpperCase() === "INR";
    const baseMultiplier = isINR ? 85 : 1;

    return list.slice(0, 10).map((h, index): HotelOffer => {
      const lat = typeof h.latitude === "number" ? h.latitude : query.coordinates?.lat ?? 0;
      const lng = typeof h.longitude === "number" ? h.longitude : query.coordinates?.lng ?? 0;
      const stars = h.starRating ? Math.min(5, Math.max(1, Math.round(h.starRating))) : 4;
      const rating = h.rating ? Math.min(5, Math.max(0, h.rating)) : 4.2;

      // Rate calculation: from retail rate if available, or estimated based on hotel tier
      let nightRateCents: number;
      if (h.retailRate?.total?.[0]?.amount) {
        nightRateCents = Math.round(h.retailRate.total[0].amount * 100);
      } else {
        const defaultNightUsd = stars >= 5 ? 350 : stars >= 4 ? 160 : 75;
        nightRateCents = Math.round(defaultNightUsd * baseMultiplier * 100);
      }

      const rooms = query.rooms ? Math.max(1, query.rooms) : 1;
      const totalRateCents = nightRateCents * nights * rooms;

      return {
        id: h.id || `htl_lite_${index}`,
        name: h.name || `Hotel in ${query.destination}`,
        description: h.hotelDescription ?? h.description ?? `Comfortable stay in ${query.destination}`,
        address: h.address || query.destination,
        coordinates: { lat, lng },
        rating,
        stars,
        pricePerNight: {
          amount: nightRateCents,
          currency: query.currency.toUpperCase(),
        },
        totalPrice: {
          amount: totalRateCents,
          currency: query.currency.toUpperCase(),
        },
        nights,
        amenities: Array.isArray(h.amenities) && h.amenities.length > 0
          ? h.amenities.slice(0, 6)
          : ["Free High-Speed WiFi", "Air Conditioning", "24/7 Front Desk"],
        cancellationPolicy: "Free cancellation up to 48 hours before check-in",
        hotelStyle: query.travelStyle ?? (stars >= 5 ? "luxury" : stars <= 3 ? "budget" : "balanced"),
        bookingUrl: `https://www.google.com/travel/hotels?q=${encodeURIComponent(h.name || query.destination)}`,
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      };
    });
  }
}
