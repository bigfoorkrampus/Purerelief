import type { Category } from '@pure-relief/shared';
import { generateId } from '../crypto';

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_key: string | null;
  seo_title: string;
  seo_meta_description: string;
  seo_canonical_path: string;
  seo_og_image_key: string | null;
  seo_no_index: number;
};

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageKey: row.image_key,
    seo: {
      title: row.seo_title,
      metaDescription: row.seo_meta_description,
      canonicalPath: row.seo_canonical_path,
      ogImageKey: row.seo_og_image_key,
      noIndex: Boolean(row.seo_no_index),
    },
  };
}

export async function listCategories(db: D1Database): Promise<Category[]> {
  const rows = await db.prepare(`SELECT * FROM categories ORDER BY sort_order ASC, name ASC`).all<CategoryRow>();
  return rows.results.map(mapRow);
}

export async function getCategoryBySlug(db: D1Database, slug: string): Promise<Category | null> {
  const row = await db.prepare(`SELECT * FROM categories WHERE slug = ?`).bind(slug).first<CategoryRow>();
  return row ? mapRow(row) : null;
}

export type CategoryWriteInput = {
  slug: string;
  name: string;
  description: string;
  imageKey?: string | null;
  sortOrder?: number;
  seo: { title: string; metaDescription: string; canonicalPath: string; ogImageKey?: string | null; noIndex?: boolean };
};

export async function createCategory(db: D1Database, input: CategoryWriteInput): Promise<Category> {
  const id = generateId('cat');
  await db
    .prepare(
      `INSERT INTO categories (id, slug, name, description, image_key, sort_order,
        seo_title, seo_meta_description, seo_canonical_path, seo_og_image_key, seo_no_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.slug,
      input.name,
      input.description,
      input.imageKey ?? null,
      input.sortOrder ?? 0,
      input.seo.title,
      input.seo.metaDescription,
      input.seo.canonicalPath,
      input.seo.ogImageKey ?? null,
      input.seo.noIndex ? 1 : 0,
    )
    .run();
  return { id, slug: input.slug, name: input.name, description: input.description, imageKey: input.imageKey ?? null, seo: input.seo as Category['seo'] };
}

export async function updateCategory(db: D1Database, id: string, input: CategoryWriteInput): Promise<void> {
  await db
    .prepare(
      `UPDATE categories SET slug=?, name=?, description=?, image_key=?, sort_order=?,
        seo_title=?, seo_meta_description=?, seo_canonical_path=?, seo_og_image_key=?, seo_no_index=?, updated_at=?
       WHERE id=?`,
    )
    .bind(
      input.slug,
      input.name,
      input.description,
      input.imageKey ?? null,
      input.sortOrder ?? 0,
      input.seo.title,
      input.seo.metaDescription,
      input.seo.canonicalPath,
      input.seo.ogImageKey ?? null,
      input.seo.noIndex ? 1 : 0,
      new Date().toISOString(),
      id,
    )
    .run();
}

export async function deleteCategory(db: D1Database, id: string): Promise<void> {
  await db.prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run();
}
