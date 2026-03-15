/**
 * Simple client-side caching utility with TTL and stale-while-revalidate.
 */

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private prefix = 'skillswap_cache_';

  /**
   * Get data from cache (memory or localStorage)
   */
  get<T>(key: string): T | null {
    const fullKey = this.prefix + key;

    // Hierarchical Caching:
    // 1. First check the fast in-memory cache (memoryCache).
    const memEntry = this.memoryCache.get(fullKey);
    if (memEntry) {
      if (Date.now() < memEntry.expiry) {
        return memEntry.data as T;
      }
      this.memoryCache.delete(fullKey);
    }

    // 2. Check persistent localStorage if memory miss or expired.
    // This allows cache persistence across page refreshes.
    if (typeof window !== 'undefined') {
      try {
        const localData = localStorage.getItem(fullKey);
        if (localData) {
          const entry: CacheEntry<T> = JSON.parse(localData);
          if (Date.now() < entry.expiry) {
            // Restore to memory cache for faster subsequent access
            this.memoryCache.set(fullKey, entry);
            return entry.data;
          }
          localStorage.removeItem(fullKey);
        }
      } catch (e) {
        console.error('Cache read error:', e);
      }
    }

    return null;
  }

  /**
   * Set data to cache
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const fullKey = this.prefix + key;
    const entry: CacheEntry<T> = {
      data,
      expiry: Date.now() + ttlMs,
    };

    // Update memory
    this.memoryCache.set(fullKey, entry);

    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch (e) {
        console.error('Cache write error:', e);
      }
    }
  }

  /**
   * Invalidate a specific key or all keys starting with a prefix
   */
  invalidate(key: string, isPrefix = false): void {
    const fullKey = this.prefix + key;

    if (isPrefix) {
      // In-memory
      for (const k of this.memoryCache.keys()) {
        if (k.startsWith(fullKey)) this.memoryCache.delete(k);
      }
      // LocalStorage
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(fullKey)) {
            localStorage.removeItem(k);
            i--; // Adjust index after removal
          }
        }
      }
    } else {
      this.memoryCache.delete(fullKey);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(fullKey);
      }
    }
  }

  /**
   * Stale-While-Revalidate pattern:
   * Returns cached data if available and not expired. 
   * Otherwise, fetches fresh data, updates the cache, and returns it.
   * 
   * Future Enhancement: Could return stale data immediately while triggering 
   * a background refresh if slightly past expiry.
   */
  async swr<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);

    if (cached) {
      return cached;
    }

    const freshData = await fetcher();
    this.set(key, freshData, ttlMs);
    return freshData;
  }
}

export const cache = new CacheService();

export const CACHE_TTL = {
  USER_PROFILE: 10 * 60 * 1000,    // 10 minutes
  REVIEWS: 5 * 60 * 1000,         // 5 minutes
  MATCHES: 2 * 60 * 1000,         // 2 minutes
  MODELS: 60 * 60 * 1000,         // 1 hour
};
