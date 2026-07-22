import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { loginSchema } from '@pure-relief/shared';
import { flattenZodErrors } from '../lib/zod-errors';
import { getAdminUserByEmail, touchAdminLogin, writeAuditLog } from '../lib/repositories/config';
import { verifyPassword, signJwt, verifyJwt, sha256Hex, generateId } from '../lib/crypto';
import { rateLimit } from '../middleware/rate-limit';
import { requireAuth } from '../middleware/auth';

export const authRouter = new Hono<AppContext>();

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * BUG FIX (root cause of "logs out on refresh" and "cannot save changes"):
 *
 * This was previously `SameSite=Strict`, which blocks the browser from
 * sending the cookie on ANY cross-site request — including ordinary
 * fetch()/XHR calls. The admin frontend (apps/web, deployed on
 * *.pages.dev) and this API (deployed on *.workers.dev) are different
 * origins, so every request from the frontend to the API is a cross-site
 * request from the browser's point of view. With SameSite=Strict:
 *   - POST /api/auth/refresh never received the refresh_token cookie on
 *     page reload, so refresh always failed and the in-memory access
 *     token was lost — looking exactly like being logged out.
 *   - Every admin write (POST/PUT/DELETE under /api/admin/*) never
 *     received the csrf_token cookie, so csrfProtection rejected every
 *     save with 403 CSRF_INVALID before it reached the route handler.
 *
 * Fix: SameSite=None (paired with the required Secure attribute) for
 * production/staging so the cookie is sent on cross-site requests, and
 * SameSite=Lax for local development where frontend and API are usually
 * on the same-site localhost ports without HTTPS.
 */
function cookieAttrs(env: 'production' | 'staging' | 'development') {
  const isDev = env === 'development';
  const sameSite = isDev ? 'Lax' : 'None';
  const secure = !isDev; // SameSite=None requires Secure or browsers drop the cookie
  return `HttpOnly; Path=/; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
}

/** Same reasoning as cookieAttrs, but never HttpOnly — the frontend must
 * read this cookie's value in JS to echo it back as X-CSRF-Token. */
function csrfCookieAttrs(env: 'production' | 'staging' | 'development') {
  const isDev = env === 'development';
  const sameSite = isDev ? 'Lax' : 'None';
  const secure = !isDev;
  return `Path=/; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
}

authRouter.post('/login', rateLimit({ bucket: 'login', limit: 10, windowSeconds: 900 }), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));

  const user = await getAdminUserByEmail(c.env.DB, parsed.data.email);
  // Constant-shape response whether the user exists or not, to avoid user enumeration.
  const dummyHash = 'pbkdf2$100000$00$00';
  const passwordValid = await verifyPassword(parsed.data.password, user?.passwordHash ?? dummyHash);

  if (!user || !user.isActive || !passwordValid) {
    return fail(c, 401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }

  const accessToken = await signJwt(
    { sub: user.id, email: user.email, role: user.role, permissions: user.permissions },
    c.env.JWT_ACCESS_SECRET,
    ACCESS_TOKEN_TTL_SECONDS,
  );
  const refreshToken = await signJwt(
    { sub: user.id, email: user.email, role: user.role, permissions: user.permissions },
    c.env.JWT_REFRESH_SECRET,
    REFRESH_TOKEN_TTL_SECONDS,
  );

  const refreshTokenHash = await sha256Hex(refreshToken + c.env.ADMIN_SESSION_PEPPER);
  const sessionId = generateId('sess');
  await c.env.DB
    .prepare(`INSERT INTO admin_sessions (id, user_id, refresh_token_hash, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(sessionId, user.id, refreshTokenHash, c.req.header('User-Agent') ?? null, new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString())
    .run();

  await touchAdminLogin(c.env.DB, user.id);
  await writeAuditLog(c.env.DB, { userId: user.id, action: 'login', entityType: 'admin_user', entityId: user.id });

  const csrfToken = generateId('csrf');
  const attrs = cookieAttrs(c.env.ENVIRONMENT);
  const csrfAttrs = csrfCookieAttrs(c.env.ENVIRONMENT);
  c.header('Set-Cookie', `refresh_token=${refreshToken}; ${attrs}; Max-Age=${REFRESH_TOKEN_TTL_SECONDS}`, { append: true });
  c.header('Set-Cookie', `csrf_token=${csrfToken}; ${csrfAttrs}; Max-Age=${REFRESH_TOKEN_TTL_SECONDS}`, { append: true });

  return ok(c, {
    accessToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, permissions: user.permissions },
  });
});

authRouter.post('/refresh', async (c) => {
  const cookieHeader = c.req.header('Cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  const refreshToken = match?.[1];
  if (!refreshToken) return fail(c, 401, 'NO_REFRESH_TOKEN', 'Sign in again to continue.');

  const payload = await verifyJwt(refreshToken, c.env.JWT_REFRESH_SECRET);
  if (!payload) return fail(c, 401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Sign in again.');

  const tokenHash = await sha256Hex(refreshToken + c.env.ADMIN_SESSION_PEPPER);
  const session = await c.env.DB
    .prepare(`SELECT * FROM admin_sessions WHERE user_id = ? AND refresh_token_hash = ? AND revoked_at IS NULL AND expires_at > datetime('now')`)
    .bind(payload.sub, tokenHash)
    .first();
  if (!session) return fail(c, 401, 'SESSION_REVOKED', 'Your session has expired. Sign in again.');

  const accessToken = await signJwt(
    { sub: payload.sub, email: payload.email, role: payload.role, permissions: payload.permissions },
    c.env.JWT_ACCESS_SECRET,
    ACCESS_TOKEN_TTL_SECONDS,
  );

  return ok(c, { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS });
});

authRouter.post('/logout', requireAuth, async (c) => {
  const cookieHeader = c.req.header('Cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  const refreshToken = match?.[1];

  if (refreshToken) {
    const tokenHash = await sha256Hex(refreshToken + c.env.ADMIN_SESSION_PEPPER);
    await c.env.DB.prepare(`UPDATE admin_sessions SET revoked_at = datetime('now') WHERE refresh_token_hash = ?`).bind(tokenHash).run();
  }

  const attrs = cookieAttrs(c.env.ENVIRONMENT);
  const csrfAttrs = csrfCookieAttrs(c.env.ENVIRONMENT);
  c.header('Set-Cookie', `refresh_token=; ${attrs}; Max-Age=0`, { append: true });
  c.header('Set-Cookie', `csrf_token=; ${csrfAttrs}; Max-Age=0`, { append: true });

  return ok(c, { loggedOut: true });
});

authRouter.get('/me', requireAuth, async (c) => {
  const authUser = c.get('authUser')!;
  return ok(c, authUser);
});
