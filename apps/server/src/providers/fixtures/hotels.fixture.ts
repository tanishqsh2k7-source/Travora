import type { IHotelsProvider } from "../base.js";
import type { HotelOffer, HotelSearchQuery } from "@travora/contracts";

export class HotelsFixtureAdapter implements IHotelsProvider {
  readonly name = "hotels_fixture";

  async searchHotels(query: HotelSearchQuery): Promise<HotelOffer[]> {
    const checkIn = new Date(query.checkInDate);
    const checkOut = new Date(query.checkOutDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / msPerDay));

    const isINR = query.currency.toUpperCase() === "INR";
    const multiplier = isINR ? 85 : 1;

    // Rates per night in USD cents or INR paise
    const budgetNightRate = Math.round(65 * multiplier * 100);
    const balancedNightRate = Math.round(145 * multiplier * 100);
    const luxuryNightRate = Math.round(360 * multiplier * 100);

    const hotels: HotelOffer[] = [
      {
        id: "htl_tokyo_gracery",
        name: "Hotel Gracery Shinjuku",
        description: "Modern hotel in the heart of Shinjuku featuring the famous Godzilla Head",
        address: "1-19-1 Kabukicho, Shinjuku City, Tokyo",
        coordinates: { lat: 35.6953, lng: 139.7022 },
        rating: 4.4,
        stars: 4,
        pricePerNight: {
          amount: balancedNightRate,
          currency: query.currency.toUpperCase(),
        },
        totalPrice: {
          amount: balancedNightRate * nights * query.rooms,
          currency: query.currency.toUpperCase(),
        },
        nights,
        amenities: ["Free High-Speed WiFi", "Godzilla Terrace", "Breakfast Buffet", "24/7 Front Desk"],
        cancellationPolicy: "Free cancellation until 48 hours before check-in",
        hotelStyle: "balanced",
        bookingUrl: "https://gracery.com/shinjuku/",
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      },
      {
        id: "htl_tokyo_capsule",
        name: "The Millennials Shibuya",
        description: "High-tech smart pod hotel tailored for modern budget travelers and nomads",
        address: "1-20-13 Jinnan, Shibuya City, Tokyo",
        coordinates: { lat: 35.6622, lng: 139.7001 },
        rating: 4.5,
        stars: 3,
        pricePerNight: {
          amount: budgetNightRate,
          currency: query.currency.toUpperCase(),
        },
        totalPrice: {
          amount: budgetNightRate * nights * query.rooms,
          currency: query.currency.toUpperCase(),
        },
        nights,
        amenities: ["Smart Pods", "Co-working Space", "Free Evening Beer", "Lounge"],
        cancellationPolicy: "Non-refundable after booking",
        hotelStyle: "budget",
        bookingUrl: "https://www.themillennials.jp/",
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      },
      {
        id: "htl_tokyo_hoshinoya",
        name: "HOSHINOYA Tokyo",
        description: "Towering luxury ryokan providing traditional Japanese hospitality in Otemachi",
        address: "1-9-1 Otemachi, Chiyoda City, Tokyo",
        coordinates: { lat: 35.6881, lng: 139.7644 },
        rating: 4.8,
        stars: 5,
        pricePerNight: {
          amount: luxuryNightRate,
          currency: query.currency.toUpperCase(),
        },
        totalPrice: {
          amount: luxuryNightRate * nights * query.rooms,
          currency: query.currency.toUpperCase(),
        },
        nights,
        amenities: ["Natural Hot Spring (Onsen)", "Tea Ceremony Lounge", "Fine Dining", "Spa"],
        cancellationPolicy: "Free cancellation until 7 days before check-in",
        hotelStyle: "luxury",
        bookingUrl: "https://hoshinoya.com/tokyo/en/",
        fetchedAt: new Date().toISOString(),
        provider: this.name,
      },
    ];

    if (query.travelStyle) {
      return hotels.filter((h) => h.hotelStyle === query.travelStyle);
    }

    return hotels;
  }
}
