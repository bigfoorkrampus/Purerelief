import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../env';
import { fail } from '../lib/response';

type RateLimitOptions = {
  /** Requests allowed per window. */
  limit: number;
  /** Window size in seconds. */
  windowSeconds: number;
  /** Logical bucket name so different routes don't share a counter, e.g. 'login', 'checkout'. */
  bucket: string;
};

/**
 * Fixed-window rate limiter using KV. Not perfectly precise at window boundaries
 * (a burst can occur across the edge of two windows) but this is the standard,
 * cheap tradeoff for edge rate limiting and is more than sufficient to blunt
 * brute-force and scraping attempts against sensitive endpoints.
 */
export function rateLimit(options: RateLimitOptions): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const windowId = Math.floor(Date.now() / 1000 / options.windowSeconds);
    const key = `rl:${options.bucket}:${ip}:${windowId}`;

    const current = await c.env.RATE_LIMIT_KV.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= options.limit) {
      return fail(c, 429, 'RATE_LIMITED', 'Too many requests. Please wait a moment and try again.');
    }

    await c.env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: options.windowSeconds + 5 });
    await next();
  };
}
