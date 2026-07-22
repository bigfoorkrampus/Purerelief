import type {
  Review,
  ReviewStatus,
  FAQEntry,
  BlogPost,
  BlogPostStatus,
  Coupon,
  CouponType,
  Paginated,
} from '@pure-relief/shared';
import { generateId } from '../crypto';

// ============================================================================
// Reviews
// ============================================================================

type ReviewRow = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  verified_purchase: number;
  created_at: string;
};

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    authorName: row.author_name,
    rating: row.rating as 1 | 2 | 3 | 4 | 5,
    title: row.title,
    body: row.body,
    status: row.status,
    verifiedPurchase: Boolean(row.verified_purchase),
    createdAt: row.created_at,
  };
}

export async function listReviewsForProduct(db: D1Database, productId: string): Promise<Review[]> {
  const rows = await db
    .prepare(`SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC`)
    .bind(productId)
    .all<ReviewRow>();
  return rows.results.map(mapReview);
}

export async function listAllReviews(
  db: D1Database,
  params: { page: number; pageSize: number; status?: ReviewStatus },
): Promise<Paginated<Review>> {
  const where = params.status ? `WHERE status = ?` : '';
  const bindings = params.status ? [params.status] : [];
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM reviews ${where}`).bind(...bindings).first<{ total: number }>();
  const offset = (params.page - 1) * params.pageSize;
  const rows = await db
    .prepare(`SELECT * FROM reviews ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, params.pageSize, offset)
    .all<ReviewRow>();
  return { items: rows.results.map(mapReview), total: countRow?.total ?? 0, page: params.page, pageSize: params.pageSize };
}

export async function createReview(
  db: D1Database,
  input: { productId: string; authorName: string; authorEmail: string; rating: number; title: string; body: string },
): Promise<Review> {
  const id = generateId('rev');
  await db
    .prepare(
      `INSERT INTO reviews (id, product_id, author_name, author_email, rating, title, body, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(id, input.productId, input.authorName, input.authorEmail, input.rating, input.title, input.body)
    .run();
  return {
    id,
    productId: input.productId,
    authorName: input.authorName,
    rating: input.rating as 1 | 2 | 3 | 4 | 5,
    title: input.title,
    body: input.body,
    status: 'pending',
    verifiedPurchase: false,
    createdAt: new Date().toISOString(),
  };
}

export async function setReviewStatus(db: D1Database, id: string, status: ReviewStatus): Promise<void> {
  await db.prepare(`UPDATE reviews SET status = ? WHERE id = ?`).bind(status, id).run();
  // Recalculate aggregate rating on the parent product
  const row = await db.prepare(`SELECT product_id FROM reviews WHERE id = ?`).bind(id).first<{ product_id: string }>();
  if (!row) return;
  const agg = await db
    .prepare(`SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE product_id = ? AND status = 'approved'`)
    .bind(row.product_id)
    .first<{ avg_rating: number | null; cnt: number }>();
  await db
    .prepare(`UPDATE products SET avg_rating = ?, review_count = ? WHERE id = ?`)
    .bind(agg?.avg_rating ?? 0, agg?.cnt ?? 0, row.product_id)
    .run();
}

// ============================================================================
// Site-wide FAQs
// ============================================================================

type FaqRow = { id: string; question: string; answer: string; category: string; sort_order: number };

export async function listFaqs(db: D1Database): Promise<FAQEntry[]> {
  const rows = await db.prepare(`SELECT * FROM faqs ORDER BY sort_order ASC`).all<FaqRow>();
  return rows.results.map((r) => ({ id: r.id, question: r.question, answer: r.answer, category: r.category, sortOrder: r.sort_order }));
}

export async function createFaq(db: D1Database, input: { question: string; answer: string; category: string; sortOrder: number }): Promise<FAQEntry> {
  const id = generateId('faq');
  await db
    .prepare(`INSERT INTO faqs (id, question, answer, category, sort_order) VALUES (?, ?, ?, ?, ?)`)
    .bind(id, input.question, input.answer, input.category, input.sortOrder)
    .run();
  return { id, ...input };
}

export async function updateFaq(db: D1Database, id: string, input: { question: string; answer: string; category: string; sortOrder: number }): Promise<void> {
  await db
    .prepare(`UPDATE faqs SET question=?, answer=?, category=?, sort_order=?, updated_at=? WHERE id=?`)
    .bind(input.question, input.answer, input.category, input.sortOrder, new Date().toISOString(), id)
    .run();
}

export async function deleteFaq(db: D1Database, id: string): Promise<void> {
  await db.prepare(`DELETE FROM faqs WHERE id = ?`).bind(id).run();
}

// ============================================================================
// Blog posts
// ============================================================================

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_html: string;
  cover_image_key: string | null;
  author_name: string;
  status: BlogPostStatus;
  tags_json: string;
  seo_title: string;
  seo_meta_description: string;
  seo_canonical_path: string;
  seo_og_image_key: string | null;
  seo_no_index: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapBlog(row: BlogRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    contentHtml: row.content_html,
    coverImageKey: row.cover_image_key,
    authorName: row.author_name,
    status: row.status,
    tags: JSON.parse(row.tags_json || '[]'),
    seo: {
      title: row.seo_title,
      metaDescription: row.seo_meta_description,
      canonicalPath: row.seo_canonical_path,
      ogImageKey: row.seo_og_image_key,
      noIndex: Boolean(row.seo_no_index),
    },
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBlogPosts(
  db: D1Database,
  params: { page: number; pageSize: number; status?: BlogPostStatus; search?: string },
): Promise<Paginated<BlogPost>> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (params.status) {
    conditions.push('status = ?');
    bindings.push(params.status);
  }
  if (params.search) {
    conditions.push('(title LIKE ? OR excerpt LIKE ?)');
    bindings.push(`%${params.search}%`, `%${params.search}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRow = await db.prepare(`SELECT COUNT(*) as total FROM blog_posts ${where}`).bind(...bindings).first<{ total: number }>();
  const offset = (params.page - 1) * params.pageSize;
  const rows = await db
    .prepare(`SELECT * FROM blog_posts ${where} ORDER BY COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?`)
    .bind(...bindings, params.pageSize, offset)
    .all<BlogRow>();
  return { items: rows.results.map(mapBlog), total: countRow?.total ?? 0, page: params.page, pageSize: params.pageSize };
}

export async function getBlogPostBySlug(db: D1Database, slug: string): Promise<BlogPost | null> {
  const row = await db.prepare(`SELECT * FROM blog_posts WHERE slug = ?`).bind(slug).first<BlogRow>();
  return row ? mapBlog(row) : null;
}

export type BlogWriteInput = {
  slug: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  coverImageKey?: string | null;
  authorName: string;
  status: BlogPostStatus;
  tags: string[];
  seo: { title: string; metaDescription: string; canonicalPath: string; ogImageKey?: string | null; noIndex?: boolean };
};

export async function createBlogPost(db: D1Database, input: BlogWriteInput): Promise<BlogPost> {
  const id = generateId('post');
  const now = new Date().toISOString();
  const publishedAt = input.status === 'published' ? now : null;
  await db
    .prepare(
      `INSERT INTO blog_posts (id, slug, title, excerpt, content_html, cover_image_key, author_name, status, tags_json,
        seo_title, seo_meta_description, seo_canonical_path, seo_og_image_key, seo_no_index, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.slug,
      input.title,
      input.excerpt,
      input.contentHtml,
      input.coverImageKey ?? null,
      input.authorName,
      input.status,
      JSON.stringify(input.tags),
      input.seo.title,
      input.seo.metaDescription,
      input.seo.canonicalPath,
      input.seo.ogImageKey ?? null,
      input.seo.noIndex ? 1 : 0,
      publishedAt,
      now,
      now,
    )
    .run();
  const post = await getBlogPostBySlug(db, input.slug);
  if (!post) throw new Error('Blog post creation failed');
  return post;
}

export async function updateBlogPost(db: D1Database, id: string, input: BlogWriteInput): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db.prepare(`SELECT status, published_at FROM blog_posts WHERE id = ?`).bind(id).first<{ status: string; published_at: string | null }>();
  const publishedAt =
    input.status === 'published' ? existing?.published_at ?? now : existing?.status === 'published' ? existing.published_at : null;

  await db
    .prepare(
      `UPDATE blog_posts SET slug=?, title=?, excerpt=?, content_html=?, cover_image_key=?, author_name=?, status=?, tags_json=?,
        seo_title=?, seo_meta_description=?, seo_canonical_path=?, seo_og_image_key=?, seo_no_index=?, published_at=?, updated_at=?
       WHERE id=?`,
    )
    .bind(
      input.slug,
      input.title,
      input.excerpt,
      input.contentHtml,
      input.coverImageKey ?? null,
      input.authorName,
      input.status,
      JSON.stringify(input.tags),
      input.seo.title,
      input.seo.metaDescription,
      input.seo.canonicalPath,
      input.seo.ogImageKey ?? null,
      input.seo.noIndex ? 1 : 0,
      publishedAt,
      now,
      id,
    )
    .run();
}

export async function deleteBlogPost(db: D1Database, id: string): Promise<void> {
  await db.prepare(`DELETE FROM blog_posts WHERE id = ?`).bind(id).run();
}

// ============================================================================
// Coupons
// ============================================================================

type CouponRow = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_spend_minor: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: number;
};

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    minSpendMinor: row.min_spend_minor,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at,
    active: Boolean(row.active),
  };
}

export async function listCoupons(db: D1Database): Promise<Coupon[]> {
  const rows = await db.prepare(`SELECT * FROM coupons ORDER BY created_at DESC`).all<CouponRow>();
  return rows.results.map(mapCoupon);
}

export async function getCouponByCode(db: D1Database, code: string): Promise<Coupon | null> {
  const row = await db.prepare(`SELECT * FROM coupons WHERE code = ?`).bind(code.toUpperCase()).first<CouponRow>();
  return row ? mapCoupon(row) : null;
}

export type CouponWriteInput = {
  code: string;
  type: CouponType;
  value: number;
  minSpendMinor?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null;
  active: boolean;
};

export async function createCoupon(db: D1Database, input: CouponWriteInput): Promise<Coupon> {
  const id = generateId('coup');
  await db
    .prepare(
      `INSERT INTO coupons (id, code, type, value, min_spend_minor, max_uses, expires_at, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, input.code, input.type, input.value, input.minSpendMinor ?? null, input.maxUses ?? null, input.expiresAt ?? null, input.active ? 1 : 0)
    .run();
  return {
    id,
    code: input.code,
    type: input.type,
    value: input.value,
    minSpendMinor: input.minSpendMinor ?? null,
    maxUses: input.maxUses ?? null,
    usedCount: 0,
    expiresAt: input.expiresAt ?? null,
    active: input.active,
  };
}

export async function updateCoupon(db: D1Database, id: string, input: CouponWriteInput): Promise<void> {
  await db
    .prepare(
      `UPDATE coupons SET code=?, type=?, value=?, min_spend_minor=?, max_uses=?, expires_at=?, active=?, updated_at=? WHERE id=?`,
    )
    .bind(
      input.code,
      input.type,
      input.value,
      input.minSpendMinor ?? null,
      input.maxUses ?? null,
      input.expiresAt ?? null,
      input.active ? 1 : 0,
      new Date().toISOString(),
      id,
    )
    .run();
}

export async function deleteCoupon(db: D1Database, id: string): Promise<void> {
  await db.prepare(`DELETE FROM coupons WHERE id = ?`).bind(id).run();
}

export async function incrementCouponUsage(db: D1Database, code: string): Promise<void> {
  await db.prepare(`UPDATE coupons SET used_count = used_count + 1 WHERE code = ?`).bind(code.toUpperCase()).run();
}
