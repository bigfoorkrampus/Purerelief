import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../env';
import { verifyJwt } from '../lib/crypto';
import { fail } from '../lib/response';
import type { Permission } from '@pure-relief/shared';

/** Verifies the Bearer access token and attaches the authenticated user to context. Rejects otherwise. */
export const requireAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  const authHeader = c.req.header('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return fail(c, 401, 'UNAUTHENTICATED', 'Sign in to continue.');

  const payload = await verifyJwt(token, c.env.JWT_ACCESS_SECRET);
  if (!payload) return fail(c, 401, 'INVALID_TOKEN', 'Your session has expired. Sign in again.');

  c.set('authUser', {
    id: payload.sub,
    email: payload.email,
    role: payload.role as 'owner' | 'admin' | 'editor' | 'support',
    permissions: payload.permissions,
  });

  await next();
};

/** Requires the authenticated user to hold a specific permission. Must run after requireAuth. */
export function requirePermission(permission: Permission): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const user = c.get('authUser');
    if (!user) return fail(c, 401, 'UNAUTHENTICATED', 'Sign in to continue.');
    if (user.role !== 'owner' && !user.permissions.includes(permission)) {
      return fail(c, 403, 'FORBIDDEN', "You don't have permission to do that.");
    }
    await next();
  };
}
