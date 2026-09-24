import { getCachedData, setCachedData } from "./index";

const CACHE_CATEGORY = "player";

export async function getPlayerInventoryCache({ force = false }) {
  const cacheKey = "storage";

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

  const response = await fetch("/api/players/me/inventory");

  if (!response.ok) {
    console.error(`Failed to fetch player inventory: ${response.status}`);
    return null;
  }

  const data = await response.json();

  setCachedData(CACHE_CATEGORY, cacheKey, data);

  return data.storage;
}
