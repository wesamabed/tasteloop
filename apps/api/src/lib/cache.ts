import { lru } from "tiny-lru";
import { logger } from '@tasteloop/observability';

export const cache = lru<string>(1_000, 60_000);

type Loader<T> = (...args: any[]) => Promise<T>;

export function memoize<T>(fn: Loader<T>, max = 1_000, ttl = 1_800_000) {
  const store = lru<T>(max, ttl);
  return async (...args: any[]): Promise<T> => {
    const key = JSON.stringify(args);

    // Log the attempt to retrieve from cache
    logger.debug(`Attempting to retrieve from cache with key: ${key}`);
    const hit = store.get(key);
    if (hit) {
      logger.debug(`Cache hit for key: ${key}`);
      return hit;
    }

    logger.debug(`Cache miss for key: ${key}, invoking original function`);
    
    try {
      const val = await fn(...args);
      store.set(key, val);
      logger.debug(`Caching value for key: ${key}`);
      return val;
    } catch (error) {
      logger.error(`Error while fetching value for key: ${key}`, error);
      throw error;
    }
  };
}
