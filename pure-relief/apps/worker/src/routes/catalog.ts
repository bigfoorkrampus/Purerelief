import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { listCategories, getCategoryBySlug } from '../lib/repositories/categories';
import { listBlogPosts, getBlogPostBySlug, listFaqs } from '../lib/repositories/content';
import { getSiteSettings, listNavLinks, getBanner, getHomepageConfig } from '../lib/repositories/config';
import { contactFormSchema, newsletterSchema } from '@pure-relief/shared';
import { flattenZodErrors } from '../lib/zod-errors';
import { rateLimit } from '../middleware/rate-limit';
import { generateId } from '../lib/crypto';

export const catalogRouter = new Hono<AppContext>();

catalogRouter.get('/categories', async (c) => {
  const categories = await listCategories(c.env.DB);
  return ok(c, categories);
});

catalogRouter.get('/categories/:slug', async (c) => {
  const category = await getCategoryBySlug(c.env.DB, c.req.param('slug'));
  if (!category) return fail(c, 404, 'CATEGORY_NOT_FOUND', "We couldn't find that category.");
  return ok(c, category);
});

catalogRouter.get('/blog', async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '9', 10) || 9));
  const search = url.searchParams.get('search') ?? undefined;
  const result = await listBlogPosts(c.env.DB, { page, pageSize, search, status: 'published' });
  return ok(c, result);
});

catalogRouter.get('/blog/:slug', async (c) => {
  const post = await getBlogPostBySlug(c.env.DB, c.req.param('slug'));
  if (!post || post.status !== 'published') return fail(c, 404, 'POST_NOT_FOUND', "We couldn't find that article.");
  return ok(c, post);
});

catalogRouter.get('/faqs', async (c) => {
  const faqs = await listFaqs(c.env.DB);
  return ok(c, faqs);
});

catalogRouter.get('/site-config', async (c) => {
  const [settings, navLinks, banner, homepage] = await Promise.all([
    getSiteSettings(c.env.DB),
    listNavLinks(c.env.DB),
    getBanner(c.env.DB),
    getHomepageConfig(c.env.DB),
  ]);
  return ok(c, { settings, navLinks, banner, homepage });
});

catalogRouter.post('/contact', rateLimit({ bucket: 'contact-form', limit: 5, windowSeconds: 3600 }), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));

  // Honeypot: if filled, silently accept without persisting (looks successful to the bot).
  if (parsed.data.website) return ok(c, { received: true }, 201);

  await c.env.DB
    .prepare(`INSERT INTO contact_submissions (id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(generateId('contact'), parsed.data.name, parsed.data.email, parsed.data.phone || null, parsed.data.subject, parsed.data.message)
    .run();

  return ok(c, { received: true }, 201);
});

catalogRouter.post('/newsletter', rateLimit({ bucket: 'newsletter', limit: 5, windowSeconds: 3600 }), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Enter a valid email address.', flattenZodErrors(parsed.error));

  await c.env.DB
    .prepare(`INSERT INTO customers (id, email, full_name, marketing_opt_in) VALUES (?, ?, '', 1)
              ON CONFLICT(email) DO UPDATE SET marketing_opt_in = 1`)
    .bind(generateId('cust'), parsed.data.email)
    .run();

  return ok(c, { subscribed: true }, 201);
});
