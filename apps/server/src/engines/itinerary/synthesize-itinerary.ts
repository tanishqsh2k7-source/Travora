import type {
  CreateTripRequest,
  PlaceCandidate,
  FlightOffer,
  HotelOffer,
  WeatherForecast,
  Itinerary,
  Place,
  LegMode,
  DayPlan,
  ItinerarySource,
} from "@travora/contracts";
import { buildJourney, type CityVisit } from "./build-journey.js";
import { planStays, type NightPlanItem } from "./plan-stays.js";
import { scheduleDay, type ActivityCandidate } from "./schedule-day.js";
import { priceItinerary } from "./price-itinerary.js";
import { validateItinerary } from "./validate-itinerary.js";
import { resolveCityGeo } from "./city-geo.js";

function parseCitiesFromDestination(destination: string): string[] {
  // Check for multi-city patterns: "Tokyo and Kyoto", "Tokyo & Kyoto", "Tokyo with Kyoto"
  const clean = destination.replace(/,\s*[A-Za-z\s]+$/, ""); // Remove trailing country e.g. ", Japan"
  if (clean.includes(" and ")) {
    return clean.split(" and ").map((s) => s.trim());
  }
  if (clean.includes(" & ")) {
    return clean.split(" & ").map((s) => s.trim());
  }
  if (clean.toLowerCase().includes(" with ")) {
    const parts = clean.split(/ with /i);
    const middlePart = parts[1].replace(/in the middle/i, "").trim();
    return [parts[0].trim(), middlePart];
  }
  return [destination.split(",")[0].trim()];
}

export function synthesizeItinerary(input: {
  tripId: string;
  request: CreateTripRequest;
  placesResult: PlaceCandidate[];
  flightsResult: FlightOffer[];
  hotelsResult: HotelOffer[];
  weatherResult?: WeatherForecast;
  dataMode?: "demo" | "live";
}): Itinerary {
  const { tripId, request, placesResult, flightsResult, hotelsResult, weatherResult } = input;
  const currency = request.budget.currency.toUpperCase();
  const dataMode = input.dataMode ?? "demo";

  // 1. Calculate calendar dates
  const start = new Date(request.startDate);
  const end = new Date(request.endDate);
  const dates: string[] = [];
  const curr = new Date(start);

  while (curr <= end) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }

  const daysCount = dates.length;
  const nightsCount = Math.max(1, daysCount - 1);
  const nightDates = dates.slice(0, nightsCount);

  // 2. Identify destination cities
  const cityNames = parseCitiesFromDestination(request.destination);
  const isMultiCity = cityNames.length > 1;

  // 3. Assign nights across cities
  const nightPlanItems: NightPlanItem[] = [];
  if (isMultiCity) {
    const nightsPerCity = Math.floor(nightsCount / cityNames.length);
    const remainder = nightsCount % cityNames.length;

    let dateIdx = 0;
    cityNames.forEach((city, cIdx) => {
      const thisCityNights = nightsPerCity + (cIdx === 0 ? remainder : 0);
      for (let n = 0; n < thisCityNights; n++) {
        const date = nightDates[dateIdx++];
        const area = cIdx === 0 ? "Shinjuku" : "Gion / Higashiyama";
        const distFromPrev = n === 0 && cIdx > 0 ? 135 : 0; // 135 min Shinkansen distance

        nightPlanItems.push({
          date,
          city,
          area,
          areaDistanceMinutesFromPrevious: distFromPrev,
        });
      }
    });
  } else {
    // Single city
    const primaryCity = cityNames[0];
    nightDates.forEach((date, idx) => {
      nightPlanItems.push({
        date,
        city: primaryCity,
        area: idx < 3 ? "Central District" : "Old Town Quarter",
        areaDistanceMinutesFromPrevious: 0,
      });
    });
  }

  // 4. Plan Stays deterministically
  const selectedHotel = hotelsResult[0];
  const { stays, transitions } = planStays({
    nights: nightPlanItems,
    currency,
    options: {
      minNightsPerStay: 2,
      maxChangesSingleCity: 2,
      areaDistanceMinutes: 45,
      hotelResolver: (city, area) => {
        const cityPlaces = placesResult.filter((p) =>
          p.address.toLowerCase().includes(city.toLowerCase()) ||
          p.name.toLowerCase().includes(city.toLowerCase())
        );
        const cityGeo = resolveCityGeo(city, cityPlaces.length > 0 ? cityPlaces : placesResult, request.destination);

        const matching = hotelsResult.find((h) =>
          h.name.toLowerCase().includes(city.toLowerCase()) ||
          h.address.toLowerCase().includes(city.toLowerCase())
        ) || selectedHotel;

        const hotelLat = matching?.coordinates && matching.coordinates.lat !== 0
          ? matching.coordinates.lat
          : cityGeo.lat;
        const hotelLng = matching?.coordinates && matching.coordinates.lng !== 0
          ? matching.coordinates.lng
          : cityGeo.lng;

        if (matching) {
          return {
            name: matching.name,
            address: matching.address,
            stars: matching.rating ? Math.round(matching.rating) : 4,
            lat: hotelLat,
            lng: hotelLng,
            nightlyPrice: {
              amount: matching.pricePerNight?.amount ?? 18000,
              currency,
              kind: dataMode === "live" ? "live_offer" : "demo_offer",
              source: "hotel_provider",
              fetchedAt: new Date().toISOString(),
            },
            total: {
              amount: matching.totalPrice?.amount ?? 72000,
              currency,
              kind: dataMode === "live" ? "live_offer" : "demo_offer",
              source: "hotel_provider",
              fetchedAt: new Date().toISOString(),
            },
          };
        }
        return {
          name: `${city} Central Hotel`,
          address: `${area}, ${city}`,
          lat: cityGeo.lat,
          lng: cityGeo.lng,
        };
      },
    },
  });

  // 5. Build Journey legs
  const originCity = request.origin.split(",")[0].trim();
  const originGeo = resolveCityGeo(originCity, undefined, request.origin);
  const originPlace: Place = {
    name: originGeo.airportName,
    city: originCity,
    country: originGeo.country,
    lat: originGeo.lat,
    lng: originGeo.lng,
    timezone: originGeo.timezone,
  };

  const cityVisits: CityVisit[] = cityNames.map((city) => {
    const cityStays = stays.filter((s) => s.city.toLowerCase() === city.toLowerCase());
    const arrDate = cityStays[0]?.checkInDate ?? request.startDate;
    const depDate = cityStays[cityStays.length - 1]?.checkOutDate ?? request.endDate;
    const n = cityStays.reduce((sum, s) => sum + s.nights, 0);

    const cityPlaces = placesResult.filter((p) =>
      p.address.toLowerCase().includes(city.toLowerCase()) ||
      p.name.toLowerCase().includes(city.toLowerCase())
    );
    const cityGeo = resolveCityGeo(
      city,
      cityPlaces.length > 0 ? cityPlaces : placesResult,
      request.destination
    );

    return {
      city,
      country: cityGeo.country,
      place: {
        name: `${city} Central Hub`,
        city,
        country: cityGeo.country,
        lat: cityGeo.lat,
        lng: cityGeo.lng,
        timezone: cityGeo.timezone,
      },
      arrivalDate: arrDate,
      departureDate: depDate,
      nights: n,
    };
  });

  const selectedFlight = flightsResult[0];
  const totalFlightAmount = selectedFlight?.price?.amount ?? 0;
  const isRoundTripFlight = Boolean(selectedFlight?.returnDate);
  const outboundFlightCost = isRoundTripFlight
    ? Math.round(totalFlightAmount * 0.52)
    : totalFlightAmount;
  const returnFlightCost = isRoundTripFlight
    ? totalFlightAmount - outboundFlightCost
    : 0;

  const journey = buildJourney({
    originPlace,
    destinationCities: cityVisits,
    outboundFlight: selectedFlight ? {
      departLocal: `${dates[0]}T08:30:00`,
      arriveLocal: `${dates[0]}T14:45:00`,
      durationMin: selectedFlight.totalDurationMinutes || 480,
      carrier: selectedFlight.carrierName || "Airline Partner",
      number: `${selectedFlight.carrier || "XX"}101`,
      cost: {
        amount: outboundFlightCost,
        currency,
        kind: dataMode === "live" ? "live_offer" : "demo_offer",
        source: "flight_provider",
        fetchedAt: new Date().toISOString(),
      },
    } : undefined,
    returnFlight: selectedFlight && isRoundTripFlight ? {
      departLocal: `${dates[dates.length - 1]}T16:00:00`,
      arriveLocal: `${dates[dates.length - 1]}T22:30:00`,
      durationMin: selectedFlight.totalDurationMinutes || 480,
      carrier: selectedFlight.carrierName || "Airline Partner",
      number: `${selectedFlight.carrier || "XX"}102`,
      cost: {
        amount: returnFlightCost,
        currency,
        kind: dataMode === "live" ? "live_offer" : "demo_offer",
        source: "flight_provider",
        fetchedAt: new Date().toISOString(),
      },
    } : undefined,
  });

  // 6. Schedule Day-by-Day Events
  const days: DayPlan[] = [];
  const placesPerDay = Math.ceil(placesResult.length / daysCount) || 2;

  dates.forEach((date, dIdx) => {
    const dayNumber = dIdx + 1;
    const isArrivalDay = dIdx === 0;
    const isDepartureDay = dIdx === dates.length - 1;

    // Check if moving day
    const matchingTransition = transitions.find((t) => t.date === date);
    const isMovingDay = Boolean(matchingTransition);

    // Identify current active city and stay
    const activeStay = stays.find(
      (s) => date >= s.checkInDate && date < s.checkOutDate
    ) || stays[stays.length - 1];

    const currentCity = activeStay?.city ?? cityNames[0];
    const currentCityGeo = resolveCityGeo(currentCity, placesResult, request.destination);

    // Wake up and sleep stay IDs
    const wakeUpStayId = isArrivalDay ? null : (stays.find((s) => date > s.checkInDate && date <= s.checkOutDate)?.id ?? activeStay.id);
    const sleepStayId = isDepartureDay ? null : activeStay.id;

    // Daily activities
    const dayPlaces = placesResult.slice(dIdx * placesPerDay, (dIdx + 1) * placesPerDay);
    const activities: ActivityCandidate[] = dayPlaces.map((p, pIdx) => {
      // Determine if place is a public/free landmark (streets, parks, viewpoints, neighborhoods)
      const isFreeSite = /street|park|square|district|neighborhood|bridge|viewpoint|walk|avenue|hill|zaka|cross|path|river|quarter|gardens?\s*$/i.test(p.name);

      return {
        id: `act_d${dayNumber}_${pIdx + 1}`,
        name: p.name,
        place: {
          name: p.name,
          city: currentCity,
          country: currentCityGeo.country,
          lat: p.coordinates.lat,
          lng: p.coordinates.lng,
          timezone: currentCityGeo.timezone,
        },
        durationMin: p.estimatedDurationMin || 90,
        cost: isFreeSite
          ? undefined
          : p.priceLevel && p.priceLevel > 0
          ? {
              amount: Math.round(p.priceLevel * 400 * (currency === "INR" ? 85 : 1)),
              currency,
              kind: "estimate",
              source: "travora_engine",
              fetchedAt: new Date().toISOString(),
            }
          : undefined,
        notes: p.description,
      };
    });

    const hotelPlace: Place = {
      name: activeStay.hotel.name,
      city: activeStay.city,
      country: currentCityGeo.country,
      lat: activeStay.hotel.lat,
      lng: activeStay.hotel.lng,
      timezone: currentCityGeo.timezone,
    };

    const nextStay = matchingTransition ? stays.find((s) => s.id === matchingTransition.toStayId) : undefined;
    const nextCityGeo = nextStay ? resolveCityGeo(nextStay.city, placesResult, request.destination) : undefined;
    const nextHotelPlace: Place | undefined = nextStay ? {
      name: nextStay.hotel.name,
      city: nextStay.city,
      country: nextCityGeo?.country ?? currentCityGeo.country,
      lat: nextStay.hotel.lat,
      lng: nextStay.hotel.lng,
      timezone: nextCityGeo?.timezone ?? currentCityGeo.timezone,
    } : undefined;

    const events = scheduleDay(activities, {
      dayNumber,
      date,
      isArrivalDay,
      isDepartureDay,
      isMovingDay,
      flightLandingLocalTime: isArrivalDay ? "14:45" : undefined,
      flightDepartureLocalTime: isDepartureDay ? "16:00" : undefined,
      hotelPlace,
      nextHotelPlace,
      currency,
    });

    const dayWeather = weatherResult?.daily?.find((w) => w.date === date);

    days.push({
      dayNumber,
      date,
      city: currentCity,
      theme: isArrivalDay
        ? "Arrival & Neighborhood Orientation"
        : isDepartureDay
        ? "Final Highlights & Journey Home"
        : isMovingDay
        ? `Scenic Relocation to ${currentCity}`
        : `${currentCity} Cultural Exploration`,
      wakeUpStayId,
      sleepStayId,
      isMovingDay,
      events,
      weather: dayWeather ? {
        summary: dayWeather.description || dayWeather.condition,
        high: dayWeather.tempMaxC,
        low: dayWeather.tempMinC,
        confidence: "forecast",
      } : {
        summary: "Pleasant seasonal conditions with clear skies",
        high: 21,
        low: 14,
        confidence: "seasonal",
      },
      dayCost: {
        amount: 3000,
        currency,
        kind: "estimate",
        source: "travora_engine",
        fetchedAt: new Date().toISOString(),
      },
    });
  });

  // 7. Price the complete itinerary with Decimal exact math
  const priced = priceItinerary({
    targetCurrency: currency,
    userBudget: request.budget,
    stays,
    days,
    journey,
    cities: cityNames,
    title: `Curated Journey across ${cityNames.join(" & ")}`,
  });

  const sources: ItinerarySource[] = [
    { provider: dataMode === "live" ? "duffel_live" : "duffel_fixture", kind: "flights", fetchedAt: new Date().toISOString() },
    { provider: dataMode === "live" ? "booking_live" : "hotels_fixture", kind: "hotels", fetchedAt: new Date().toISOString() },
    { provider: "places_fixture", kind: "places", fetchedAt: new Date().toISOString() },
    { provider: "weather_fixture", kind: "weather", fetchedAt: new Date().toISOString() },
  ];

  const itinerary: Itinerary = {
    id: `itin_${tripId.slice(0, 12)}_${Date.now()}`,
    version: 2,
    generatedAt: new Date().toISOString(),
    dataMode,
    currency,
    travellers: request.travellers,
    startDate: request.startDate,
    endDate: request.endDate,
    nights: nightsCount,
    summary: priced.summary,
    journey,
    stays: priced.stays,
    transitions,
    days: priced.days,
    sources,
  };

  // Run validation
  const issues = validateItinerary(itinerary);
  const blockerIssues = issues.filter((i) => i.severity === "blocker");
  if (blockerIssues.length > 0) {
    itinerary.summary.warnings.push(...blockerIssues.map((b) => `[Blocker] ${b.message}`));
  }
  const warningIssues = issues.filter((i) => i.severity === "warning");
  if (warningIssues.length > 0) {
    itinerary.summary.warnings.push(...warningIssues.map((w) => `[Notice] ${w.message}`));
  }

  return itinerary;
}
