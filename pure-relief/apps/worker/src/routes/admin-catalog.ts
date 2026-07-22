import { Hono } from 'hono';
import type { AppContext } from '../env';
import { ok, fail } from '../lib/response';
import { requireAuth, requirePermission } from '../middleware/auth';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../lib/repositories/categories';
import { createMediaAsset, listMediaAssets, deleteMediaAsset } from '../lib/repositories/config';
import { generateId } from '../lib/crypto';
import { maxBodySize } from '../middleware/security';

export const adminCategoriesRouter = new Hono<AppContext>();
adminCategoriesRouter.use('*', requireAuth, requirePermission('products.manage'));

adminCategoriesRouter.get('/', async (c) => ok(c, await listCategories(c.env.DB)));

adminCategoriesRouter.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.slug || !body?.name) return fail(c, 400, 'INVALID_REQUEST', 'Slug and name are required.');
  const category = await createCategory(c.env.DB, {
    slug: body.slug,
    name: body.name,
    description: body.description ?? '',
    imageKey: body.imageKey ?? null,
    sortOrder: body.sortOrder ?? 0,
    seo: body.seo ?? { title: body.name, metaDescription: body.description ?? '', canonicalPath: `/shop/${body.slug}` },
  });
  return ok(c, category, 201);
});

adminCategoriesRouter.put('/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.slug || !body?.name) return fail(c, 400, 'INVALID_REQUEST', 'Slug and name are required.');
  await updateCategory(c.env.DB, c.req.param('id'), {
    slug: body.slug,
    name: body.name,
    description: body.description ?? '',
    imageKey: body.imageKey ?? null,
    sortOrder: body.sortOrder ?? 0,
    seo: body.seo ?? { title: body.name, metaDescription: body.description ?? '', canonicalPath: `/shop/${body.slug}` },
  });
  return ok(c, { updated: true });
});

adminCategoriesRouter.delete('/:id', async (c) => {
  await deleteCategory(c.env.DB, c.req.param('id'));
  return ok(c, { deleted: true });
});

// ============================================================================
// Media — uploads go directly to R2, metadata + key stored in D1
// ============================================================================

export const adminMediaRouter = new Hono<AppContext>();
adminMediaRouter.use('*', requireAuth, requirePermission('media.manage'));

const ALLOWED_MIME_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg', 'image/svg+xml', 'image/avif']);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Duck-typed File guard. The Workers runtime's global File is not always usable
 * with `instanceof` under @cloudflare/workers-types, so we check shape instead —
 * this is also more robust if the runtime's File implementation changes.
 */
function isUploadedFile(value: unknown): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    'arrayBuffer' in value &&
    'type' in value &&
    'size' in value &&
    typeof (value as { arrayBuffer: unknown }).arrayBuffer === 'function'
  );
}

adminMediaRouter.get('/', async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '30', 10) || 30));
  const result = await listMediaAssets(c.env.DB, { page, pageSize });
  return ok(c, result);
});

adminMediaRouter.post('/upload', maxBodySize(MAX_UPLOAD_BYTES), async (c) => {
  const formData = await c.req.formData().catch(() => null);
  if (!formData) return fail(c, 400, 'INVALID_UPLOAD', 'No file data received.');

  const file = formData.get('file');
  const altText = String(formData.get('altText') ?? '');
  const widthRaw = formData.get('width');
  const heightRaw = formData.get('height');

  if (!isUploadedFile(file)) return fail(c, 400, 'NO_FILE', 'Attach a file to upload.');
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return fail(c, 400, 'UNSUPPORTED_TYPE', 'Upload a WebP, PNG, JPEG, AVIF, or SVG file.');
  }
  if (file.size > MAX_UPLOAD_BYTES) return fail(c, 400, 'FILE_TOO_LARGE', 'File must be under 10MB.');

  const ext = file.type.split('/')[1]?.replace('svg+xml', 'svg') ?? 'bin';
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${generateId()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  await c.env.MEDIA_BUCKET.put(key, arrayBuffer, { httpMetadata: { contentType: file.type } });

  const authUser = c.get('authUser')!;
  const asset = await createMediaAsset(c.env.DB, {
    r2Key: key,
    altText,
    width: widthRaw ? parseInt(String(widthRaw), 10) : 0,
    height: heightRaw ? parseInt(String(heightRaw), 10) : 0,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedBy: authUser.id,
  });

  return ok(c, asset, 201);
});

adminMediaRouter.delete('/:id', async (c) => {
  const r2Key = await deleteMediaAsset(c.env.DB, c.req.param('id'));
  if (r2Key) await c.env.MEDIA_BUCKET.delete(r2Key);
  return ok(c, { deleted: true });
});

/** Serves a media asset from R2 by key — public read path used by the storefront for real (non-placeholder) images. */
export const mediaServeRouter = new Hono<AppContext>();
mediaServeRouter.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.MEDIA_BUCKET.get(key);
  if (!object) return fail(c, 404, 'NOT_FOUND', 'Asset not found.');

  c.header('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream');
  c.header('Cache-Control', 'public, max-age=31536000, immutable');
  return c.body(object.body);
});
