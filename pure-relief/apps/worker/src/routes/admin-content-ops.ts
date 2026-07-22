import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { requireAuth, requirePermission } from '../middleware/auth';
import { listAllReviews, setReviewStatus, listFaqs, createFaq, updateFaq, deleteFaq, listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../lib/repositories/content';
import { faqInputSchema, couponInputSchema } from '@pure-relief/shared';
import { flattenZodErrors } from '../lib/zod-errors';
import { writeAuditLog } from '../lib/repositories/config';

// ============================================================================
// Reviews moderation
// ============================================================================

export const adminReviewsRouter = new Hono<AppContext>();
adminReviewsRouter.use('*', requireAuth, requirePermission('reviews.manage'));

adminReviewsRouter.get('/', async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20));
  const status = (url.searchParams.get('status') ?? undefined) as 'pending' | 'approved' | 'rejected' | undefined;
  return ok(c, await listAllReviews(c.env.DB, { page, pageSize, status }));
});

adminReviewsRouter.post('/:id/status', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    return fail(c, 400, 'INVALID_STATUS', 'Status must be pending, approved, or rejected.');
  }
  await setReviewStatus(c.env.DB, c.req.param('id'), body.status);
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'moderate', entityType: 'review', entityId: c.req.param('id'), diff: { status: body.status } });
  return ok(c, { updated: true });
});

// ============================================================================
// Site FAQ
// ============================================================================

export const adminFaqRouter = new Hono<AppContext>();
adminFaqRouter.use('*', requireAuth, requirePermission('settings.manage'));

adminFaqRouter.get('/', async (c) => ok(c, await listFaqs(c.env.DB)));

adminFaqRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = faqInputSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));
  const faq = await createFaq(c.env.DB, parsed.data);
  return ok(c, faq, 201);
});

adminFaqRouter.put('/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = faqInputSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));
  await updateFaq(c.env.DB, c.req.param('id'), parsed.data);
  return ok(c, { updated: true });
});

adminFaqRouter.delete('/:id', async (c) => {
  await deleteFaq(c.env.DB, c.req.param('id'));
  return ok(c, { deleted: true });
});

// ============================================================================
// Coupons
// ============================================================================

export const adminCouponsRouter = new Hono<AppContext>();
adminCouponsRouter.use('*', requireAuth, requirePermission('coupons.manage'));

adminCouponsRouter.get('/', async (c) => ok(c, await listCoupons(c.env.DB)));

adminCouponsRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = couponInputSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));

  const existing = await c.env.DB.prepare(`SELECT id FROM coupons WHERE code = ?`).bind(parsed.data.code).first();
  if (existing) return fail(c, 409, 'CODE_TAKEN', 'A coupon with this code already exists.', { code: 'This code is already in use' });

  const coupon = await createCoupon(c.env.DB, {
    code: parsed.data.code,
    type: parsed.data.type,
    value: parsed.data.value,
    minSpendMinor: parsed.data.minSpendMinor ?? null,
    maxUses: parsed.data.maxUses ?? null,
    expiresAt: parsed.data.expiresAt ?? null,
    active: parsed.data.active,
  });
  return ok(c, coupon, 201);
});

adminCouponsRouter.put('/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = couponInputSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));
  await updateCoupon(c.env.DB, c.req.param('id'), {
    code: parsed.data.code,
    type: parsed.data.type,
    value: parsed.data.value,
    minSpendMinor: parsed.data.minSpendMinor ?? null,
    maxUses: parsed.data.maxUses ?? null,
    expiresAt: parsed.data.expiresAt ?? null,
    active: parsed.data.active,
  });
  return ok(c, { updated: true });
});

adminCouponsRouter.delete('/:id', async (c) => {
  await deleteCoupon(c.env.DB, c.req.param('id'));
  return ok(c, { deleted: true });
});
