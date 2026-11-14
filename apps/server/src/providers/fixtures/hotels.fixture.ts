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

    const destLower = (query.destination ?? "").toLowerCase().trim();

    let hotels: HotelOffer[] = [];

    if (
      destLower.includes("china") ||
      destLower.includes("beijing") ||
      destLower.includes("shanghai") ||
      destLower.includes("guangzhou") ||
      destLower.includes("shenzhen") ||
      destLower.includes("chengdu") ||
      destLower.includes("xi'an") ||
      destLower.includes("xian")
    ) {
      hotels = [
        {
          id: "htl_china_grand_wall",
          name: "The Great Wall Hotel Beijing",
          description: "Centrally located luxury hotel near Wangfujing and Chaoyang with landscaped gardens and premier dining",
          address: "6 Dongsanhuan North Road, Chaoyang District, Beijing, China",
          coordinates: { lat: 39.9442, lng: 116.4633 },
          rating: 4.5,
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
          amenities: ["Free High-Speed WiFi", "Indoor Heated Pool", "Fitness Center", "Chinese Tea Lounge", "24/7 Concierge"],
          cancellationPolicy: "Free cancellation until 48 hours before check-in",
          hotelStyle: "balanced",
          bookingUrl: "https://www.thegreatwallhotelbeijing.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_china_courtyard",
          name: "Happy Dragon Courtyard Hotel",
          description: "Traditional Siheyuan courtyard boutique stay nestled in a tranquil Beijing hutong near Dongsi",
          address: "78 Dongsi 2nd Alley, Dongcheng District, Beijing, China",
          coordinates: { lat: 39.9281, lng: 116.4252 },
          rating: 4.6,
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
          amenities: ["Courtyard Rooftop Lounge", "Free WiFi", "Bicycle Rentals", "Tea Ceremony Corner"],
          cancellationPolicy: "Non-refundable after booking",
          hotelStyle: "budget",
          bookingUrl: "https://www.happydragonhotel.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_china_peninsula",
          name: "The Peninsula Beijing",
          description: "Legendary all-suite luxury hotel in the heart of Beijing combining timeless Chinese artistry with peerless hospitality",
          address: "8 Goldfish Lane, Wangfujing, Dongcheng District, Beijing, China",
          coordinates: { lat: 39.9163, lng: 116.4158 },
          rating: 4.9,
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
          amenities: ["Michelin-Starred Cantonese Dining", "The Peninsula Spa", "Indoor Heated Pool", "Rolls-Royce Chauffeur"],
          cancellationPolicy: "Free cancellation until 7 days before check-in",
          hotelStyle: "luxury",
          bookingUrl: "https://www.peninsula.com/beijing",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
      ];
    } else if (destLower.includes("lisbon") || destLower.includes("portugal")) {
      hotels = [
        {
          id: "htl_lisbon_corinthia",
          name: "Corinthia Lisbon",
          description: "Elegant 5-star hotel near Gulbenkian Museum with luxury spa and panoramic Lisbon skyline views",
          address: "Av. Columbano Bordalo Pinheiro 105, 1099-031 Lisbon, Portugal",
          coordinates: { lat: 38.7368, lng: -9.1681 },
          rating: 4.7,
          stars: 5,
          pricePerNight: {
            amount: balancedNightRate,
            currency: query.currency.toUpperCase(),
          },
          totalPrice: {
            amount: balancedNightRate * nights * query.rooms,
            currency: query.currency.toUpperCase(),
          },
          nights,
          amenities: ["Luxury Day Spa", "Indoor Heated Pool", "Garden Terrace", "Buffet Breakfast"],
          cancellationPolicy: "Free cancellation until 48 hours before check-in",
          hotelStyle: "balanced",
          bookingUrl: "https://www.corinthia.com/lisbon",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_lisbon_destination",
          name: "Lisbon Destination Hostel",
          description: "Vibrant historic boutique hostel inside Rossio Railway Station under a majestic ornate glass ceiling",
          address: "Rossio Railway Station 2nd Floor, 1200-092 Lisbon, Portugal",
          coordinates: { lat: 38.7144, lng: -9.1408 },
          rating: 4.6,
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
          amenities: ["Indoor Winter Garden", "Free High-Speed WiFi", "Kitchen Access", "Social Activities"],
          cancellationPolicy: "Non-refundable after booking",
          hotelStyle: "budget",
          bookingUrl: "https://www.destinationhostels.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_lisbon_ritz",
          name: "Four Seasons Hotel Ritz Lisbon",
          description: "Grand heritage palace overlooking Eduardo VII Park with rooftop running track and museum-grade art",
          address: "R. Rodrigo da Fonseca 88, 1099-039 Lisbon, Portugal",
          coordinates: { lat: 38.7259, lng: -9.1557 },
          rating: 4.9,
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
          amenities: ["Rooftop Track", "Michelin-Starred Dining", "Ritz Spa", "Terrace Bar"],
          cancellationPolicy: "Free cancellation until 7 days before check-in",
          hotelStyle: "luxury",
          bookingUrl: "https://www.fourseasons.com/lisbon",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
      ];
    } else if (destLower.includes("paris") || destLower.includes("france")) {
      hotels = [
        {
          id: "htl_paris_pullman",
          name: "Pullman Paris Tour Eiffel",
          description: "Contemporary 4-star hotel located at the foot of the Eiffel Tower with bright balcony rooms",
          address: "18 Avenue De Suffren, 75015 Paris, France",
          coordinates: { lat: 48.8556, lng: 2.2934 },
          rating: 4.5,
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
          amenities: ["Eiffel Tower Views", "Fitness Lounge", "Wine Bar", "High-Speed WiFi"],
          cancellationPolicy: "Free cancellation until 48 hours before check-in",
          hotelStyle: "balanced",
          bookingUrl: "https://all.accor.com/hotel/7229/index.en.shtml",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_paris_generator",
          name: "Generator Paris",
          description: "Trendy designer hostel near Canal Saint-Martin featuring a chic rooftop terrace with Montmartre views",
          address: "9-11 Place du Colonel Fabien, 75010 Paris, France",
          coordinates: { lat: 48.8785, lng: 2.3705 },
          rating: 4.4,
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
          amenities: ["Rooftop Bar", "Underground Club", "Free WiFi", "Café Lounge"],
          cancellationPolicy: "Non-refundable after booking",
          hotelStyle: "budget",
          bookingUrl: "https://staygenerator.com/hostels/paris",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_paris_ritz",
          name: "The Ritz Paris",
          description: "Iconic legendary palace on Place Vendôme renowned for quintessential Parisian haute couture luxury",
          address: "15 Place Vendôme, 75001 Paris, France",
          coordinates: { lat: 48.8682, lng: 2.3294 },
          rating: 4.9,
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
          amenities: ["Bar Hemingway", "Ritz Club & Spa", "Private Gardens", "Gourmet Gastronomy"],
          cancellationPolicy: "Free cancellation until 7 days before check-in",
          hotelStyle: "luxury",
          bookingUrl: "https://www.ritzparis.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
      ];
    } else if (destLower.includes("london") || destLower.includes("uk") || destLower.includes("england")) {
      hotels = [
        {
          id: "htl_london_hoxton",
          name: "The Hoxton Shoreditch",
          description: "Hip East London boutique hotel featuring mid-century design and bustling restaurant scene",
          address: "81 Great Eastern St, London EC2A 3HU, UK",
          coordinates: { lat: 51.5262, lng: -0.0827 },
          rating: 4.5,
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
          amenities: ["Free High-Speed WiFi", "Lobby Coffee Bar", "Neighborhood Guides", "Fireplace Lounge"],
          cancellationPolicy: "Free cancellation until 48 hours before check-in",
          hotelStyle: "balanced",
          bookingUrl: "https://thehoxton.com/london/shoreditch/",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_london_generator",
          name: "Generator London",
          description: "Fun, vibrant hostel in Bloomsbury close to Covent Garden and King's Cross St Pancras",
          address: "37 Tavistock Pl, London WC1H 9SE, UK",
          coordinates: { lat: 51.5273, lng: -0.1251 },
          rating: 4.3,
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
          amenities: ["Cinema Room", "On-site Bar", "Free WiFi", "24/7 Reception"],
          cancellationPolicy: "Non-refundable after booking",
          hotelStyle: "budget",
          bookingUrl: "https://staygenerator.com/hostels/london",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_london_savoy",
          name: "The Savoy",
          description: "World-famous luxury landmark hotel on the River Thames with timeless Edwardian and Art Deco glamor",
          address: "Strand, London WC2R 0EZ, UK",
          coordinates: { lat: 51.5101, lng: -0.1205 },
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
          amenities: ["American Bar", "Savoy Grill", "Beauty & Spa", "Butler Service"],
          cancellationPolicy: "Free cancellation until 7 days before check-in",
          hotelStyle: "luxury",
          bookingUrl: "https://www.thesavoylondon.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
      ];
    } else if (destLower.includes("tokyo") || destLower.includes("japan")) {
      hotels = [
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
    } else if (
      destLower.includes("laos") ||
      destLower.includes("loas") ||
      destLower.includes("vientiane") ||
      destLower.includes("luang prabang")
    ) {
      hotels = [
        {
          id: "htl_laos_crowne_plaza",
          name: "Crowne Plaza Vientiane (IHG)",
          description: "Upscale 5-star hotel in central Vientiane featuring infinity pool, spa, and international dining",
          address: "20 Samsenthai Road, Nongduang Nua Village, Vientiane, Laos",
          coordinates: { lat: 17.9691, lng: 102.5997 },
          rating: 4.7,
          stars: 5,
          pricePerNight: {
            amount: balancedNightRate,
            currency: query.currency.toUpperCase(),
          },
          totalPrice: {
            amount: balancedNightRate * nights * query.rooms,
            currency: query.currency.toUpperCase(),
          },
          nights,
          amenities: ["Outdoor Infinity Pool", "Senses Spa", "24/7 Fitness Center", "Free High-Speed WiFi"],
          cancellationPolicy: "Free cancellation until 24 hours before check-in",
          hotelStyle: "balanced",
          bookingUrl: "https://www.ihg.com/crowneplaza/hotels/us/en/vientiane/vtecp/hoteldetail",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_laos_settha_palace",
          name: "Settha Palace Hotel",
          description: "Colonial-era luxury boutique hotel set in lush gardens in the heart of Vientiane",
          address: "6 Pang Kham Street, Vientiane 01000, Laos",
          coordinates: { lat: 17.9675, lng: 102.6074 },
          rating: 4.6,
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
          amenities: ["Historic French Colonial Architecture", "Garden Pool", "La Belle Epoque Restaurant", "Free WiFi"],
          cancellationPolicy: "Free cancellation until 48 hours before check-in",
          hotelStyle: "luxury",
          bookingUrl: "https://www.setthapalace.com/",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: "htl_laos_green_park",
          name: "Green Park Boutique Hotel & Spa",
          description: "Peaceful contemporary Lao architecture resort close to Morning Market and Mekong River",
          address: "248 Khouvieng Road, Nongchanch, Vientiane, Laos",
          coordinates: { lat: 17.9578, lng: 102.6179 },
          rating: 4.5,
          stars: 4,
          pricePerNight: {
            amount: budgetNightRate,
            currency: query.currency.toUpperCase(),
          },
          totalPrice: {
            amount: budgetNightRate * nights * query.rooms,
            currency: query.currency.toUpperCase(),
          },
          nights,
          amenities: ["Champa Spa", "Plunge Pool", "Free Bicycles", "Free Airport Transfer"],
          cancellationPolicy: "Free cancellation until 48 hours before check-in",
          hotelStyle: "budget",
          bookingUrl: "https://www.greenparkvientiane.com/",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
      ];
    } else {
      // Dynamic fallback for any other destination - never return Tokyo for an unrelated city
      const cleanDest = query.destination.trim() || "City Center";
      hotels = [
        {
          id: `htl_${cleanDest.toLowerCase().replace(/[^a-z0-9]/g, "_")}_balanced`,
          name: `The Heritage Hotel ${cleanDest}`,
          description: `Comfortable and centrally situated hotel in ${cleanDest} with modern traveler amenities`,
          address: `Central Promenade, ${cleanDest}`,
          coordinates: query.coordinates ?? { lat: 0, lng: 0 },
          rating: 4.5,
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
          amenities: ["Free High-Speed WiFi", "Fitness Center", "Breakfast Buffet", "24/7 Front Desk"],
          cancellationPolicy: "Free cancellation until 48 hours before check-in",
          hotelStyle: "balanced",
          bookingUrl: "https://www.booking.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: `htl_${cleanDest.toLowerCase().replace(/[^a-z0-9]/g, "_")}_budget`,
          name: `${cleanDest} Urban Pods & Hostel`,
          description: `Vibrant and affordable modern stay in ${cleanDest} close to main transit links`,
          address: `45 Station Quarter, ${cleanDest}`,
          coordinates: query.coordinates ?? { lat: 0, lng: 0 },
          rating: 4.4,
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
          amenities: ["Free WiFi", "Co-working Space", "Social Lounge", "Lockers"],
          cancellationPolicy: "Non-refundable after booking",
          hotelStyle: "budget",
          bookingUrl: "https://www.hostelworld.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
        {
          id: `htl_${cleanDest.toLowerCase().replace(/[^a-z0-9]/g, "_")}_luxury`,
          name: `The Royal Palace Hotel ${cleanDest}`,
          description: `5-star premier luxury hotel offering signature suites, spa sanctuaries, and fine dining in ${cleanDest}`,
          address: `1 Promenade Avenue, ${cleanDest}`,
          coordinates: query.coordinates ?? { lat: 0, lng: 0 },
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
          amenities: ["Signature Spa", "Michelin-Caliber Dining", "Infinity Pool", "Butler Service"],
          cancellationPolicy: "Free cancellation until 7 days before check-in",
          hotelStyle: "luxury",
          bookingUrl: "https://www.fourseasons.com",
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        },
      ];
    }

    if (query.travelStyle) {
      return hotels.filter((h) => h.hotelStyle === query.travelStyle);
    }

    return hotels;
  }
}


