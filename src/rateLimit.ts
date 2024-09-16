import { LRUCache } from 'lru-cache';

// Environment variables for rate-limiting settings with fallback values
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '1500', 10);
const RATE_LIMIT_TTL = parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10);
const RATE_LIMIT_COUNT = parseInt(process.env.RATE_LIMIT ?? '100', 10);

// LRU cache to store request count per IP
const rateLimitCache = new LRUCache<string, { count: number; lastRequest: number }>({
  max: RATE_LIMIT_MAX,
  ttl: RATE_LIMIT_TTL,
  ttlAutopurge: true,
});

/**
 * Rate limiting function to track and limit requests from specific IPs.
 * @param ip - The IP address of the incoming request
 * @returns {boolean} - Whether the IP is within the rate limit
 */
export const rateLimit = (ip: string): boolean => {
  const currentTime = Date.now();

  // Retrieve or initialize the entry for the current IP
  const entry = rateLimitCache.get(ip) || {
    count: 0,
    lastRequest: currentTime,
  };

  // Check if the request is within the time window for rate limiting
  if (currentTime - entry.lastRequest < RATE_LIMIT_TTL) {
    entry.count += 1;
  } else {
    entry.count = 1; // Reset count if outside of time window
    entry.lastRequest = currentTime;
  }

  // Store the updated request count and timestamp in the cache
  rateLimitCache.set(ip, entry);

  // Return true if the request count is within the allowed limit, false otherwise
  return entry.count <= RATE_LIMIT_COUNT;
};
