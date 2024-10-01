import { LRUCache } from 'lru-cache';

// Environment variables for rate-limiting settings with fallback values
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '1500', 10);
const RATE_LIMIT_TTL = parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10); // 1 minute
const RATE_LIMIT_COUNT = parseInt(process.env.RATE_LIMIT_COUNT ?? '100', 10); // Max requests allowed within the TTL

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
  let entry = rateLimitCache.get(ip);

  // Initialize the entry if not present
  if (!entry) {
    entry = { count: 1, lastRequest: currentTime };
  } else {
    // Check if the current time is outside of the TTL window
    if (currentTime - entry.lastRequest > RATE_LIMIT_TTL) {
      // If outside the window, reset the count and timestamp
      entry.count = 1;
      entry.lastRequest = currentTime;
    } else {
      // Otherwise, increment the count for this IP
      entry.count += 1;
    }
  }

  // Store the updated entry back in the cache with a fresh TTL
  rateLimitCache.set(ip, entry);

  // Check if the IP's request count exceeds the allowed limit
  return entry.count <= RATE_LIMIT_COUNT;
};
