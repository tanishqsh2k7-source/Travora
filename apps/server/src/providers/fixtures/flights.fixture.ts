import type { IFlightsProvider } from "../base.js";
import type { FlightOffer, FlightSearchQuery } from "@travora/contracts";

export class FlightsFixtureAdapter implements IFlightsProvider {
  readonly name = "flights_fixture";

  async searchFlights(query: FlightSearchQuery): Promise<FlightOffer[]> {
    const isINR = query.currency.toUpperCase() === "INR";
    const baseMultiplier = isINR ? 85 : 1; // 1 USD ~ 85 INR

    // Price in smallest unit (cents/paise)
    const directPrice = Math.round(750 * baseMultiplier * 100);
    const oneStopPrice = Math.round(520 * baseMultiplier * 100);

    const offers: FlightOffer[] = [
      {
        id: `flt_${query.origin}_${query.destination}_direct`,
        carrier: "AI",
        carrierName: "Air India",
        origin: query.origin,
        destination: query.destination,
        departureDate: query.departureDate,
        returnDate: query.returnDate,
        segments: [
          {
            departureAirport: query.origin.slice(0, 3).toUpperCase(),
            arrivalAirport: query.destination.slice(0, 3).toUpperCase(),
            departureTime: `${query.departureDate}T23:15:00Z`,
            arrivalTime: `${query.departureDate}T11:20:00Z`,
            carrier: "AI",
            carrierName: "Air India",
            flightNumber: "AI306",
            durationMinutes: 455,
          },
        ],
        totalDurationMinutes: 455,
        stops: 0,
        price: {
          amount: directPrice * query.adults,
          currency: query.currency.toUpperCase(),
        },
        baggageIncluded: true,
        bookingUrl: "https://www.airindia.com",
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      },
      {
        id: `flt_${query.origin}_${query.destination}_1stop`,
        carrier: "MH",
        carrierName: "Malaysia Airlines",
        origin: query.origin,
        destination: query.destination,
        departureDate: query.departureDate,
        returnDate: query.returnDate,
        segments: [
          {
            departureAirport: query.origin.slice(0, 3).toUpperCase(),
            arrivalAirport: "KUL",
            departureTime: `${query.departureDate}T13:00:00Z`,
            arrivalTime: `${query.departureDate}T21:00:00Z`,
            carrier: "MH",
            carrierName: "Malaysia Airlines",
            flightNumber: "MH191",
            durationMinutes: 330,
          },
          {
            departureAirport: "KUL",
            arrivalAirport: query.destination.slice(0, 3).toUpperCase(),
            departureTime: `${query.departureDate}T23:30:00Z`,
            arrivalTime: `${query.departureDate}T07:15:00Z`,
            carrier: "MH",
            carrierName: "Malaysia Airlines",
            flightNumber: "MH70",
            durationMinutes: 405,
          },
        ],
        totalDurationMinutes: 885,
        stops: 1,
        price: {
          amount: oneStopPrice * query.adults,
          currency: query.currency.toUpperCase(),
        },
        baggageIncluded: true,
        bookingUrl: "https://www.malaysiaairlines.com",
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      },
    ];

    return offers;
  }
}

