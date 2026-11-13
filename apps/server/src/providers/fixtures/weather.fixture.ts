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

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];

      // To facilitate testing disruption/replanning: Day 2 (index 1) has rainy weather!
      const isRainyDay = dayIndex === 1;

      if (isRainyDay) {
        daily.push({
          date: dateStr,
          tempMinC: 13,
          tempMaxC: 17,
          condition: "Rain",
          description: "Moderate rain throughout the afternoon; indoor activities recommended",
          precipitationProb: 85,
          isRainy: true,
          humidityPct: 90,
          windSpeedKmh: 24,
        });
      } else {
        daily.push({
          date: dateStr,
          tempMinC: 14 + (dayIndex % 3),
          tempMaxC: 21 + (dayIndex % 2),
          condition: "Clear",
          description: "Partly cloudy with sunny intervals and pleasant breeze",
          precipitationProb: 15,
          isRainy: false,
          humidityPct: 55,
          windSpeedKmh: 12,
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

