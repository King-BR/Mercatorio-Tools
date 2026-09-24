import { getCachedData, setCachedData } from "./index";

const CACHE_CATEGORY = "marketdata";

export async function getMarketCache({ force = false }) {
  const cacheKey = "all";

  /*
   * Check cache.
   *
   * force=true skips both memory and localStorage cache.
   */
  if (!force) {
    const cached = getCachedData(CACHE_CATEGORY, cacheKey);

    if (cached !== null) {
      return cached;
    }
  }

  const response = await fetch("/api/markets/all");

  if (!response.ok) {
    console.error(`Failed to fetch market data: ${response.status}`);
    return null;
  }

  const data = await response.json();

  setCachedData(CACHE_CATEGORY, cacheKey, data);

  return data;
}
