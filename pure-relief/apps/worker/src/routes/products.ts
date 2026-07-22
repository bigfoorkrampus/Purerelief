import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { listProducts, getProductBySlug, getProductById } from '../lib/repositories/products';
import { listReviewsForProduct, createReview } from '../lib/repositories/content';
import { reviewSubmissionSchema } from '@pure-relief/shared';
import { rateLimit } from '../middleware/rate-limit';
import { flattenZodErrors } from '../lib/zod-errors';

export const productsRouter = new Hono<AppContext>();

productsRouter.get('/', async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '12', 10) || 12));
  const search = url.searchParams.get('search') ?? undefined;
  const categoryId = url.searchParams.get('categoryId') ?? undefined;
  const sort = (url.searchParams.get('sort') ?? undefined) as
    | 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | undefined;

  const result = await listProducts(c.env.DB, { page, pageSize, search, categoryId, sort, status: 'published' });
  return ok(c, result);
});

productsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const product = await getProductBySlug(c.env.DB, slug);
  if (!product || product.status !== 'published') {
    return fail(c, 404, 'PRODUCT_NOT_FOUND', "We couldn't find that product.");
  }
  return ok(c, product);
});

productsRouter.get('/:slug/reviews', async (c) => {
  const slug = c.req.param('slug');
  const product = await getProductBySlug(c.env.DB, slug);
  if (!product) return fail(c, 404, 'PRODUCT_NOT_FOUND', "We couldn't find that product.");
  const reviews = await listReviewsForProduct(c.env.DB, product.id);
  return ok(c, reviews);
});

productsRouter.post('/:slug/reviews', rateLimit({ bucket: 'review-submit', limit: 5, windowSeconds: 3600 }), async (c) => {
  const slug = c.req.param('slug');
  const product = await getProductBySlug(c.env.DB, slug);
  if (!product) return fail(c, 404, 'PRODUCT_NOT_FOUND', "We couldn't find that product.");

  const body = await c.req.json().catch(() => null);
  const parsed = reviewSubmissionSchema.omit({ productId: true }).safeParse(body);
  if (!parsed.success) {
    return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));
  }

  const review = await createReview(c.env.DB, {
    productId: product.id,
    authorName: parsed.data.authorName,
    authorEmail: parsed.data.email,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
  });

  return ok(c, review, 201);
});

productsRouter.get('/by-id/:id', async (c) => {
  const product = await getProductById(c.env.DB, c.req.param('id'));
  if (!product) return fail(c, 404, 'PRODUCT_NOT_FOUND', "We couldn't find that product.");
  return ok(c, product);
});
