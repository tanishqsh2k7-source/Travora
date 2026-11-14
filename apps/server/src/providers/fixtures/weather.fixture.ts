import type { IWeatherProvider } from "../base.js";
import type { WeatherForecast, WeatherQuery, WeatherDay } from "@travora/contracts";

export class WeatherFixtureAdapter implements IWeatherProvider {
  readonly name = "weather_fixture";

  async getForecast(query: WeatherQuery): Promise<WeatherForecast> {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);
    const daily: WeatherDay[] = [];

    let current = new Date(start);
    let dayIndex = 0;

    // Determine realistic regional base temperatures from coordinates
    const lat = query.coordinates?.lat ?? 35;
    const lng = query.coordinates?.lng ?? 139;

    let baseMin = 14;
    let baseMax = 22;
    let regionDescription = "Pleasant conditions with clear skies";

    // Rajasthan / India (warm subtropical)
    if (lat >= 20 && lat <= 32 && lng >= 68 && lng <= 88) {
      baseMin = 22;
      baseMax = 33;
      regionDescription = "Warm and sunny with light evening breezes";
    }
    // Southeast Asia (tropical)
    else if (lat >= -10 && lat <= 18 && lng >= 95 && lng <= 125) {
      baseMin = 25;
      baseMax = 32;
      regionDescription = "Warm tropical climate with tropical sun";
    }
    // Mediterranean (Lisbon, Barcelona, Rome)
    else if (lat >= 36 && lat <= 44 && lng >= -10 && lng <= 20) {
      baseMin = 16;
      baseMax = 25;
      regionDescription = "Mild Mediterranean warmth with coastal sunshine";
    }
    // Northern / Central Europe (London, Paris, Berlin)
    else if (lat >= 48 && lat <= 60 && lng >= -10 && lng <= 25) {
      baseMin = 9;
      baseMax = 17;
      regionDescription = "Crisp temperate weather with scattered cloud";
    }
    // Japan (Tokyo, Kyoto, Osaka)
    else if (lat >= 33 && lat <= 38 && lng >= 130 && lng <= 142) {
      baseMin = 13;
      baseMax = 21;
      regionDescription = "Pleasant seasonal Japanese weather with crisp air";
    }

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];

      // To facilitate testing disruption/replanning: Day 2 (index 1) has rainy weather!
      const isRainyDay = dayIndex === 1;

      if (isRainyDay) {
        daily.push({
          date: dateStr,
          tempMinC: baseMin - 3,
          tempMaxC: baseMax - 4,
          condition: "Rain",
          description: "Scattered afternoon showers; indoor cultural activities recommended",
          precipitationProb: 80,
          isRainy: true,
          humidityPct: 85,
          windSpeedKmh: 20,
        });
      } else {
        const variance = (dayIndex * 2) % 5 - 2;
        daily.push({
          date: dateStr,
          tempMinC: baseMin + variance,
          tempMaxC: baseMax + variance,
          condition: dayIndex % 2 === 0 ? "Sunny" : "Partly Cloudy",
          description: `${regionDescription} throughout the day`,
          precipitationProb: 10 + (dayIndex * 5) % 20,
          isRainy: false,
          humidityPct: 45 + (dayIndex * 4) % 20,
          windSpeedKmh: 10 + (dayIndex * 3) % 15,
        });
      }

      current.setDate(current.getDate() + 1);
      dayIndex++;
    }

    return {
      coordinates: query.coordinates,
      daily,
      isForecast: true,
      alerts: daily.some((d) => d.isRainy) ? ["Rain advisory: umbrella recommended for Day 2"] : [],
      fetchedAt: new Date().toISOString(),
      provider: this.name,
    };
  }
}

