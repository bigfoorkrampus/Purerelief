import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { requireAuth, requirePermission } from '../middleware/auth';
import { listAdminUsers, createAdminUser, updateAdminUserRole, deactivateAdminUser, getAdminUserByEmail, writeAuditLog } from '../lib/repositories/config';
import { userInviteSchema } from '@pure-relief/shared';
import { flattenZodErrors } from '../lib/zod-errors';
import { hashPassword, generateId } from '../lib/crypto';

export const adminUsersRouter = new Hono<AppContext>();
adminUsersRouter.use('*', requireAuth, requirePermission('users.manage'));

adminUsersRouter.get('/', async (c) => ok(c, await listAdminUsers(c.env.DB)));

/**
 * Creates a new admin user with a temporary password. In production, wire this to
 * an email-send step (e.g. via a transactional email provider) so the temp password
 * is delivered out-of-band rather than returned in the API response. Returned here
 * only because no email provider is configured in this build.
 */
adminUsersRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = userInviteSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));

  const existing = await getAdminUserByEmail(c.env.DB, parsed.data.email);
  if (existing) return fail(c, 409, 'EMAIL_TAKEN', 'A user with this email already exists.', { email: 'This email is already registered' });

  const tempPassword = generateId().replace(/-/g, '').slice(0, 16);
  const passwordHash = await hashPassword(tempPassword);

  const user = await createAdminUser(c.env.DB, {
    email: parsed.data.email,
    fullName: parsed.data.fullName,
    passwordHash,
    role: parsed.data.role,
  });

  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'invite', entityType: 'admin_user', entityId: user.id });

  return ok(c, { user, temporaryPassword: tempPassword }, 201);
});

adminUsersRouter.put('/:id/role', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.role || !['owner', 'admin', 'editor', 'support'].includes(body.role)) {
    return fail(c, 400, 'INVALID_ROLE', 'Provide a valid role.');
  }
  await updateAdminUserRole(c.env.DB, c.req.param('id'), body.role);
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'role_change', entityType: 'admin_user', entityId: c.req.param('id'), diff: { role: body.role } });
  return ok(c, { updated: true });
});

adminUsersRouter.delete('/:id', async (c) => {
  const authUser = c.get('authUser')!;
  if (authUser.id === c.req.param('id')) {
    return fail(c, 400, 'CANNOT_DEACTIVATE_SELF', "You can't deactivate your own account.");
  }
  await deactivateAdminUser(c.env.DB, c.req.param('id'));
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'deactivate', entityType: 'admin_user', entityId: c.req.param('id') });
  return ok(c, { deactivated: true });
});

export const adminAuditRouter = new Hono<AppContext>();
adminAuditRouter.use('*', requireAuth, requirePermission('users.manage'));

adminAuditRouter.get('/', async (c) => {
  const url = new URL(c.req.url);
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10) || 50));
  const rows = await c.env.DB
    .prepare(`SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT ?`)
    .bind(limit)
    .all();
  return ok(c, rows.results);
});
