const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// In-memory cache.
// This avoids reading localStorage repeatedly during the same page session.
const memoryCache = new Map();

export function getCachedData(cacheCategory, cacheKey) {
  const now = Date.now();

  // Check memory cache first
  const memoryCached = memoryCache.get(`${cacheCategory}:${cacheKey}`);

  if (memoryCached) {
    if (now - memoryCached.timestamp < CACHE_DURATION) {
      return memoryCached.data;
    }

    memoryCache.delete(`${cacheCategory}:${cacheKey}`);
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem(`${cacheCategory}:${cacheKey}`);

    if (!stored) {
      return null;
    }

    const cached = JSON.parse(stored);

    if (cached.timestamp && now - cached.timestamp < CACHE_DURATION) {
      // Put it into memory cache as well
      memoryCache.set(`${cacheCategory}:${cacheKey}`, cached);

      return cached.data;
    }

    // Expired
    localStorage.removeItem(`${cacheCategory}:${cacheKey}`);
  } catch (error) {
    console.warn(`Failed to read cache "${cacheKey}":`, error);
  }

  return null;
}

export function setCachedData(cacheCategory, cacheKey, data) {
  const cached = {
    timestamp: Date.now(),
    data,
  };

  // Memory cache
  memoryCache.set(`${cacheCategory}:${cacheKey}`, cached);

  // Persistent browser cache
  try {
    localStorage.setItem(
      `${cacheCategory}:${cacheKey}`,
      JSON.stringify(cached),
    );
  } catch (error) {
    console.warn(`Failed to save cache "${cacheKey}":`, error);
  }
}
