import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { requireAuth, requirePermission } from '../middleware/auth';
import { listBlogPosts, getBlogPostBySlug, createBlogPost, updateBlogPost, deleteBlogPost } from '../lib/repositories/content';
import { blogPostInputSchema } from '@pure-relief/shared';
import { flattenZodErrors } from '../lib/zod-errors';
import { writeAuditLog } from '../lib/repositories/config';

export const adminBlogRouter = new Hono<AppContext>();
adminBlogRouter.use('*', requireAuth, requirePermission('blog.manage'));

adminBlogRouter.get('/', async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20));
  const search = url.searchParams.get('search') ?? undefined;
  const status = (url.searchParams.get('status') ?? undefined) as 'draft' | 'published' | undefined;
  const result = await listBlogPosts(c.env.DB, { page, pageSize, search, status });
  return ok(c, result);
});

adminBlogRouter.get('/:slug', async (c) => {
  const post = await getBlogPostBySlug(c.env.DB, c.req.param('slug'));
  if (!post) return fail(c, 404, 'POST_NOT_FOUND', 'Post not found.');
  return ok(c, post);
});

adminBlogRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = blogPostInputSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));

  const existing = await getBlogPostBySlug(c.env.DB, parsed.data.slug);
  if (existing) return fail(c, 409, 'SLUG_TAKEN', 'A post with this URL slug already exists.', { slug: 'This slug is already in use' });

  const post = await createBlogPost(c.env.DB, parsed.data);
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'create', entityType: 'blog_post', entityId: post.id });
  return ok(c, post, 201);
});

adminBlogRouter.put('/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = blogPostInputSchema.safeParse(body);
  if (!parsed.success) return fail(c, 422, 'VALIDATION_ERROR', 'Check the highlighted fields.', flattenZodErrors(parsed.error));

  await updateBlogPost(c.env.DB, c.req.param('id'), parsed.data);
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'update', entityType: 'blog_post', entityId: c.req.param('id') });
  return ok(c, { updated: true });
});

adminBlogRouter.delete('/:id', async (c) => {
  await deleteBlogPost(c.env.DB, c.req.param('id'));
  const authUser = c.get('authUser')!;
  await writeAuditLog(c.env.DB, { userId: authUser.id, action: 'delete', entityType: 'blog_post', entityId: c.req.param('id') });
  return ok(c, { deleted: true });
});
