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

  // ── China (Beijing & Shanghai) ────────────────────────────────────────────────
  {
    id: "china_forbidden_city",
    name: "The Forbidden City (Palace Museum)",
    description: "Vast imperial palace complex of the Ming and Qing dynasties and UNESCO World Heritage treasure",
    address: "4 Jingshanqian St, Dongcheng, Beijing, China",
    coordinates: { lat: 39.9163, lng: 116.3972 },
    rating: 4.8,
    userRatingsTotal: 88000,
    types: ["tourist_attraction", "historical", "museum"],
    openingHours: { openNow: true, weekdayText: ["Tue-Sun: 8:30 AM – 5:00 PM", "Mon: Closed"] },
    priceLevel: 2,
    estimatedDurationMin: 180,
    sourceUrl: "https://www.dpm.org.cn/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "china_great_wall",
    name: "Mutianyu Great Wall",
    description: "Spectacularly restored section of the Great Wall surrounded by rolling wooded hills and guard towers",
    address: "Mutianyu Village, Huairou District, Beijing, China",
    coordinates: { lat: 40.4319, lng: 116.5704 },
    rating: 4.9,
    userRatingsTotal: 95000,
    types: ["tourist_attraction", "historical", "nature"],
    openingHours: { openNow: true, weekdayText: ["Daily: 7:30 AM – 5:30 PM"] },
    priceLevel: 2,
    estimatedDurationMin: 240,
    sourceUrl: "http://www.mutianyugreatwall.com/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "china_temple_of_heaven",
    name: "Temple of Heaven",
    description: "Iconic imperial complex where emperors prayed for bountiful harvests in ancient pine gardens",
    address: "1 Tiantan E Rd, Dongcheng, Beijing, China",
    coordinates: { lat: 39.8822, lng: 116.4066 },
    rating: 4.7,
    userRatingsTotal: 52000,
    types: ["tourist_attraction", "historical", "place_of_worship"],
    openingHours: { openNow: true, weekdayText: ["Daily: 6:00 AM – 9:00 PM"] },
    priceLevel: 1,
    estimatedDurationMin: 120,
    sourceUrl: "https://www.tiantanpark.com/",
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "china_summer_palace",
    name: "Summer Palace (Yiheyuan)",
    description: "Imperial retreat showcasing classical Chinese landscape garden design with Kunming Lake and Longevity Hill",
    address: "19 Xinjiangongmen Rd, Haidian District, Beijing, China",
    coordinates: { lat: 39.9999, lng: 116.2755 },
    rating: 4.8,
    userRatingsTotal: 61000,
    types: ["tourist_attraction", "historical", "nature"],
    openingHours: { openNow: true, weekdayText: ["Daily: 6:30 AM – 6:00 PM"] },
    priceLevel: 2,
    estimatedDurationMin: 150,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "china_bund_shanghai",
    name: "The Bund (Waitan)",
    description: "Historic waterfront promenade lined with stately colonial buildings facing the futuristic Pudong skyline",
    address: "Zhongshan East 1st Rd, Huangpu, Shanghai, China",
    coordinates: { lat: 31.2397, lng: 121.4904 },
    rating: 4.7,
    userRatingsTotal: 68000,
    types: ["tourist_attraction", "viewpoint", "walking"],
    openingHours: { openNow: true, weekdayText: ["Daily: 24 hours"] },
    priceLevel: 0,
    estimatedDurationMin: 90,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "china_national_museum",
    name: "National Museum of China",
    description: "One of the world's premier museums holding an extensive collection of ancient Chinese history and culture",
    address: "16 E Chang'an Ave, Dongcheng, Beijing, China",
    coordinates: { lat: 39.9054, lng: 116.4018 },
    rating: 4.7,
    userRatingsTotal: 42000,
    types: ["museum", "historical", "art_gallery"],
    openingHours: { openNow: true, weekdayText: ["Tue-Sun: 9:00 AM – 5:00 PM", "Mon: Closed"] },
    priceLevel: 0,
    estimatedDurationMin: 150,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "china_wangfujing",
    name: "Wangfujing Pedestrian Street & Food Market",
    description: "Famous pedestrian thoroughfare renowned for street food stalls, modern shopping malls, and tea houses",
    address: "Wangfujing, Dongcheng District, Beijing, China",
    coordinates: { lat: 39.9142, lng: 116.4117 },
    rating: 4.5,
    userRatingsTotal: 34000,
    types: ["food", "market", "shopping", "tourist_attraction"],
    openingHours: { openNow: true, weekdayText: ["Daily: 9:30 AM – 10:00 PM"] },
    priceLevel: 2,
    estimatedDurationMin: 90,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "china_798_art_zone",
    name: "798 Art Zone",
    description: "Dynamic art district in decommissioned military factory buildings with edgy galleries, boutiques, and cafes",
    address: "2 Jiuxianqiao Rd, Chaoyang District, Beijing, China",
    coordinates: { lat: 39.9841, lng: 116.4975 },
    rating: 4.6,
    userRatingsTotal: 29000,
    types: ["museum", "art_gallery", "culture", "tourist_attraction"],
    openingHours: { openNow: true, weekdayText: ["Tue-Sun: 10:00 AM – 6:00 PM"] },
    priceLevel: 1,
    estimatedDurationMin: 120,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "laos_pha_that_luang",
    name: "Pha That Luang Vientiane",
    description: "National symbol of Laos, a stunning 44-meter high gold-covered large Buddhist stupa dating back to the 16th century",
    address: "That Luang, Xaysettha 10009, Vientiane, Laos",
    coordinates: { lat: 17.9766, lng: 102.6365 },
    rating: 4.6,
    userRatingsTotal: 14000,
    types: ["historical", "culture", "tourist_attraction", "religious"],
    openingHours: { openNow: true, weekdayText: ["Daily: 8:00 AM – 5:00 PM"] },
    priceLevel: 1,
    estimatedDurationMin: 90,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "laos_patuxai",
    name: "Patuxai War Monument",
    description: "Vientiane's iconic Arc de Triomphe monument with Lao motifs, offering panoramic viewing decks over the city",
    address: "Lane Xang Avenue, Vientiane, Laos",
    coordinates: { lat: 17.9706, lng: 102.6185 },
    rating: 4.5,
    userRatingsTotal: 18000,
    types: ["viewpoint", "architecture", "tourist_attraction", "historical"],
    openingHours: { openNow: true, weekdayText: ["Daily: 8:00 AM – 5:00 PM"] },
    priceLevel: 1,
    estimatedDurationMin: 60,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "laos_wat_si_saket",
    name: "Wat Si Saket & Cloister",
    description: "Vientiane's oldest surviving Buddhist temple housing thousands of Buddha statues made of terracotta, bronze, and stone",
    address: "Avenue Lane Xang, Vientiane, Laos",
    coordinates: { lat: 17.9628, lng: 102.6117 },
    rating: 4.6,
    userRatingsTotal: 8500,
    types: ["historical", "museum", "culture", "religious"],
    openingHours: { openNow: true, weekdayText: ["Daily: 8:00 AM – 12:00 PM, 1:00 PM – 4:00 PM"] },
    priceLevel: 1,
    estimatedDurationMin: 60,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "laos_kuang_si",
    name: "Kuang Si Waterfall",
    description: "Breathtaking multi-tiered cascade with turquoise blue jungle pools for swimming and nature walking trails",
    address: "Ban Long, Luang Prabang, Laos",
    coordinates: { lat: 19.7496, lng: 101.9932 },
    rating: 4.8,
    userRatingsTotal: 25000,
    types: ["nature", "tourist_attraction", "viewpoint", "outdoor"],
    openingHours: { openNow: true, weekdayText: ["Daily: 8:00 AM – 5:30 PM"] },
    priceLevel: 1,
    estimatedDurationMin: 180,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
  {
    id: "laos_buddha_park",
    name: "Buddha Park (Wat Xieng Khouane)",
    description: "Extraordinary open-air sculpture park featuring over 200 enormous Buddhist and Hindu concrete statues on the Mekong River",
    address: "Deua, Thanon Tha, Vientiane, Laos",
    coordinates: { lat: 17.9124, lng: 102.7648 },
    rating: 4.4,
    userRatingsTotal: 9500,
    types: ["park", "sculpture", "tourist_attraction", "art"],
    openingHours: { openNow: true, weekdayText: ["Daily: 8:00 AM – 5:00 PM"] },
    priceLevel: 1,
    estimatedDurationMin: 120,
    fetchedAt: new Date().toISOString(),
    provider: "places_fixture",
  },
];

export class PlacesFixtureAdapter implements IPlacesProvider {
  readonly name = "places_fixture";
  private dynamicCache = new Map<string, PlaceCandidate>();

  async searchPlaces(query: PlaceSearchQuery): Promise<PlaceCandidate[]> {
    const qLower = query.query.toLowerCase();
    const destLower = (query.destination ?? "").toLowerCase().trim();

    // 1. If destination is explicitly specified, find places in that destination
    if (destLower) {
      const destMatches = CANNED_PLACES.filter((p) => {
        const addrLower = p.address.toLowerCase();
        const nameLower = p.name.toLowerCase();
        const descLower = (p.description ?? "").toLowerCase();

        if (destLower.includes("china") || destLower.includes("beijing") || destLower.includes("shanghai")) {
          return addrLower.includes("china") || addrLower.includes("beijing") || addrLower.includes("shanghai");
        }
        if (destLower.includes("japan") || destLower.includes("tokyo")) {
          return addrLower.includes("tokyo") || addrLower.includes("japan");
        }
        if (destLower.includes("portugal") || destLower.includes("lisbon") || destLower.includes("lisboa")) {
          return addrLower.includes("lisboa") || addrLower.includes("portugal");
        }
        if (destLower.includes("laos") || destLower.includes("loas") || destLower.includes("vientiane") || destLower.includes("luang prabang")) {
          return addrLower.includes("laos") || addrLower.includes("vientiane") || addrLower.includes("luang prabang");
        }
        return addrLower.includes(destLower) || nameLower.includes(destLower) || descLower.includes(destLower);
      });

      if (destMatches.length > 0) {
        // Rank/filter destination matches by query and requested types
        const relevant = destMatches.filter((p) => {
          const matchName = p.name.toLowerCase().includes(qLower);
          const matchDesc = (p.description ?? "").toLowerCase().includes(qLower);
          const matchTypes = p.types.some((t) => qLower.includes(t) || query.types.includes(t));
          return matchName || matchDesc || matchTypes;
        });

        const selected = relevant.length > 0 ? relevant : destMatches;
        return selected.slice(0, query.limit).map((p) => ({
          ...p,
          fetchedAt: new Date().toISOString(),
        }));
      }

      // If destination is not in CANNED_PLACES, dynamically synthesize realistic places
      // so non-Tokyo destinations never get Tokyo attractions
      const cleanDest = query.destination?.trim() || "City Center";
      const synthesized: PlaceCandidate[] = [
        {
          id: `place_${cleanDest.toLowerCase().replace(/[^a-z0-9]/g, "_")}_historic`,
          name: `${cleanDest} Historic Center & Old Town`,
          description: `Charming historic quarter of ${cleanDest} featuring architectural heritage, cobblestone streets, and landmarks`,
          address: `Historic District, ${cleanDest}`,
          coordinates: { lat: 0, lng: 0 },
          rating: 4.7,
          userRatingsTotal: 25000,
          types: ["tourist_attraction", "historical"],
          openingHours: { openNow: true, weekdayText: ["Daily: 24 hours"] },
          priceLevel: 0,
          estimatedDurationMin: 120,
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: `place_${cleanDest.toLowerCase().replace(/[^a-z0-9]/g, "_")}_museum`,
          name: `${cleanDest} National Cultural Museum`,
          description: `Premier museum in ${cleanDest} celebrating the region's rich artistic, cultural, and historic legacy`,
          address: `1 Museum Way, ${cleanDest}`,
          coordinates: { lat: 0, lng: 0 },
          rating: 4.6,
          userRatingsTotal: 18000,
          types: ["museum", "historical", "art_gallery"],
          openingHours: { openNow: true, weekdayText: ["Tue-Sun: 9:00 AM – 5:00 PM", "Mon: Closed"] },
          priceLevel: 2,
          estimatedDurationMin: 120,
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: `place_${cleanDest.toLowerCase().replace(/[^a-z0-9]/g, "_")}_market`,
          name: `${cleanDest} Grand Market Hall`,
          description: `Vibrant bustling food and artisanal market showcasing local culinary delicacies and authentic crafts`,
          address: `Central Market Plaza, ${cleanDest}`,
          coordinates: { lat: 0, lng: 0 },
          rating: 4.5,
          userRatingsTotal: 22000,
          types: ["food", "market", "tourist_attraction"],
          openingHours: { openNow: true, weekdayText: ["Daily: 8:00 AM – 8:00 PM"] },
          priceLevel: 2,
          estimatedDurationMin: 90,
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: `place_${cleanDest.toLowerCase().replace(/[^a-z0-9]/g, "_")}_park`,
          name: `${cleanDest} Royal Botanical Gardens`,
          description: `Lush urban sanctuary with botanical collections, picturesque walking paths, and peaceful fountains`,
          address: `Garden Promenade, ${cleanDest}`,
          coordinates: { lat: 0, lng: 0 },
          rating: 4.7,
          userRatingsTotal: 15000,
          types: ["nature", "tourist_attraction"],
          openingHours: { openNow: true, weekdayText: ["Daily: 7:00 AM – 7:00 PM"] },
          priceLevel: 1,
          estimatedDurationMin: 90,
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
      ];

      for (const p of synthesized) {
        this.dynamicCache.set(p.id, p);
      }

      return synthesized.slice(0, query.limit);
    }

    // 2. Generic query search across all CANNED_PLACES
    let matches = CANNED_PLACES.filter((p) => {
      const matchName = p.name.toLowerCase().includes(qLower);
      const matchDesc = (p.description ?? "").toLowerCase().includes(qLower);
      const matchTypes = p.types.some((t) => qLower.includes(t) || query.types.includes(t));
      return matchName || matchDesc || matchTypes;
    });

    if (matches.length === 0) {
      matches = CANNED_PLACES.slice(0, query.limit);
    }

    return matches.slice(0, query.limit).map((p) => ({
      ...p,
      fetchedAt: new Date().toISOString(),
    }));
  }

  async getPlaceDetails(placeId: string): Promise<PlaceCandidate | null> {
    const place = CANNED_PLACES.find((p) => p.id === placeId) ?? this.dynamicCache.get(placeId);
    if (!place) return null;
    return {
      ...place,
      fetchedAt: new Date().toISOString(),
    };
  }
}

