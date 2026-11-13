import type { IPlacesProvider } from "../base.js";
import type { PlaceCandidate, PlaceSearchQuery } from "@travora/contracts";

const CANNED_PLACES: PlaceCandidate[] = [
  // ── Tokyo, Japan ─────────────────────────────────────────────────────────────
  {
    id: "tokyo_sensoji",
    name: "Senso-ji Temple",
    description: "Tokyo's oldest and most famous Buddhist temple in Asakusa",
    address: "2-3-1 Asakusa, Taito City, Tokyo",
    coordinates: { lat: 35.7148, lng: 139.7967 },
    rating: 4.6,
    userRatingsTotal: 72000,
    types: ["tourist_attraction", "place_of_worship", "historical"],
    openingHours: { openNow: true, weekdayText: ["Daily: 6:00 AM – 5:00 PM"] },
    priceLevel: 0,
    estimatedDurationMin: 90,
    sourceUrl: "https://www.senso-ji.jp/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "tokyo_meiji",
    name: "Meiji Jingu Shrine",
    description: "Shinto shrine nestled inside a lush forested park in Shibuya",
    address: "1-1 Yoyogikamizonocho, Shibuya City, Tokyo",
    coordinates: { lat: 35.6764, lng: 139.6993 },
    rating: 4.7,
    userRatingsTotal: 49000,
    types: ["tourist_attraction", "place_of_worship", "nature"],
    openingHours: { openNow: true, weekdayText: ["Daily: sunrise to sunset"] },
    priceLevel: 0,
    estimatedDurationMin: 75,
    sourceUrl: "https://www.meijijingu.or.jp/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "tokyo_shibuya_sky",
    name: "SHIBUYA SKY",
    description: "360-degree open-air observation deck on top of Shibuya Scramble Square",
    address: "2-24-12 Shibuya, Shibuya City, Tokyo",
    coordinates: { lat: 35.6585, lng: 139.7023 },
    rating: 4.6,
    userRatingsTotal: 18000,
    types: ["tourist_attraction", "viewpoint"],
    openingHours: { openNow: true, weekdayText: ["Daily: 10:00 AM – 10:30 PM"] },
    priceLevel: 2,
    estimatedDurationMin: 60,
    sourceUrl: "https://www.shibuya-scramble-square.com/sky/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "tokyo_ghibli",
    name: "Ghibli Museum",
    description: "Whimsical showcase of the anime works of Studio Ghibli",
    address: "1-1-83 Shimorenjaku, Mitaka, Tokyo",
    coordinates: { lat: 35.6963, lng: 139.5704 },
    rating: 4.7,
    userRatingsTotal: 34000,
    types: ["museum", "anime", "tourist_attraction"],
    openingHours: { openNow: true, weekdayText: ["Wed-Mon: 10:00 AM – 6:00 PM", "Tue: Closed"] },
    priceLevel: 2,
    estimatedDurationMin: 120,
    sourceUrl: "https://www.ghibli-museum.jp/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "tokyo_tsukiji",
    name: "Tsukiji Outer Market",
    description: "Bustling street food stalls, fresh sushi, wagyu skewers and culinary shops",
    address: "4 Chome Tsukiji, Chuo City, Tokyo",
    coordinates: { lat: 35.6655, lng: 139.7708 },
    rating: 4.4,
    userRatingsTotal: 43000,
    types: ["food", "market", "tourist_attraction"],
    openingHours: { openNow: true, weekdayText: ["Daily: 8:00 AM – 2:00 PM"] },
    priceLevel: 2,
    estimatedDurationMin: 90,
    sourceUrl: "https://www.tsukiji.or.jp/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "tokyo_national_museum",
    name: "Tokyo National Museum",
    description: "Japan's oldest and largest art museum in Ueno Park",
    address: "13-9 Uenokoen, Taito City, Tokyo",
    coordinates: { lat: 35.7188, lng: 139.7765 },
    rating: 4.6,
    userRatingsTotal: 29000,
    types: ["museum", "art_gallery", "historical"],
    openingHours: { openNow: true, weekdayText: ["Tue-Sun: 9:30 AM – 5:00 PM", "Mon: Closed"] },
    priceLevel: 1,
    estimatedDurationMin: 120,
    sourceUrl: "https://www.tnm.jp/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "tokyo_teamlab",
    name: "teamLab Planets TOKYO",
    description: "Immersive digital art museum where visitors walk through water",
    address: "6-1-16 Toyosu, Koto City, Tokyo",
    coordinates: { lat: 35.6491, lng: 139.7898 },
    rating: 4.7,
    userRatingsTotal: 38000,
    types: ["museum", "art_gallery", "tourist_attraction"],
    openingHours: { openNow: true, weekdayText: ["Daily: 9:00 AM – 10:00 PM"] },
    priceLevel: 3,
    estimatedDurationMin: 90,
    sourceUrl: "https://planets.teamlab.art/tokyo/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "tokyo_akihabara",
    name: "Akihabara Electric Town",
    description: "The global center for anime, manga, gaming, and electronics culture",
    address: "Sotokanda, Chiyoda City, Tokyo",
    coordinates: { lat: 35.6983, lng: 139.7731 },
    rating: 4.3,
    userRatingsTotal: 31000,
    types: ["anime", "shopping", "tourist_attraction"],
    openingHours: { openNow: true, weekdayText: ["Daily: 10:00 AM – 9:00 PM"] },
    priceLevel: 2,
    estimatedDurationMin: 120,
    sourceUrl: "https://e-akihabara.jp/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },

  // ── Lisbon, Portugal ──────────────────────────────────────────────────────────
  {
    id: "lisbon_jeronimos",
    name: "Jerónimos Monastery",
    description: "16th-century Manueline monastery and UNESCO World Heritage site",
    address: "Praça do Império 1400-206 Lisboa, Portugal",
    coordinates: { lat: 38.6979, lng: -9.2067 },
    rating: 4.6,
    userRatingsTotal: 45000,
    types: ["tourist_attraction", "historical", "place_of_worship"],
    openingHours: { openNow: true, weekdayText: ["Tue-Sun: 9:30 AM – 6:00 PM", "Mon: Closed"] },
    priceLevel: 2,
    estimatedDurationMin: 90,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "lisbon_gulbenkian",
    name: "Calouste Gulbenkian Museum",
    description: "Premier art museum housing an exceptional private collection of classical and modern art",
    address: "Av. de Berna 45A, 1067-001 Lisboa, Portugal",
    coordinates: { lat: 38.7374, lng: -9.1537 },
    rating: 4.7,
    userRatingsTotal: 19000,
    types: ["museum", "art_gallery"],
    openingHours: { openNow: true, weekdayText: ["Wed-Mon: 10:00 AM – 6:00 PM", "Tue: Closed"] },
    priceLevel: 2,
    estimatedDurationMin: 120,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "lisbon_timeout",
    name: "Time Out Market Lisboa",
    description: "Iconic food hall with curated stalls by Lisbon's top chefs",
    address: "Av. 24 de Julho 49, 1200-479 Lisboa, Portugal",
    coordinates: { lat: 38.7071, lng: -9.1462 },
    rating: 4.4,
    userRatingsTotal: 58000,
    types: ["food", "market"],
    openingHours: { openNow: true, weekdayText: ["Daily: 10:00 AM – 12:00 AM"] },
    priceLevel: 2,
    estimatedDurationMin: 75,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
];

export class PlacesFixtureAdapter implements IPlacesProvider {
  readonly name = "places_fixture";

  async searchPlaces(query: PlaceSearchQuery): Promise<PlaceCandidate[]> {
    const qLower = query.query.toLowerCase();
    const destLower = (query.destination ?? "").toLowerCase();

    // Filter canned places matching query or destination
    let matches = CANNED_PLACES.filter((p) => {
      const matchName = p.name.toLowerCase().includes(qLower);
      const matchDesc = (p.description ?? "").toLowerCase().includes(qLower);
      const matchAddress = p.address.toLowerCase().includes(destLower);
      const matchTypes = p.types.some((t) => qLower.includes(t) || query.types.includes(t));
      return matchName || matchDesc || matchAddress || matchTypes;
    });

    if (matches.length === 0) {
      // Fallback matching any place in the canned collection
      matches = CANNED_PLACES.slice(0, query.limit);
    }

    return matches.slice(0, query.limit).map((p) => ({
      ...p,
      fetchedAt: new Date().toISOString(),
    }));
  }

  async getPlaceDetails(placeId: string): Promise<PlaceCandidate | null> {
    const place = CANNED_PLACES.find((p) => p.id === placeId);
    if (!place) return null;
    return {
      ...place,
      fetchedAt: new Date().toISOString(),
    };
  }
}
