import type { IWeatherProvider } from "../base.js";
import { ProviderError } from "../base.js";
import type { WeatherForecast, WeatherQuery, WeatherDay } from "@travora/contracts";

interface OpenWeatherListItem {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind?: {
    speed: number;
  };
  pop?: number; // Probability of precipitation (0 to 1)
}

interface OpenWeatherForecastResponse {
  cod: string;
  list?: OpenWeatherListItem[];
}

export class OpenWeatherLiveAdapter implements IWeatherProvider {
  readonly name = "openweather";
  private apiKey: string;
  private baseUrl = "https://api.openweathermap.org/data/2.5";

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENWEATHER_API_KEY ?? "";
  }

  async getForecast(query: WeatherQuery): Promise<WeatherForecast> {
    if (!this.apiKey) {
      throw new ProviderError(this.name, "OPENWEATHER_API_KEY is not configured", 401);
    }

    const { lat, lng } = query.coordinates;
    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`;

    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      throw new ProviderError(
        this.name,
        `Weather forecast failed: ${res.status} ${res.statusText}`,
        res.status,
        errText
      );
    }

    const data = (await res.json()) as OpenWeatherForecastResponse;
    const items = data.list ?? [];

    // Group 3-hour items by date (YYYY-MM-DD)
    const byDate = new Map<string, OpenWeatherListItem[]>();
    for (const item of items) {
      const date = item.dt_txt.split(" ")[0];
      const arr = byDate.get(date) ?? [];
      arr.push(item);
      byDate.set(date, arr);
    }

    const daily: WeatherDay[] = [];
    for (const [date, dayItems] of byDate.entries()) {
      let minTemp = Infinity;
      let maxTemp = -Infinity;
      let maxPop = 0;
      let dominantCondition = "Clear";
      let dominantDesc = "Clear sky";
      let avgHumidity = 0;
      let maxWind = 0;

      for (const item of dayItems) {
        if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
        if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
        const pop = (item.pop ?? 0) * 100;
        if (pop > maxPop) maxPop = pop;
        if (item.weather[0]) {
          dominantCondition = item.weather[0].main;
          dominantDesc = item.weather[0].description;
        }
        avgHumidity += item.main.humidity;
        if (item.wind?.speed && item.wind.speed * 3.6 > maxWind) {
          maxWind = item.wind.speed * 3.6; // m/s to km/h
        }
      }

      avgHumidity = Math.round(avgHumidity / dayItems.length);
      const isRainy = dominantCondition.toLowerCase().includes("rain") || maxPop >= 50;

      daily.push({
        date,
        tempMinC: Math.round(minTemp),
        tempMaxC: Math.round(maxTemp),
        condition: dominantCondition,
        description: dominantDesc,
        precipitationProb: Math.round(maxPop),
        isRainy,
        humidityPct: avgHumidity,
        windSpeedKmh: Math.round(maxWind),
      });
    }

    return {
      coordinates: query.coordinates,
      daily,
      isForecast: true,
      alerts: daily.some((d) => d.isRainy) ? ["Precipitation expected on some trip dates"] : [],
      fetchedAt: new Date().toISOString(),
      provider: this.name,
    };
  }
}
