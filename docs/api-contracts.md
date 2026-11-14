# API Contracts — Itinerary v2

## Example JSON (`Itinerary`)

An example of the complete Itinerary v2 response shape representing a multi-city journey from Delhi to Tokyo (4 nights), Shinkansen train to Kyoto (4 nights), and flight home from Osaka (KIX):

```json
{
  "id": "itin_del_tyo_kyo_9n_demo",
  "version": 2,
  "generatedAt": "2027-04-01T12:00:00.000Z",
  "dataMode": "demo",
  "currency": "INR",
  "travellers": {
    "adults": 2,
    "children": 0,
    "infants": 0
  },
  "startDate": "2027-04-10",
  "endDate": "2027-04-19",
  "nights": 9,
  "summary": {
    "title": "Grand Golden Route: Tokyo & Kyoto Heritage Journey",
    "cities": ["Tokyo", "Kyoto"],
    "estimatedTotal": {
      "amount": 42000000,
      "currency": "INR",
      "kind": "demo_offer",
      "source": "travora_engine",
      "fetchedAt": "2027-04-01T12:00:00.000Z"
    },
    "budget": {
      "amount": 50000000,
      "currency": "INR",
      "kind": "estimate",
      "source": "user_budget",
      "fetchedAt": "2027-04-01T12:00:00.000Z"
    },
    "remaining": {
      "amount": 8000000,
      "currency": "INR",
      "kind": "estimate",
      "source": "travora_engine",
      "fetchedAt": "2027-04-01T12:00:00.000Z"
    },
    "withinBudget": true,
    "warnings": []
  },
  "journey": [
    {
      "id": "leg_outbound",
      "kind": "outbound",
      "mode": "flight",
      "from": {
        "name": "Indira Gandhi International Airport",
        "city": "Delhi",
        "country": "India",
        "lat": 28.5562,
        "lng": 77.1000,
        "timezone": "Asia/Kolkata",
        "code": "DEL"
      },
      "to": {
        "name": "Tokyo Haneda Airport",
        "city": "Tokyo",
        "country": "Japan",
        "lat": 35.5494,
        "lng": 139.7798,
        "timezone": "Asia/Tokyo",
        "code": "HND"
      },
      "departLocal": "2027-04-10T10:15:00",
      "arriveLocal": "2027-04-10T21:45:00",
      "durationMin": 480,
      "carrier": "All Nippon Airways",
      "number": "NH828",
      "cost": {
        "amount": 16000000,
        "currency": "INR",
        "kind": "demo_offer",
        "source": "duffel_fixtures",
        "fetchedAt": "2027-04-01T12:00:00.000Z"
      },
      "note": "Non-stop flight across timezones (IST +3.5h to JST)",
      "source": "duffel_fixtures"
    },
    {
      "id": "leg_intercity_1",
      "kind": "intercity",
      "mode": "train",
      "from": {
        "name": "Tokyo Station",
        "city": "Tokyo",
        "country": "Japan",
        "lat": 35.6812,
        "lng": 139.7671,
        "timezone": "Asia/Tokyo"
      },
      "to": {
        "name": "Kyoto Station",
        "city": "Kyoto",
        "country": "Japan",
        "lat": 34.9858,
        "lng": 135.7588,
        "timezone": "Asia/Tokyo"
      },
      "departLocal": "2027-04-14T11:30:00",
      "arriveLocal": "2027-04-14T13:45:00",
      "durationMin": 135,
      "carrier": "JR Central",
      "number": "Tokaido Shinkansen Nozomi 29",
      "cost": {
        "amount": 1600000,
        "currency": "INR",
        "kind": "estimate",
        "source": "jr_fares",
        "fetchedAt": "2027-04-01T12:00:00.000Z"
      },
      "note": "Reserved seats on bullet train with Mt. Fuji view (right side)",
      "source": "jr_fares"
    },
    {
      "id": "leg_return",
      "kind": "return",
      "mode": "flight",
      "from": {
        "name": "Kansai International Airport",
        "city": "Osaka",
        "country": "Japan",
        "lat": 34.4320,
        "lng": 135.2304,
        "timezone": "Asia/Tokyo",
        "code": "KIX"
      },
      "to": {
        "name": "Indira Gandhi International Airport",
        "city": "Delhi",
        "country": "India",
        "lat": 28.5562,
        "lng": 77.1000,
        "timezone": "Asia/Kolkata",
        "code": "DEL"
      },
      "departLocal": "2027-04-19T14:20:00",
      "arriveLocal": "2027-04-19T19:50:00",
      "durationMin": 540,
      "carrier": "Air India",
      "number": "AI315",
      "cost": {
        "amount": 14000000,
        "currency": "INR",
        "kind": "demo_offer",
        "source": "duffel_fixtures",
        "fetchedAt": "2027-04-01T12:00:00.000Z"
      },
      "note": "Direct return flight from Kansai to Delhi",
      "source": "duffel_fixtures"
    }
  ],
  "stays": [
    {
      "id": "stay_tokyo_shinjuku",
      "city": "Tokyo",
      "area": "Shinjuku",
      "checkInDate": "2027-04-10",
      "checkOutDate": "2027-04-14",
      "nights": 4,
      "hotel": {
        "name": "Hotel Gracery Shinjuku",
        "address": "1-19-1 Kabukicho, Shinjuku-ku, Tokyo",
        "stars": 4,
        "lat": 35.6953,
        "lng": 139.7022,
        "nightlyPrice": {
          "amount": 1800000,
          "currency": "INR",
          "kind": "demo_offer",
          "source": "booking_fixtures",
          "fetchedAt": "2027-04-01T12:00:00.000Z"
        },
        "total": {
          "amount": 7200000,
          "currency": "INR",
          "kind": "demo_offer",
          "source": "booking_fixtures",
          "fetchedAt": "2027-04-01T12:00:00.000Z"
        },
        "cancellation": "Free cancellation until 48 hours prior to arrival"
      },
      "changeReason": {
        "code": "FIRST_STAY",
        "text": "Initial trip base for arriving in Tokyo."
      }
    },
    {
      "id": "stay_kyoto_gion",
      "city": "Kyoto",
      "area": "Gion / Higashiyama",
      "checkInDate": "2027-04-14",
      "checkOutDate": "2027-04-19",
      "nights": 5,
      "hotel": {
        "name": "The Thousand Kyoto",
        "address": "570 Higashishiokojicho, Shimogyo Ward, Kyoto",
        "stars": 5,
        "lat": 34.9868,
        "lng": 135.7606,
        "nightlyPrice": {
          "amount": 2200000,
          "currency": "INR",
          "kind": "demo_offer",
          "source": "booking_fixtures",
          "fetchedAt": "2027-04-01T12:00:00.000Z"
        },
        "total": {
          "amount": 11000000,
          "currency": "INR",
          "kind": "demo_offer",
          "source": "booking_fixtures",
          "fetchedAt": "2027-04-01T12:00:00.000Z"
        },
        "cancellation": "Free cancellation up to 7 days before check-in"
      },
      "changeReason": {
        "code": "NEW_CITY",
        "text": "Moving to Kyoto for cultural heritage, shrines, and traditional dining."
      },
      "previousStayId": "stay_tokyo_shinjuku"
    }
  ],
  "transitions": [
    {
      "date": "2027-04-14",
      "fromStayId": "stay_tokyo_shinjuku",
      "toStayId": "stay_kyoto_gion",
      "checkOutBy": "11:00",
      "legs": [
        {
          "id": "leg_intercity_1",
          "kind": "intercity",
          "mode": "train",
          "from": {
            "name": "Tokyo Station",
            "city": "Tokyo",
            "country": "Japan",
            "lat": 35.6812,
            "lng": 139.7671,
            "timezone": "Asia/Tokyo"
          },
          "to": {
            "name": "Kyoto Station",
            "city": "Kyoto",
            "country": "Japan",
            "lat": 34.9858,
            "lng": 135.7588,
            "timezone": "Asia/Tokyo"
          },
          "departLocal": "2027-04-14T11:30:00",
          "arriveLocal": "2027-04-14T13:45:00",
          "durationMin": 135,
          "carrier": "JR Central",
          "number": "Tokaido Shinkansen Nozomi 29",
          "cost": {
            "amount": 1600000,
            "currency": "INR",
            "kind": "estimate",
            "source": "jr_fares",
            "fetchedAt": "2027-04-01T12:00:00.000Z"
          },
          "note": "Shinkansen transit from Tokyo to Kyoto",
          "source": "jr_fares"
        }
      ],
      "checkInFrom": "15:00",
      "luggageTip": "Leave bags at hotel reception upon arrival prior to check-in.",
      "tip": "Enjoy an afternoon walk through Higashiyama streets before dinner."
    }
  ],
  "days": [
    {
      "dayNumber": 1,
      "date": "2027-04-10",
      "city": "Tokyo",
      "theme": "Arrival & Shinjuku Neon Welcome",
      "wakeUpStayId": null,
      "sleepStayId": "stay_tokyo_shinjuku",
      "isMovingDay": false,
      "events": [
        {
          "id": "ev_1_arr",
          "type": "arrival",
          "startLocal": "21:45",
          "endLocal": "23:00",
          "title": "Arrive at Tokyo Haneda Airport (HND)",
          "notes": "Customs clearance, baggage claim, and exchange Yen/IC card."
        },
        {
          "id": "ev_1_transfer",
          "type": "transfer",
          "startLocal": "23:00",
          "endLocal": "23:45",
          "title": "Tokyo Monorail & Yamanote Line to Shinjuku",
          "notes": "Express transfer to hotel base."
        },
        {
          "id": "ev_1_checkin",
          "type": "checkin",
          "startLocal": "23:45",
          "endLocal": "00:15",
          "title": "Check-in at Hotel Gracery Shinjuku",
          "notes": "Late check-in confirmed; relax after international flight."
        }
      ],
      "weather": {
        "summary": "Clear night, pleasant breeze",
        "high": 20,
        "low": 12,
        "confidence": "forecast"
      },
      "dayCost": {
        "amount": 1800000,
        "currency": "INR",
        "kind": "demo_offer",
        "source": "travora_engine",
        "fetchedAt": "2027-04-01T12:00:00.000Z"
      }
    }
  ],
  "sources": [
    {
      "provider": "duffel_flights",
      "kind": "flights",
      "fetchedAt": "2027-04-01T12:00:00.000Z"
    },
    {
      "provider": "booking_com",
      "kind": "hotels",
      "fetchedAt": "2027-04-01T12:00:00.000Z"
    },
    {
      "provider": "open_weather",
      "kind": "weather",
      "fetchedAt": "2027-04-01T12:00:00.000Z"
    }
  ]
}
```
