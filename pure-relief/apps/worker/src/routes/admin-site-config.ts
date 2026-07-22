import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { requireAuth, requirePermission } from '../middleware/auth';
import {
  getSiteSettings,
  updateSiteSettings,
  listNavLinks,
  replaceNavLinks,
  getBanner,
  updateBanner,
  getHomepageConfig,
  updateHomepageConfig,
} from '../lib/repositories/config';
import { writeAuditLog } from '../lib/repositories/config';

export const adminSettingsRouter = new Hono<AppContext>();
adminSettingsRouter.use('*', requireAuth, requirePermission('settings.manage'));

adminSettingsRouter.get('/', async (c) => ok(c, await getSiteSettings(c.env.DB)));

adminSettingsRouter.put('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.siteName || !body?.contactEmail) return fail(c, 400, 'INVALID_REQUEST', 'Site name and contact email are required.');
  await updateSiteSettings(c.env.DB, {
    siteName: body.siteName,
    supportPhone: body.supportPhone ?? '',
    supportWhatsApp: body.supportWhatsApp ?? '',
    contactEmail: body.contactEmail,
    addressLine: body.addressLine ?? '',
    googleAnalyticsId: body.googleAnalyticsId ?? null,
    googleSearchConsoleVerification: body.googleSearchConsoleVerification ?? null,
    socialLinks: body.socialLinks ?? [],
  });
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'update', entityType: 'site_settings' });
  return ok(c, { updated: true });
});

export const adminNavRouter = new Hono<AppContext>();
adminNavRouter.use('*', requireAuth, requirePermission('settings.manage'));

adminNavRouter.get('/', async (c) => ok(c, await listNavLinks(c.env.DB)));

adminNavRouter.put('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!Array.isArray(body?.links)) return fail(c, 400, 'INVALID_REQUEST', 'Provide a links array.');
  await replaceNavLinks(c.env.DB, body.links);
  return ok(c, { updated: true });
});

export const adminBannerRouter = new Hono<AppContext>();
adminBannerRouter.use('*', requireAuth, requirePermission('settings.manage'));

adminBannerRouter.get('/', async (c) => ok(c, await getBanner(c.env.DB)));

adminBannerRouter.put('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (typeof body?.enabled !== 'boolean' || typeof body?.message !== 'string') {
    return fail(c, 400, 'INVALID_REQUEST', 'Provide enabled and message fields.');
  }
  await updateBanner(c.env.DB, {
    enabled: body.enabled,
    message: body.message,
    linkHref: body.linkHref ?? null,
    backgroundColor: body.backgroundColor ?? '#2563EB',
    textColor: body.textColor ?? '#FFFFFF',
  });
  return ok(c, { updated: true });
});

export const adminHomepageRouter = new Hono<AppContext>();
adminHomepageRouter.use('*', requireAuth, requirePermission('settings.manage'));

adminHomepageRouter.get('/', async (c) => ok(c, await getHomepageConfig(c.env.DB)));

adminHomepageRouter.put('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!Array.isArray(body?.sections)) return fail(c, 400, 'INVALID_REQUEST', 'Provide a sections array.');
  await updateHomepageConfig(c.env.DB, body.sections);
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'update', entityType: 'homepage_config' });
  return ok(c, { updated: true });
});
