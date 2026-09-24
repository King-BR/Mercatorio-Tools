import { getCachedData, setCachedData } from "./index";

const CACHE_CATEGORY = "player_building_details";

function getCacheKey({ id = null, all = false }) {
  if (all) {
    return "all";
  }

  if (id !== null && id !== undefined) {
    return `id:${id}`;
  }

  return null;
}

/**
 * Cache all buildings individually.
 *
 * This means that after fetching:
 *
 *   /api/players/me/buildings/all
 *
 * requests for:
 *
 *   /api/players/me/buildings/id/1
 *   /api/players/me/buildings/id/2
 *   /api/players/me/buildings/id/3
 *
 * can all be served from the browser cache.
 */
function cacheBuildingsIndividually(buildings) {
  if (!Array.isArray(buildings)) {
    return;
  }

  console.log("Updating individual buildings cache");

  for (const building of buildings) {
    if (!building) {
      continue;
    }

    setCachedData(CACHE_CATEGORY, `id:${building.id}`, building);
  }
}

export async function getPlayerBuildingsCache({
  id = null,
  all = false,
  force = false,
}) {
  if (!all && (id === null || id === undefined)) {
    throw new Error("Either id or all must be provided");
  }

  const cacheKey = getCacheKey({ id, all });

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

  /*
   * Fetch all buildings.
   */
  if (all) {
    const response = await fetch("/api/players/me/buildings/all");

    if (!response.ok) {
      throw new Error(`Failed to fetch buildings: ${response.status}`);
    }

    const data = await response.json();

    /*
     * Cache the complete list.
     */
    setCachedData(CACHE_CATEGORY, `all`, data);

    /*
     * Also cache every building individually.
     *
     * This is what allows BuildingSelector to switch
     * between buildings without making another request.
     */
    cacheBuildingsIndividually(data);

    return data;
  }

  /*
   * Fetch a specific building.
   */
  if (id !== null && id !== undefined) {
    const response = await fetch(`/api/players/me/buildings/id/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch building ${id}: ${response.status}`);
    }

    const data = await response.json();

    /*
     * Cache the individual building.
     */
    setCachedData(CACHE_CATEGORY, `id:${id}`, data);

    return data;
  }

  throw new Error("Either id or all must be provided");
}
