import { DESTINATIONS } from "../content/destinations.js";
import { useState, useEffect } from "react";

// In-memory cache for fetched destination images
const memoryCache = new Map<string, string>();

/**
 * Extracts clean city name from a destination string like "Barcelona, Spain" -> "Barcelona"
 */
export function extractCityName(destination: string): string {
  if (!destination) return "";
  return destination.split(",")[0].trim();
}

/**
 * Checks if the city matches any pre-curated destination
 */
export function getCuratedDestinationImage(cityName: string): { heroImage: string; cardImage: string } | null {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase();
  const match = DESTINATIONS.find(
    (d) => d.slug.toLowerCase() === normalized || d.name.toLowerCase() === normalized
  );
  if (match) {
    return {
      heroImage: match.heroImage,
      cardImage: match.cardImage,
    };
  }
  return null;
}

/**
 * Dynamically fetches a destination photograph.
 * Priority:
 * 1. Curated local destination assets (fastest, pre-optimized)
 * 2. In-memory / sessionStorage cache
 * 3. Optional Unsplash API (if VITE_UNSPLASH_ACCESS_KEY is configured)
 * 4. Free Wikipedia REST API (global coverage, no key needed, CORS enabled)
 */
export async function fetchDynamicDestinationImage(destination: string): Promise<string | null> {
  const cityName = extractCityName(destination);
  if (!cityName) return null;

  // 1. Check curated showcase first
  const curated = getCuratedDestinationImage(cityName);
  if (curated) {
    return curated.cardImage;
  }

  // 2. Check memory & session cache
  const cacheKey = cityName.toLowerCase();
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) || null;
  }

  try {
    const sessionCached = sessionStorage.getItem(`travora_dest_img_${cacheKey}`);
    if (sessionCached) {
      memoryCache.set(cacheKey, sessionCached);
      return sessionCached;
    }
  } catch {
    // sessionStorage might be restricted
  }

  // 3. Optional Unsplash check
  const unsplashKey = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const uRes = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cityName + " landmark")}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      );
      if (uRes.ok) {
        const uData = await uRes.json();
        const photoUrl = uData.results?.[0]?.urls?.regular;
        if (photoUrl) {
          memoryCache.set(cacheKey, photoUrl);
          try {
            sessionStorage.setItem(`travora_dest_img_${cacheKey}`, photoUrl);
          } catch {}
          return photoUrl;
        }
      }
    } catch {
      // Continue to Wikipedia fallback
    }
  }

  // 4. Wikipedia REST API
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`
    );
    if (res.ok) {
      const data = await res.json();
      const imageUrl = data.originalimage?.source || data.thumbnail?.source;
      if (imageUrl) {
        memoryCache.set(cacheKey, imageUrl);
        try {
          sessionStorage.setItem(`travora_dest_img_${cacheKey}`, imageUrl);
        } catch {}
        return imageUrl;
      }
    }
  } catch (err) {
    console.warn(`Dynamic image lookup for ${cityName}:`, err);
  }

  return null;
}

/**
 * React hook to automatically fetch a destination image for any city
 */
export function useDestinationImage(destination: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    const city = extractCityName(destination);
    const curated = getCuratedDestinationImage(city);
    return curated ? curated.cardImage : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const city = extractCityName(destination);
    if (!city) {
      setImageUrl(null);
      return;
    }

    const curated = getCuratedDestinationImage(city);
    if (curated) {
      setImageUrl(curated.cardImage);
      return;
    }

    // Check memory cache
    const cacheKey = city.toLowerCase();
    if (memoryCache.has(cacheKey)) {
      setImageUrl(memoryCache.get(cacheKey) || null);
      return;
    }

    setIsLoading(true);
    fetchDynamicDestinationImage(destination)
      .then((url) => {
        if (!isCancelled) {
          setImageUrl(url);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [destination]);

  return { imageUrl, isLoading, cityName: extractCityName(destination) };
}
