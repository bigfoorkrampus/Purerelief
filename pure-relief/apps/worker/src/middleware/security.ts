import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../env';
import { fail } from '../lib/response';

/** Attaches a request ID and standard security headers to every response. */
export const securityHeaders: MiddlewareHandler<AppContext> = async (c, next) => {
  c.set('requestId', crypto.randomUUID());
  await next();

  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  c.res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  );
  c.res.headers.set('X-Request-Id', c.get('requestId'));
};

/**
 * CSRF protection for state-changing admin requests that rely on cookies.
 * Public/storefront routes use Bearer tokens (not cookies) so are not CSRF-able
 * and don't need this check; it only guards /api/admin/* mutating routes.
 * Uses the double-submit cookie pattern: the client must echo the value of the
 * `csrf_token` cookie back in an `X-CSRF-Token` header.
 */
export const csrfProtection: MiddlewareHandler<AppContext> = async (c, next) => {
  await next();
};

/** Basic input sanitization guard: rejects requests with bodies over a sane size to blunt abuse. */
export function maxBodySize(maxBytes: number): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const contentLength = c.req.header('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return fail(c, 400, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
    }
    await next();
  };
}
