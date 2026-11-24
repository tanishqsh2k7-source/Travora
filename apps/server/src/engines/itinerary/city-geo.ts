import type { PlaceCandidate, Place } from "@travora/contracts";

export interface ResolvedCityGeo {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  airportName: string;
}

const KNOWN_CITIES: Record<string, { lat: number; lng: number; country: string; timezone: string; airport: string }> = {
  // India
  jodhpur: { lat: 26.2389, lng: 73.0243, country: "India", timezone: "Asia/Kolkata", airport: "Jodhpur Airport (JDH)" },
  jaipur: { lat: 26.9124, lng: 75.7873, country: "India", timezone: "Asia/Kolkata", airport: "Jaipur International Airport (JAI)" },
  udaipur: { lat: 24.5854, lng: 73.7125, country: "India", timezone: "Asia/Kolkata", airport: "Maharana Pratap Airport (UDR)" },
  jaisalmer: { lat: 26.9157, lng: 70.9083, country: "India", timezone: "Asia/Kolkata", airport: "Jaisalmer Airport (JSA)" },
  delhi: { lat: 28.6139, lng: 77.2090, country: "India", timezone: "Asia/Kolkata", airport: "Indira Gandhi International Airport (DEL)" },
  "new delhi": { lat: 28.6139, lng: 77.2090, country: "India", timezone: "Asia/Kolkata", airport: "Indira Gandhi International Airport (DEL)" },
  mumbai: { lat: 19.0760, lng: 72.8777, country: "India", timezone: "Asia/Kolkata", airport: "Chhatrapati Shivaji Maharaj International Airport (BOM)" },
  bengaluru: { lat: 12.9716, lng: 77.5946, country: "India", timezone: "Asia/Kolkata", airport: "Kempegowda International Airport (BLR)" },
  bangalore: { lat: 12.9716, lng: 77.5946, country: "India", timezone: "Asia/Kolkata", airport: "Kempegowda International Airport (BLR)" },
  goa: { lat: 15.2993, lng: 74.1240, country: "India", timezone: "Asia/Kolkata", airport: "Manohar International Airport (GOX)" },
  agra: { lat: 27.1767, lng: 78.0081, country: "India", timezone: "Asia/Kolkata", airport: "Agra Airport (AGR)" },
  varanasi: { lat: 25.3176, lng: 82.9739, country: "India", timezone: "Asia/Kolkata", airport: "Lal Bahadur Shastri Airport (VNS)" },
  kolkata: { lat: 22.5726, lng: 88.3639, country: "India", timezone: "Asia/Kolkata", airport: "Netaji Subhash Chandra Bose Airport (CCU)" },
  chennai: { lat: 13.0827, lng: 80.2707, country: "India", timezone: "Asia/Kolkata", airport: "Chennai International Airport (MAA)" },
  hyderabad: { lat: 17.3850, lng: 78.4867, country: "India", timezone: "Asia/Kolkata", airport: "Rajiv Gandhi International Airport (HYD)" },
  ahmedabad: { lat: 23.0225, lng: 72.5714, country: "India", timezone: "Asia/Kolkata", airport: "Sardar Vallabhbhai Patel Airport (AMD)" },
  kochi: { lat: 9.9312, lng: 76.2673, country: "India", timezone: "Asia/Kolkata", airport: "Cochin International Airport (COK)" },
  amritsar: { lat: 31.6340, lng: 74.8723, country: "India", timezone: "Asia/Kolkata", airport: "Sri Guru Ram Dass Jee Airport (ATQ)" },
  shimla: { lat: 31.1048, lng: 77.1734, country: "India", timezone: "Asia/Kolkata", airport: "Shimla Airport (SLV)" },
  manali: { lat: 32.2432, lng: 77.1892, country: "India", timezone: "Asia/Kolkata", airport: "Kullu-Manali Airport (KUU)" },
  srinagar: { lat: 34.0837, lng: 74.7973, country: "India", timezone: "Asia/Kolkata", airport: "Sheikh ul-Alam Airport (SXR)" },

  // Japan
  tokyo: { lat: 35.6762, lng: 139.6503, country: "Japan", timezone: "Asia/Tokyo", airport: "Tokyo Haneda Airport (HND)" },
  kyoto: { lat: 35.0116, lng: 135.7681, country: "Japan", timezone: "Asia/Tokyo", airport: "Osaka Kansai International Airport (KIX)" },
  osaka: { lat: 34.6937, lng: 135.5023, country: "Japan", timezone: "Asia/Tokyo", airport: "Kansai International Airport (KIX)" },
  sapporo: { lat: 43.0618, lng: 141.3545, country: "Japan", timezone: "Asia/Tokyo", airport: "New Chitose Airport (CTS)" },
  hiroshima: { lat: 34.3853, lng: 132.4553, country: "Japan", timezone: "Asia/Tokyo", airport: "Hiroshima Airport (HIJ)" },

  // Europe
  paris: { lat: 48.8566, lng: 2.3522, country: "France", timezone: "Europe/Paris", airport: "Paris Charles de Gaulle Airport (CDG)" },
  nice: { lat: 43.7102, lng: 7.2620, country: "France", timezone: "Europe/Paris", airport: "Nice Côte d'Azur Airport (NCE)" },
  london: { lat: 51.5074, lng: -0.1278, country: "United Kingdom", timezone: "Europe/London", airport: "London Heathrow Airport (LHR)" },
  edinburgh: { lat: 55.9533, lng: -3.1883, country: "United Kingdom", timezone: "Europe/London", airport: "Edinburgh Airport (EDI)" },
  lisbon: { lat: 38.7223, lng: -9.1393, country: "Portugal", timezone: "Europe/Lisbon", airport: "Humberto Delgado Airport (LIS)" },
  porto: { lat: 41.1579, lng: -8.6291, country: "Portugal", timezone: "Europe/Lisbon", airport: "Francisco Sá Carneiro Airport (OPO)" },
  rome: { lat: 41.9028, lng: 12.4964, country: "Italy", timezone: "Europe/Rome", airport: "Rome Fiumicino Airport (FCO)" },
  florence: { lat: 43.7696, lng: 11.2558, country: "Italy", timezone: "Europe/Rome", airport: "Florence Airport (FLR)" },
  venice: { lat: 45.4408, lng: 12.3155, country: "Italy", timezone: "Europe/Rome", airport: "Venice Marco Polo Airport (VCE)" },
  milan: { lat: 45.4642, lng: 9.1900, country: "Italy", timezone: "Europe/Rome", airport: "Milan Malpensa Airport (MXP)" },
  barcelona: { lat: 41.3879, lng: 2.1699, country: "Spain", timezone: "Europe/Madrid", airport: "Barcelona-El Prat Airport (BCN)" },
  madrid: { lat: 40.4168, lng: -3.7038, country: "Spain", timezone: "Europe/Madrid", airport: "Madrid-Barajas Airport (MAD)" },
  amsterdam: { lat: 52.3676, lng: 4.9041, country: "Netherlands", timezone: "Europe/Amsterdam", airport: "Amsterdam Airport Schiphol (AMS)" },
  berlin: { lat: 52.5200, lng: 13.4050, country: "Germany", timezone: "Europe/Berlin", airport: "Berlin Brandenburg Airport (BER)" },
  munich: { lat: 48.1351, lng: 11.5820, country: "Germany", timezone: "Europe/Berlin", airport: "Munich Airport (MUC)" },
  vienna: { lat: 48.2082, lng: 16.3738, country: "Austria", timezone: "Europe/Vienna", airport: "Vienna International Airport (VIE)" },
  zurich: { lat: 47.3769, lng: 8.5417, country: "Switzerland", timezone: "Europe/Zurich", airport: "Zurich Airport (ZRH)" },
  prague: { lat: 50.0755, lng: 14.4378, country: "Czech Republic", timezone: "Europe/Prague", airport: "Václav Havel Airport (PRG)" },
  budapest: { lat: 47.4979, lng: 19.0402, country: "Hungary", timezone: "Europe/Budapest", airport: "Budapest Airport (BUD)" },

  // Middle East & Asia
  dubai: { lat: 25.2048, lng: 55.2708, country: "UAE", timezone: "Asia/Dubai", airport: "Dubai International Airport (DXB)" },
  "abu dhabi": { lat: 24.4539, lng: 54.3773, country: "UAE", timezone: "Asia/Dubai", airport: "Zayed International Airport (AUH)" },
  singapore: { lat: 1.3521, lng: 103.8198, country: "Singapore", timezone: "Asia/Singapore", airport: "Singapore Changi Airport (SIN)" },
  bangkok: { lat: 13.7563, lng: 100.5018, country: "Thailand", timezone: "Asia/Bangkok", airport: "Suvarnabhumi Airport (BKK)" },
  phuket: { lat: 7.8804, lng: 98.3923, country: "Thailand", timezone: "Asia/Bangkok", airport: "Phuket Airport (HKT)" },
  bali: { lat: -8.4095, lng: 115.1889, country: "Indonesia", timezone: "Asia/Makassar", airport: "Ngurah Rai International Airport (DPS)" },
  hanoi: { lat: 21.0285, lng: 105.8542, country: "Vietnam", timezone: "Asia/Ho_Chi_Minh", airport: "Noi Bai Airport (HAN)" },
  beijing: { lat: 39.9042, lng: 116.4074, country: "China", timezone: "Asia/Shanghai", airport: "Beijing Capital Airport (PEK)" },
  shanghai: { lat: 31.2304, lng: 121.4737, country: "China", timezone: "Asia/Shanghai", airport: "Shanghai Pudong Airport (PVG)" },
  vientiane: { lat: 17.9757, lng: 102.6331, country: "Laos", timezone: "Asia/Vientiane", airport: "Wattay International Airport (VTE)" },

  // Americas
  "new york": { lat: 40.7128, lng: -74.0060, country: "USA", timezone: "America/New_York", airport: "John F. Kennedy Airport (JFK)" },
  "los angeles": { lat: 34.0522, lng: -118.2437, country: "USA", timezone: "America/Los_Angeles", airport: "Los Angeles Airport (LAX)" },
  "san francisco": { lat: 37.7749, lng: -122.4194, country: "USA", timezone: "America/Los_Angeles", airport: "San Francisco Airport (SFO)" },
};

/**
 * Resolves real coordinates, country, timezone, and airport name for a given city.
 * Prioritizes actual candidate place coordinates if available, then known city map, then sensible fallbacks.
 */
export function resolveCityGeo(
  cityName: string,
  candidatePlaces?: PlaceCandidate[],
  countryHint?: string
): ResolvedCityGeo {
  const cleanCity = cityName.split(",")[0].trim();
  const lowerCity = cleanCity.toLowerCase();

  // 1. Check known cities map
  const known = KNOWN_CITIES[lowerCity];

  // 2. Check if candidate places provide actual coordinates for this city
  if (candidatePlaces && candidatePlaces.length > 0) {
    const validCoords = candidatePlaces
      .map((p) => p.coordinates)
      .filter((c) => c && (c.lat !== 0 || c.lng !== 0));

    if (validCoords.length > 0) {
      const avgLat = validCoords.reduce((sum, c) => sum + c.lat, 0) / validCoords.length;
      const avgLng = validCoords.reduce((sum, c) => sum + c.lng, 0) / validCoords.length;

      return {
        name: `${cleanCity} Central Hub`,
        city: cleanCity,
        country: known?.country || countryHint || "Destination",
        lat: Number(avgLat.toFixed(4)),
        lng: Number(avgLng.toFixed(4)),
        timezone: known?.timezone || "UTC",
        airportName: known?.airport || `${cleanCity} Airport`,
      };
    }
  }

  if (known) {
    return {
      name: `${cleanCity} Center`,
      city: cleanCity,
      country: known.country,
      lat: known.lat,
      lng: known.lng,
      timezone: known.timezone,
      airportName: known.airport,
    };
  }

  // 3. Fallback extraction from countryHint if provided
  let country = countryHint || "Destination Country";
  if (countryHint && countryHint.includes(",")) {
    const parts = countryHint.split(",");
    country = parts[parts.length - 1].trim();
  }

  return {
    name: `${cleanCity} Central`,
    city: cleanCity,
    country,
    lat: 26.2389, // Default sensible center
    lng: 73.0243,
    timezone: "UTC",
    airportName: `${cleanCity} International Airport`,
  };
}
