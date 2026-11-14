import type {
  Coordinates,
  PlaceCandidate,
  PacePreference,
  RouteOptimizerResult,
  OptimizedDaySchedule,
  ScheduledStop,
  HotelOffer,
} from "@travora/contracts";
import { haversineDistanceMeters, estimateDurationSeconds } from "../providers/fixtures/routes.fixture.js";

export interface RouteOptimizerInput {
  places: PlaceCandidate[];
  daysCount: number;
  pace?: PacePreference;
  travelDates: string[];
  dayStartTime?: string; // "09:00"
  dayEndTime?: string; // "18:30"
  hotelCoordinates?: Coordinates;
  hotels?: HotelOffer[];
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.floor(totalMinutes % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}`;
}

/**
 * Cluster places into K groups using simple K-Means on coordinates.
 */
function clusterPlaces(places: PlaceCandidate[], k: number): PlaceCandidate[][] {
  if (places.length === 0) return Array.from({ length: k }, () => []);
  if (k <= 1 || places.length <= k) {
    // Trivial partition
    const clusters: PlaceCandidate[][] = Array.from({ length: k }, () => []);
    places.forEach((p, idx) => {
      clusters[idx % k].push(p);
    });
    return clusters;
  }

  // Initialize centroids evenly spaced
  const centroids: Coordinates[] = [];
  const step = Math.floor(places.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push({ ...places[Math.min(i * step, places.length - 1)].coordinates });
  }

  let assignments = new Array<number>(places.length).fill(0);

  // Run up to 10 iterations of K-Means
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;

    // Assign each place to closest centroid
    for (let pIdx = 0; pIdx < places.length; pIdx++) {
      const place = places[pIdx];
      let bestCluster = 0;
      let minDistance = Infinity;

      for (let cIdx = 0; cIdx < k; cIdx++) {
        const dist = haversineDistanceMeters(place.coordinates, centroids[cIdx]);
        if (dist < minDistance) {
          minDistance = dist;
          bestCluster = cIdx;
        }
      }

      if (assignments[pIdx] !== bestCluster) {
        assignments[pIdx] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    // Recompute centroids
    for (let cIdx = 0; cIdx < k; cIdx++) {
      const clusterMembers = places.filter((_, idx) => assignments[idx] === cIdx);
      if (clusterMembers.length > 0) {
        const avgLat =
          clusterMembers.reduce((sum, p) => sum + p.coordinates.lat, 0) / clusterMembers.length;
        const avgLng =
          clusterMembers.reduce((sum, p) => sum + p.coordinates.lng, 0) / clusterMembers.length;
        centroids[cIdx] = { lat: avgLat, lng: avgLng };
      }
    }
  }

  const clusters: PlaceCandidate[][] = Array.from({ length: k }, () => []);
  places.forEach((p, idx) => {
    clusters[assignments[idx]].push(p);
  });

  return clusters;
}

/**
 * Order places within a cluster using Nearest-Neighbor heuristic starting from hotel.
 */
function orderStopsNearestNeighbor(
  places: PlaceCandidate[],
  startCoord?: Coordinates
): PlaceCandidate[] {
  if (places.length <= 1) return [...places];

  const unvisited = [...places];
  const ordered: PlaceCandidate[] = [];
  let currentPos = startCoord ?? unvisited[0].coordinates;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistanceMeters(currentPos, unvisited[i].coordinates);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const [nextStop] = unvisited.splice(nearestIdx, 1);
    ordered.push(nextStop);
    currentPos = nextStop.coordinates;
  }

  return ordered;
}

export function optimizeRoutes(input: RouteOptimizerInput): RouteOptimizerResult {
  const daysCount = Math.max(1, input.daysCount);
  const dayStartTime = input.dayStartTime ?? "09:00";
  const dayEndTime = input.dayEndTime ?? "18:30";
  const startMinutesLimit = parseTimeToMinutes(dayStartTime);
  const endMinutesLimit = parseTimeToMinutes(dayEndTime);

  // Maximum stops based on pace
  let maxStopsPerDay = 3;
  if (input.pace === "relaxed") maxStopsPerDay = 2;
  else if (input.pace === "fast") maxStopsPerDay = 5;
  else maxStopsPerDay = 4; // moderate default

  // Cluster places across days
  const clusters = clusterPlaces(input.places, daysCount);

  const days: OptimizedDaySchedule[] = [];
  const unplacedPlaces: PlaceCandidate[] = [];
  let grandTotalDistanceMeters = 0;
  let grandTotalTravelTimeMin = 0;

  for (let dayIdx = 0; dayIdx < daysCount; dayIdx++) {
    const date = input.travelDates[dayIdx] ?? new Date().toISOString().split("T")[0];
    const cluster = clusters[dayIdx] ?? [];

    // Determine hotel and accommodation status for this day
    const availableHotels = input.hotels ?? [];
    let dayHotel: HotelOffer | undefined = undefined;
    let hotelStatus: "check_in" | "staying" | "switch_hotel" | "check_out" = "staying";
    let hotelNotes = "";

    if (availableHotels.length > 0) {
      const numHotelsToUse = Math.min(availableHotels.length, Math.max(1, Math.floor(daysCount / 2)));
      const daysPerHotel = Math.ceil(daysCount / numHotelsToUse);
      const hotelIdx = Math.min(numHotelsToUse - 1, Math.floor(dayIdx / daysPerHotel));
      const prevHotelIdx = dayIdx > 0 ? Math.min(numHotelsToUse - 1, Math.floor((dayIdx - 1) / daysPerHotel)) : -1;

      dayHotel = availableHotels[hotelIdx];

      if (dayIdx === 0) {
        hotelStatus = "check_in";
        hotelNotes = `Check-in at ${dayHotel.name} (from 15:00) • City base stay`;
      } else if (dayIdx + 1 === daysCount) {
        hotelStatus = "check_out";
        hotelNotes = `Check-out by 11:00 AM from ${dayHotel.name} • Concierge luggage storage available`;
      } else if (prevHotelIdx !== -1 && prevHotelIdx !== hotelIdx) {
        hotelStatus = "switch_hotel";
        hotelNotes = `Check-out from ${availableHotels[prevHotelIdx].name} & transfer to ${dayHotel.name} • New district / city base`;
      } else {
        hotelStatus = "staying";
        hotelNotes = `Night stay at ${dayHotel.name}`;
      }
    }

    const currentHotelCoord = dayHotel?.coordinates ?? input.hotelCoordinates;

    // Order cluster with nearest neighbor heuristic
    const ordered = orderStopsNearestNeighbor(cluster, currentHotelCoord);

    let currentMinutes = startMinutesLimit;
    let prevCoord = currentHotelCoord;
    let totalDayTravelMin = 0;
    let totalDayActivityMin = 0;
    const stops: ScheduledStop[] = [];

    // 1. Hotel switch morning check-out / luggage transfer
    if (dayHotel && hotelStatus === "switch_hotel") {
      const switchDuration = 45;
      stops.push({
        id: `lodging_switch_d${dayIdx + 1}`,
        placeId: dayHotel.id,
        name: `Hotel Switch: Transfer & Drop Bags at ${dayHotel.name}`,
        coordinates: dayHotel.coordinates,
        startLocal: formatMinutesToTime(currentMinutes),
        endLocal: formatMinutesToTime(currentMinutes + switchDuration),
        durationMin: switchDuration,
        type: "lodging",
        transferFromPrevMin: 0,
        distanceFromPrevMeters: 2000,
        notes: `Check-out from previous accommodation and drop luggage at ${dayHotel.name} (${dayHotel.address}).`,
      });
      currentMinutes += switchDuration;
      totalDayActivityMin += switchDuration;
    } else if (dayHotel && hotelStatus === "check_out" && daysCount > 1) {
      // Final day morning check-out
      const checkoutDuration = 30;
      stops.push({
        id: `lodging_checkout_d${dayIdx + 1}`,
        placeId: dayHotel.id,
        name: `Hotel Check-out: ${dayHotel.name}`,
        coordinates: dayHotel.coordinates,
        startLocal: formatMinutesToTime(currentMinutes),
        endLocal: formatMinutesToTime(currentMinutes + checkoutDuration),
        durationMin: checkoutDuration,
        type: "lodging",
        transferFromPrevMin: 0,
        distanceFromPrevMeters: 0,
        notes: `Check-out by 11:00 AM. Leave luggage at concierge until flight/departure transfer.`,
      });
      currentMinutes += checkoutDuration;
      totalDayActivityMin += checkoutDuration;
    }

    let stopsCount = 0;
    let hadLunch = false;

    for (let stopIdx = 0; stopIdx < ordered.length; stopIdx++) {
      const place = ordered[stopIdx];

      // Check if day stop limit reached
      if (stopsCount >= maxStopsPerDay) {
        unplacedPlaces.push(place);
        continue;
      }

      // Check for lunch window: if current time is between 12:00 and 13:30 and lunch hasn't been added
      if (!hadLunch && currentMinutes >= 720 && currentMinutes <= 810) {
        const lunchStart = formatMinutesToTime(currentMinutes);
        const lunchDuration = 60; // 1 hour meal break
        const lunchEnd = formatMinutesToTime(currentMinutes + lunchDuration);

        stops.push({
          id: `meal_lunch_day_${dayIdx + 1}`,
          placeId: "meal_break",
          name: "Lunch & Midday Rest Break",
          coordinates: prevCoord ?? place.coordinates,
          startLocal: lunchStart,
          endLocal: lunchEnd,
          durationMin: lunchDuration,
          type: "meal",
          transferFromPrevMin: 0,
          distanceFromPrevMeters: 0,
          notes: "Scheduled break for local dining and relaxation",
        });

        currentMinutes += lunchDuration;
        totalDayActivityMin += lunchDuration;
        hadLunch = true;
      }

      // Calculate transfer from previous location
      let transferMin = 15; // default buffer
      let distanceMeters = 0;

      if (prevCoord) {
        distanceMeters = haversineDistanceMeters(prevCoord, place.coordinates);
        const durationSec = estimateDurationSeconds(distanceMeters, "transit");
        transferMin = Math.max(10, Math.round(durationSec / 60));
      }

      const arrivalMinutes = currentMinutes + transferMin;
      const activityDuration = place.estimatedDurationMin ?? 90;
      const departureMinutes = arrivalMinutes + activityDuration;

      // Check if exceeds daily closing limit
      if (departureMinutes > endMinutesLimit) {
        unplacedPlaces.push(place);
        continue;
      }

      stops.push({
        id: `stop_${place.id}_d${dayIdx + 1}`,
        placeId: place.id,
        name: place.name,
        coordinates: place.coordinates,
        startLocal: formatMinutesToTime(arrivalMinutes),
        endLocal: formatMinutesToTime(departureMinutes),
        durationMin: activityDuration,
        type: "activity",
        transferFromPrevMin: transferMin,
        distanceFromPrevMeters: distanceMeters,
        notes: place.description,
      });

      currentMinutes = departureMinutes;
      prevCoord = place.coordinates;
      totalDayTravelMin += transferMin;
      totalDayActivityMin += activityDuration;
      grandTotalDistanceMeters += distanceMeters;
      grandTotalTravelTimeMin += transferMin;
      stopsCount++;
    }

    // Day 1 afternoon/evening hotel check-in
    if (dayHotel && hotelStatus === "check_in") {
      const checkinDuration = 45;
      const checkinStart = Math.max(startMinutesLimit, currentMinutes);
      stops.push({
        id: `lodging_checkin_d${dayIdx + 1}`,
        placeId: dayHotel.id,
        name: `Hotel Check-in & Settle in: ${dayHotel.name}`,
        coordinates: dayHotel.coordinates,
        startLocal: formatMinutesToTime(checkinStart),
        endLocal: formatMinutesToTime(checkinStart + checkinDuration),
        durationMin: checkinDuration,
        type: "lodging",
        transferFromPrevMin: 15,
        distanceFromPrevMeters: 1000,
        notes: `Check-in, receive room keys, and unpack at ${dayHotel.name}. Address: ${dayHotel.address}`,
      });
      totalDayActivityMin += checkinDuration;
    }

    days.push({
      dayNumber: dayIdx + 1,
      date,
      stops,
      totalTravelTimeMin: totalDayTravelMin,
      totalActivityTimeMin: totalDayActivityMin,
      accommodation: dayHotel
        ? {
            hotelId: dayHotel.id,
            name: dayHotel.name,
            address: dayHotel.address,
            rating: dayHotel.rating,
            pricePerNight: dayHotel.pricePerNight,
            status: hotelStatus,
            notes: hotelNotes,
          }
        : undefined,
    });
  }

  return {
    days,
    unplacedPlaces,
    totalDistanceMeters: grandTotalDistanceMeters,
    totalTravelTimeMin: grandTotalTravelTimeMin,
  };
}

