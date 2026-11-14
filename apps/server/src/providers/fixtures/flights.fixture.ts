import type { IFlightsProvider } from "../base.js";
import type { FlightOffer, FlightSearchQuery } from "@travora/contracts";

function resolveRouteInfo(origin: string, destination: string) {
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();

  // Route: Tokyo -> Laos
  if ((o.includes("tokyo") || o.includes("japan") || o.includes("shinjuku")) && (d.includes("laos") || d.includes("loas") || d.includes("vientiane"))) {
    return {
      originIata: "HND",
      destIata: "VTE",
      directCarrier: "VN",
      directCarrierName: "Vietnam Airlines",
      directFlightNo: "VN385",
      directUrl: "https://www.vietnamairlines.com",
      altCarrier: "QV",
      altCarrierName: "Lao Airlines",
      altFlightNo: "QV312",
      altUrl: "https://www.laoairlines.com",
      duration: 380,
    };
  }
  // Route: UK/London -> China
  if ((o.includes("london") || o.includes("uk")) && (d.includes("china") || d.includes("beijing") || d.includes("shanghai"))) {
    return {
      originIata: "LHR",
      destIata: d.includes("shanghai") ? "PVG" : "PEK",
      directCarrier: "BA",
      directCarrierName: "British Airways",
      directFlightNo: "BA169",
      directUrl: "https://www.britishairways.com",
      altCarrier: "CA",
      altCarrierName: "Air China",
      altFlightNo: "CA938",
      altUrl: "https://www.airchina.com",
      duration: 590,
    };
  }
  // Route: UK/London -> Tokyo
  if ((o.includes("london") || o.includes("uk")) && (d.includes("tokyo") || d.includes("japan"))) {
    return {
      originIata: "LHR",
      destIata: "HND",
      directCarrier: "BA",
      directCarrierName: "British Airways",
      directFlightNo: "BA007",
      directUrl: "https://www.britishairways.com",
      altCarrier: "JL",
      altCarrierName: "Japan Airlines",
      altFlightNo: "JL044",
      altUrl: "https://www.jal.co.jp",
      duration: 840,
    };
  }
  // Route: US -> Europe/Paris
  if ((o.includes("new york") || o.includes("usa") || o.includes("jfk")) && (d.includes("paris") || d.includes("france"))) {
    return {
      originIata: "JFK",
      destIata: "CDG",
      directCarrier: "AF",
      directCarrierName: "Air France",
      directFlightNo: "AF009",
      directUrl: "https://www.airfrance.com",
      altCarrier: "DL",
      altCarrierName: "Delta Air Lines",
      altFlightNo: "DL262",
      altUrl: "https://www.delta.com",
      duration: 440,
    };
  }
  // Route: India
  if (o.includes("delhi") || o.includes("mumbai") || o.includes("india") || d.includes("delhi") || d.includes("india")) {
    return {
      originIata: o.slice(0, 3).toUpperCase(),
      destIata: d.slice(0, 3).toUpperCase(),
      directCarrier: "AI",
      directCarrierName: "Air India",
      directFlightNo: "AI306",
      directUrl: "https://www.airindia.com",
      altCarrier: "6E",
      altCarrierName: "IndiGo",
      altFlightNo: "6E145",
      altUrl: "https://www.goindigo.in",
      duration: 455,
    };
  }

  // General international route
  return {
    originIata: o.slice(0, 3).toUpperCase(),
    destIata: d.slice(0, 3).toUpperCase(),
    directCarrier: "SQ",
    directCarrierName: "Singapore Airlines",
    directFlightNo: "SQ321",
    directUrl: "https://www.singaporeair.com",
    altCarrier: "EK",
    altCarrierName: "Emirates",
    altFlightNo: "EK404",
    altUrl: "https://www.emirates.com",
    duration: 480,
  };
}

export class FlightsFixtureAdapter implements IFlightsProvider {
  readonly name = "flights_fixture";

  async searchFlights(query: FlightSearchQuery): Promise<FlightOffer[]> {
    const isINR = query.currency.toUpperCase() === "INR";
    const baseMultiplier = isINR ? 85 : 1; // 1 USD ~ 85 INR

    // Price in smallest unit (cents/paise)
    const directPrice = Math.round(750 * baseMultiplier * 100);
    const oneStopPrice = Math.round(520 * baseMultiplier * 100);
    const route = resolveRouteInfo(query.origin, query.destination);

    const offers: FlightOffer[] = [
      {
        id: `flt_${query.origin}_${query.destination}_direct`,
        carrier: route.directCarrier,
        carrierName: route.directCarrierName,
        origin: query.origin,
        destination: query.destination,
        departureDate: query.departureDate,
        returnDate: query.returnDate,
        segments: [
          {
            departureAirport: route.originIata,
            arrivalAirport: route.destIata,
            departureTime: `${query.departureDate}T23:15:00Z`,
            arrivalTime: `${query.departureDate}T11:20:00Z`,
            carrier: route.directCarrier,
            carrierName: route.directCarrierName,
            flightNumber: route.directFlightNo,
            durationMinutes: route.duration,
          },
        ],
        totalDurationMinutes: route.duration,
        stops: 0,
        price: {
          amount: directPrice * query.adults,
          currency: query.currency.toUpperCase(),
        },
        baggageIncluded: true,
        bookingUrl: route.directUrl,
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      },
      {
        id: `flt_${query.origin}_${query.destination}_1stop`,
        carrier: route.altCarrier,
        carrierName: route.altCarrierName,
        origin: query.origin,
        destination: query.destination,
        departureDate: query.departureDate,
        returnDate: query.returnDate,
        segments: [
          {
            departureAirport: route.originIata,
            arrivalAirport: "KUL",
            departureTime: `${query.departureDate}T13:00:00Z`,
            arrivalTime: `${query.departureDate}T21:00:00Z`,
            carrier: route.altCarrier,
            carrierName: route.altCarrierName,
            flightNumber: route.altFlightNo,
            durationMinutes: 300,
          },
          {
            departureAirport: "KUL",
            arrivalAirport: route.destIata,
            departureTime: `${query.departureDate}T23:30:00Z`,
            arrivalTime: `${query.departureDate}T06:45:00Z`,
            carrier: route.altCarrier,
            carrierName: route.altCarrierName,
            flightNumber: `${route.altCarrier}882`,
            durationMinutes: 255,
          },
        ],
        totalDurationMinutes: route.duration + 120,
        stops: 1,
        price: {
          amount: oneStopPrice * query.adults,
          currency: query.currency.toUpperCase(),
        },
        baggageIncluded: true,
        bookingUrl: route.altUrl,
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      },
    ];

    return offers;
  }
}
